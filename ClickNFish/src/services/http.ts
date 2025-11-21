import axios from "axios";

const base = import.meta.env.VITE_API_URL;

export const http = axios.create({
  baseURL: `${base}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});
