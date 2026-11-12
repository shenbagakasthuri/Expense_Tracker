import axios from 'axios';

// Base API URL from environment variable or fallback to port 5001
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Request Interceptor: Attach JWT Bearer Token if present in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle standard API errors and expired/invalid sessions
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;

    // Check for 401 Unauthorized (Expired token or unauthorized access)
    // Avoid redirect loop if requesting auth endpoints (/api/auth/login or /api/auth/register)
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/register')
    ) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Trigger a custom event so AuthContext can handle logout cleanly
      window.dispatchEvent(new Event('auth:expired'));
    }

    return Promise.reject(error);
  }
);

export default api;
