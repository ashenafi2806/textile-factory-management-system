import axios from 'axios';

const baseURL = typeof window === 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000')
  : '/api';

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;