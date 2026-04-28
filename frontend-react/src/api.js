// src/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8081/api/v1',
});

// Add a request interceptor to include JWT if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
