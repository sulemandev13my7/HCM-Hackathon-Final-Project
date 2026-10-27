import axios from "axios";

const baseURL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

const API = axios.create({
  baseURL,
  timeout: 30000,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const AUTH_ENDPOINTS = [
  "/auth/login",
  "/auth/setup",
  "/auth/change-password",
  "/auth/reset-password",
];

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || "";
    const isAuthRequest = AUTH_ENDPOINTS.some((endpoint) =>
      requestUrl.includes(endpoint),
    );
    const hasToken = Boolean(localStorage.getItem("token"));

    if (error.response?.status === 401 && hasToken && !isAuthRequest) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  },
);

export default API;
