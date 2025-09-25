import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "/api";

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});


api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem("auth_token");
    if (raw) {
      config.headers = config.headers ?? {};
      (config.headers as any)["Authorization"] = `Bearer ${raw}`;
    }
  } catch {}
  return config;
});