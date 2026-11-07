import axios from 'axios';

const baseURL = import.meta.env.DEV
  ? '/api/v1'
  : (import.meta.env.VITE_API_URL || '/api/v1');

if (!import.meta.env.DEV && !import.meta.env.VITE_API_URL) {
  // VITE_API_URL is baked in at BUILD time: set it in Render and rebuild the frontend.
  console.warn(
    'VITE_API_URL is not set: API calls will go to this site instead of the backend.'
  );
}

const api = axios.create({
  baseURL,
  timeout: 30000, // never leave the user waiting forever
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Attach JWT token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Important: Let the browser set the correct multipart/form-data boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor – handle 401
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

/**
 * Turn any axios error into a message a farmer can understand.
 * A browser "CORS / Network Error" usually means the server was asleep, restarting or overloaded.
 */
export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (error?.code === 'ECONNABORTED') {
    return 'The server took too long to respond. It may be waking up, so please try again in a moment.';
  }

  if (!error?.response) {
    return 'Cannot reach the server. Check your connection. If the app was idle, the server can need up to a minute to wake up.';
  }

  const detail = error.response.data?.detail;

  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => d.msg).filter(Boolean).join('; ') || fallback;
  }

  if ([502, 503, 504].includes(error.response.status)) {
    return 'The server is temporarily unavailable. Please try again shortly.';
  }

  return fallback;
};

export default api;