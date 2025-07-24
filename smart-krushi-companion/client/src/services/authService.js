import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL +'/api/v1';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to add token
api.interceptors.request.use(
  (config) => {
    // Debug: log the actual request URL
    console.log('Axios request URL:', config.url);
    // Only add token for protected endpoints
   // const publicEndpoints = ['/coordinators', '/api/v1/coordinators', '/api/v1/users/coordinators'];
   // if (!publicEndpoints.some(url => config.url && config.url.endsWith(url))) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
  //  }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip refresh logic for public endpoints
   // const publicEndpoints = ['/coordinators', '/api/v1/coordinators', '/api/v1/users/coordinators'];
   // if (publicEndpoints.some(url => originalRequest.url && originalRequest.url.endsWith(url))) {
   //   return Promise.reject(error);
   // }

    // If error is 401 and we haven't tried to refresh token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Try to refresh token
        const response = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        
        // Store new tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, logout user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async register(userData) {
    const response = await api.post('/auth/register', userData);
    if (response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      api.post('/auth/logout', { refreshToken }).catch(console.error);
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('accessToken');
  }
};

export { api };
export default authService; 