import axios from "axios";

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ?? "/apptrip-api/api/v1";

const AUTH_STORAGE_KEY = "apptrip_token";
const SESSION_STORAGE_KEY = "apptrip_session";

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

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes("/users-auth")) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(SESSION_STORAGE_KEY);
      window.dispatchEvent(new Event("apptrip:session-expired"));
    }
    return Promise.reject(error);
  }
);

export { AUTH_STORAGE_KEY, SESSION_STORAGE_KEY };
