import axios from 'axios';

const isLocalhost = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' || 
                   window.location.hostname.endsWith('.localhost');

export const API_URL = isLocalhost 
  ? 'http://localhost:8000/api/' 
  : 'https://penaplast.api.yolyolakayt.uz/api/';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the JWT token in all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    const isAuthRequest = config.url?.includes('token/');
    
    // Check if token exists and is not a trap value like "null" or "undefined"
    const isValidToken = token && token !== 'null' && token !== 'undefined';
    
    if (isValidToken && !isAuthRequest) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Skip interceptor for auth-related requests to avoid loops
    if (originalRequest.url?.includes('token/')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (refreshToken && refreshToken !== 'null' && refreshToken !== 'undefined') {
        try {
          const response = await axios.post(`${API_URL}token/refresh/`, {
            refresh: refreshToken,
          });
          const newAccess = response.data.access;
          localStorage.setItem('access_token', newAccess);
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed — clear everything and go to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.reload();
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token — clear stale access token and reload
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.reload();
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
