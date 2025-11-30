import axios from "axios";
import type { Stream } from "@/types";

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
};

export default api;
