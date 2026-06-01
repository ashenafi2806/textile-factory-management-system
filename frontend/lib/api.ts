// lib/api.ts
import axios from "axios";

// Use absolute backend URL on the server (or when NEXT_PUBLIC_API_URL is set),
// but use relative `/api` in the browser so Next.js can proxy requests and
// avoid CORS / mixed-content issues during development.
const baseURL =
  typeof window === "undefined"
    ? process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
    : ""; // In the browser call same-origin paths (e.g. `/workforce/...`).

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth interceptor if needed
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }

  // Redirect legacy frontend API calls through the `/api` proxy.
  // This preserves existing call sites like `/workforce/...` while keeping
  // frontend app routes such as `/workforce/...` working correctly.
  const url = config.url;
  if (
    typeof url === "string" &&
    url.startsWith("/") &&
    !url.startsWith("/api/") &&
    [
      "/workforce",
      "/inventory",
      "/production",
      "/qa",
      "/maintenance",
      "/notifications",
      "/training",
      "/users",
      "/mail",
    ].some((prefix) => url === prefix || url.startsWith(`${prefix}/`))
  ) {
    config.url = `/api${url}`;
  }
  return config;
});

export default api;
