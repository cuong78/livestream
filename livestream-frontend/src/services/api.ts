import axios from "axios";
import type {
  Stream,
  DailyRecording,
  UserLocation,
  SaveLocationRequest,
} from "@/types";

const API_BASE_URL = "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401/403 errors and refresh token automatically
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 or 403 and we haven't tried to refresh yet
    if (
      (error.response?.status === 401 || error.response?.status === 403) &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refresh_token");

      if (!refreshToken) {
        // No refresh token, redirect to login
        localStorage.removeItem("admin_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data;
        localStorage.setItem("admin_token", accessToken);

        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem("admin_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (username: string, password: string) => {
    const response = await api.post("/auth/login", { username, password });
    // Store both tokens
    if (response.data.token) {
      localStorage.setItem("admin_token", response.data.token);
    }
    if (response.data.refreshToken) {
      localStorage.setItem("refresh_token", response.data.refreshToken);
    }
    return response.data;
  },

  logout: async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    try {
      await api.post("/auth/logout", { refreshToken });
    } catch {
      // Ignore errors on logout
    }
    localStorage.removeItem("admin_token");
    localStorage.removeItem("refresh_token");
  },

  refreshToken: async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      throw new Error("No refresh token");
    }
    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refreshToken,
    });
    if (response.data.accessToken) {
      localStorage.setItem("admin_token", response.data.accessToken);
    }
    return response.data;
  },
};

export const streamApi = {
  getCurrentStream: async (): Promise<Stream | null> => {
    const response = await axios.get(`${API_BASE_URL}/stream/current`);
    return response.data;
  },
};

export const recordingApi = {
  // Get recent recordings (last 3 days)
  getRecentRecordings: async (): Promise<DailyRecording[]> => {
    const response = await axios.get(`${API_BASE_URL}/recordings/recent`);
    return response.data;
  },

  // Get recording by specific date
  getRecordingByDate: async (date: string): Promise<DailyRecording | null> => {
    const response = await axios.get(`${API_BASE_URL}/recordings/date/${date}`);
    return response.data;
  },

  // Admin: Trigger merge for today's recordings
  triggerMerge: async (
    date: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/recordings/admin/merge/${date}`);
    return response.data;
  },

  // Admin: Delete recording by date
  deleteRecording: async (
    date: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/recordings/admin/delete/${date}`);
    return response.data;
  },
};

export const locationApi = {
  // Save user location
  saveLocation: async (request: SaveLocationRequest): Promise<UserLocation> => {
    const response = await axios.post(`${API_BASE_URL}/location`, request);
    return response.data;
  },

  // Get current user location
  getCurrentLocation: async (): Promise<UserLocation | null> => {
    const response = await api.get(`/location/current`);
    return response.data;
  },

  // Get location history
  getLocationHistory: async (): Promise<UserLocation[]> => {
    const response = await api.get(`/location/history`);
    return response.data;
  },
};

export default api;
