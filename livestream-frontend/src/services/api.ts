import axios from "axios";
import type { Stream } from "@/types";

const API_BASE_URL = "/api";

export const streamApi = {
  getCurrentStream: async (): Promise<Stream | null> => {
    const response = await axios.get(`${API_BASE_URL}/stream/current`);
    return response.data;
  },
};
