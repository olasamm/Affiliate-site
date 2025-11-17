import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://affiliate-1-8ebu.onrender.com';

export const api = axios.create({
  baseURL: `${API_BASE}/api`,
  withCredentials: true,
});

export const setAuthHeader = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
};

// Set token from localStorage on initialization
const tokenFromStorage = localStorage.getItem('token');
if (tokenFromStorage) {
  api.defaults.headers.common['Authorization'] = `Bearer ${tokenFromStorage}`;
}

// Request interceptor to add token from localStorage if not set
api.interceptors.request.use(
  (config) => {
    // If no Authorization header is set, try to get token from localStorage
    if (!config.headers.Authorization) {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);



