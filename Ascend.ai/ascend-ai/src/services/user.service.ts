import apiClient from "@/lib/axios";
import { API } from "@/constants/api";
import { User } from "@/types/auth";

export const userService = {
  me: async () => {
    const response = await apiClient.get<User>(`${API.USERS}/me`);
    return response.data;
  }
};