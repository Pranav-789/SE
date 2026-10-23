import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { API } from "@/constants/api";
import { useAuthStore } from "@/store/auth.store";

const apiClient = axios.create({
    baseURL: API.BASE_URL,
    withCredentials: true,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// We need to extend InternalAxiosRequestConfig to include _retry
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as CustomAxiosRequestConfig;
        
        // If no config or if the error is not 401, reject immediately
        if (!originalRequest || !error.response || error.response.status !== 401) {
            return Promise.reject(error);
        }

        // If the request that failed with 401 was the refresh token request itself,
        // it means the refresh token is expired or invalid.
        if (originalRequest.url === `${API.AUTH}/refresh`) {
            useAuthStore.getState().logout();

            if (typeof window !== "undefined" && window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
            return Promise.reject(error);
        }

        // If the error is 401 and we haven't already retried this request
        if (error.response.status === 401 && !originalRequest._retry) {
            
            if (isRefreshing) {
                // If a refresh is already in progress, put this request in a queue
                // Wait until the refresh succeeds, then retry the request
                return new Promise(function(resolve, reject) {
                    failedQueue.push({ resolve, reject });
                })
                .then(() => {
                    return apiClient(originalRequest);
                })
                .catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Use a raw axios instance to avoid interceptor loops
                await axios.post(`${API.BASE_URL}${API.AUTH}/refresh`, {}, {
                    withCredentials: true
                });

                // Refresh was successful, process queued requests
                processQueue(null);

                // Retry the original failed request
                return apiClient(originalRequest);
            } catch (refreshError) {
                // Refresh failed
                processQueue(refreshError, null);
                
                useAuthStore.getState().logout();
                if (typeof window !== "undefined" && window.location.pathname !== "/login") {
                    window.location.href = "/login";
                }
                
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;