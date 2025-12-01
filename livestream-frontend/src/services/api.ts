import axios from "axios";
import type { Stream, Comment } from "@/types";

const API_BASE_URL = "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const streamApi = {
  getCurrentStream: async (): Promise<Stream | null> => {
    const response = await axios.get(`${API_BASE_URL}/stream/current`);
    return response.data;
  },

  getCurrentStreamComments: async (limit: number = 100): Promise<Comment[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/stream/current/comments`, {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      console.error("Failed to fetch comments:", error);
      return [];
    }
  },
};

export default api;
