import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mams_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 unauthenticated and 403 forbidden
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        // 401 Unauthorized: token expired or invalid -> logout and redirect
        localStorage.removeItem('mams_token');
        localStorage.removeItem('mams_user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      } else if (error.response.status === 403) {
        // 403 Forbidden: authenticated but lacking permissions -> DO NOT LOGOUT
        console.warn('Access Denied (403):', error.response.data?.message || 'You do not have permission to perform this action.');
        window.dispatchEvent(
          new CustomEvent('mams:access_denied', {
            detail: {
              message: error.response.data?.message || 'Access Denied: You do not have permission to perform this action.',
              path: error.config?.url
            }
          })
        );
      }
    }
    return Promise.reject(error);
  }
);

export default api;
