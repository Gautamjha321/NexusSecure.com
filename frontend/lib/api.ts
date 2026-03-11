import axios from "axios";
import type { AxiosError, AxiosRequestConfig } from "axios";

import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from "./tokenStorage";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/";

const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

export const refreshAccessToken = async (): Promise<string | null> => {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  try {
    const response = await axios.post(`${baseURL}refresh/`, { refresh });
    const newAccess = response.data?.access;
    const newRefresh = response.data?.refresh ?? refresh;

    if (newAccess) {
      setTokens(newAccess, newRefresh);
      return newAccess as string;
    }
  } catch {
    clearTokens();
  }

  return null;
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    const requestUrl = String(originalRequest.url || "");
    if (requestUrl.includes("refresh/")) {
      clearTokens();
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    refreshPromise = refreshPromise ?? refreshAccessToken();
    const newToken = await refreshPromise;
    refreshPromise = null;

    if (newToken) {
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    }

    return Promise.reject(error);
  }
);

export default api;
