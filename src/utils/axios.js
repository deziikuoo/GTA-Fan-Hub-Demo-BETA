import axios from "axios";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: "http://localhost:3003", // Adjust this to match your server port
  timeout: 30000, // Increased to 30 seconds
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
  withCredentials: true, // Include cookies for refresh token
  headers: {
    "Content-Type": "application/json",
  },
});

// Create a separate axios instance for refresh calls to avoid circular dependency
const refreshApi = axios.create({
  baseURL: "http://localhost:3003",
  timeout: 30000,
  withCredentials: true, // Always include cookies for refresh calls
});

// Mutex to prevent concurrent token refresh requests
let isRefreshing = false;
let failedQueue = [];

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Helper functions for queue management
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor to handle errors and token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Token refresh already in progress, queue this request
        console.log("[Axios] Token refresh in progress, queueing request");
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log("[Axios] Attempting reactive token refresh");
        // Attempt to refresh the token
        const refreshResponse = await refreshApi.post("/api/refresh-token");

        if (refreshResponse.data.accessToken) {
          const newToken = refreshResponse.data.accessToken;
          // Store new access token
          localStorage.setItem("accessToken", newToken);
          console.log("[Axios] Token refreshed successfully (reactive)");

          // Process queued requests
          processQueue(null, newToken);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          isRefreshing = false;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error("[Axios] Token refresh failed:", refreshError);
        // Process queue with error
        processQueue(refreshError, null);
        isRefreshing = false;

        // Refresh failed, clear tokens and redirect
        localStorage.removeItem("accessToken");
        localStorage.removeItem("gtafanhub-auth");
        window.location.href = "/";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Export helper for proactive token refresh
export const refreshAccessToken = async () => {
  try {
    console.log("[Axios] Proactive token refresh initiated");
    const refreshResponse = await refreshApi.post("/api/refresh-token");

    if (refreshResponse.data.accessToken) {
      localStorage.setItem("accessToken", refreshResponse.data.accessToken);
      console.log("[Axios] Token refreshed successfully (proactive)");
      return refreshResponse.data.accessToken;
    }
  } catch (error) {
    console.error("[Axios] Proactive token refresh failed:", error);
    throw error;
  }
};

export default api;
