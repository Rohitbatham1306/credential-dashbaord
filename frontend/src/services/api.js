import axios from 'axios';
import store from '../app/store';
import { refreshTokens, logout } from '../features/authSlice';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5051/api',
  withCredentials: true,
});

// Request interceptor to add access token
api.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('accessToken');
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is 401 (Unauthorized) and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const result = await store.dispatch(refreshTokens());
        
        if (refreshTokens.fulfilled.match(result)) {
          // Token refreshed successfully, retry the original request
          const newAccessToken = result.payload.accessToken;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } else {
          // Token refresh failed, logout the user
          store.dispatch(logout());
          throw error;
        }
      } catch (refreshError) {
        // Token refresh failed, logout the user
        store.dispatch(logout());
        throw error;
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;

