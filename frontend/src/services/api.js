import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.DEV
    ? '/api/v1'
    : (import.meta.env.VITE_API_URL || '/api/v1'),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token to every request
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

// Interceptor to handle 401 Unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';
    const isLoginRequest = requestUrl.endsWith('/auth/login');
    if (error.response && error.response.status === 401 && !isLoginRequest) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;