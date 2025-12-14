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

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: async (username: string, password: string) => {
    const response = await api.post("/auth/login", { username, password });
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
