import axios from "axios";

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "");
const baseURL = configuredBaseUrl || "/api";

const API = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 30000,
});

const AUTH_ENDPOINTS = [
  "/auth/login",
  "/auth/setup",
  "/auth/change-password",
  "/auth/reset-password",
  "/auth/logout",
  "/auth/me",
];

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || "";
    const isAuthRequest = AUTH_ENDPOINTS.some((endpoint) =>
      requestUrl.includes(endpoint),
    );

    if (error.response?.status === 401 && !isAuthRequest) {
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  },
);

export default API;
