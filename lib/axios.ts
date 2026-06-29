import axios, { AxiosInstance, AxiosError } from "axios";
import { AUTH_TOKEN_KEY, clearAuthSession } from "./auth";

// Create axios instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL ||
    "https://bibleplus-backend-nhyo.onrender.com/api",
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem(AUTH_TOKEN_KEY)
        : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle specific error codes
    if (error.response?.status === 401) {
      // Unauthorized - clear auth and redirect to login
      if (typeof window !== "undefined") {
        clearAuthSession();
        window.location.href = "/";
      }
    }

    if (error.response?.status === 403) {
      // Forbidden
      console.error("Access forbidden");
    }

    if (error.response?.status === 404) {
      // Not found
      console.error("Resource not found");
    }

    if (error.response?.status === 500) {
      // Server error
      console.error("Server error");
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
