import apiClient from "@/lib/axios";
import { API } from "@/constants/api";

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface EmailPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  new_password: string;
}

export const authService = {
  register: (payload: RegisterPayload) =>
    apiClient.post(`${API.AUTH}/register`, payload),

  login: (payload: LoginPayload) =>
    apiClient.post(`${API.AUTH}/login`, payload),

  refresh: () =>
    apiClient.post(`${API.AUTH}/refresh`),

  verifyEmail: (token: string) =>
    apiClient.get(`${API.AUTH}/verify-email`, {
      params: { token },
    }),

  resendVerification: (payload: EmailPayload) =>
    apiClient.post(`${API.AUTH}/resend-verification-email`, payload),

  requestPasswordReset: (payload: EmailPayload) =>
    apiClient.post(`${API.AUTH}/request-password-reset`, payload),

  resetPassword: (payload: ResetPasswordPayload) =>
    apiClient.post(`${API.AUTH}/reset-password`, payload),

  logout: () =>
    apiClient.post(`${API.AUTH}/logout`),

  requestResendVerification: (payload: EmailPayload) => {
    apiClient.post(`${API.AUTH}/resend-verification-email`, payload);
  }
};