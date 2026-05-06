import axios from "axios";

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ?? "/apptrip-api/api/v1";

const AUTH_STORAGE_KEY = "apptrip_token";

export const http = axios.create({
  baseURL: apiBaseUrl
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_STORAGE_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export { AUTH_STORAGE_KEY };
