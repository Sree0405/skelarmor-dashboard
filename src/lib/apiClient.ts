import axios, { type AxiosError, type AxiosInstance } from "axios";
import { API_BASE_URL } from "@/config/env";
import { getAccessToken } from "@/lib/authToken";

const jsonHeaders = { "Content-Type": "application/json" };

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: jsonHeaders,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const url = String(error.config?.url ?? "");
    if (status !== 401 || url.includes("/auth/login")) {
      return Promise.reject(error);
    }
    const { useAuthStore } = await import("@/features/Login/store");
    await useAuthStore.getState().logout();
    return Promise.reject(error);
  }
);

export const authPublicApi: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: jsonHeaders,
});
