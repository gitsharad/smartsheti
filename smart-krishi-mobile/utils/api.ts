import axios from 'axios';
import { getToken, saveToken, deleteToken } from './secureStore';
import { authEvents } from './authEvents';

export const API_BASE_URL = 'https://871b0c5cb80c.ngrok-free.app/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Attach access token to every request
api.interceptors.request.use(async (config) => {
  const token = await getToken('accessToken');
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors and refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = await getToken('refreshToken');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = res.data;
          await saveToken('accessToken', accessToken);
          if (newRefreshToken) {
            await saveToken('refreshToken', newRefreshToken);
          }
          originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          await deleteToken('accessToken');
          await deleteToken('refreshToken');
        //  authEvents.emit(); // Notify app to update auth state
        }
      } else {
        await deleteToken('accessToken');
        await deleteToken('refreshToken');
        //authEvents.emit(); // Notify app to update auth state
      }
    }
    return Promise.reject(error);
  }
);

export default api; 