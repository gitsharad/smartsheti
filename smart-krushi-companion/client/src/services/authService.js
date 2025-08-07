import axios from 'axios';

// Use the same API configuration as the rest of the app
const getApiUrl = () => {
  // Check if we're in production
  if (process.env.NODE_ENV === 'production') {
    const prodUrl = process.env.REACT_APP_API_URL 
      ? `${process.env.REACT_APP_API_URL}/api/v1`
      : 'https://api.smartsheti.com/api/v1';
    console.log('Production API URL:', prodUrl);
    return prodUrl;
  }
  
  // Development: use proxy or localhost
  const devUrl = '/api/v1'; // This will be proxied to localhost:5000
  console.log('Development API URL:', devUrl);
  return devUrl;
};

const API_URL = getApiUrl();

console.log('Final API URL:', API_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  // Add timeout and better error handling
  timeout: 10000,
  withCredentials: false
});

// Add request interceptor to add token
api.interceptors.request.use(
  (config) => {
    // Check if this is a login request (don't add token for login)
    const isLoginRequest = config.url === '/auth/login';
    
    if (!isLoginRequest) {
      const token = localStorage.getItem('accessToken');
      
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

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

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
  async testConnection() {
    try {
      const response = await axios.get(`${API_URL}/health`);
      return true;
    } catch (error) {
      return false;
    }
  },

  async testToken() {
    try {
      const token = localStorage.getItem('accessToken');
      
      if (token) {
        const response = await api.get('/auth/profile');
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  },

  async login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data && response.data.accessToken) {
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
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

  async mobileOtpRequest(phoneNumber) {
    return api.post('/auth/mobile-otp-request', { phoneNumber });
  },
  async mobileOtpVerify(phoneNumber, otp) {
    return api.post('/auth/mobile-otp-verify', { phoneNumber, otp }).then(response => {
      if (response.data && response.data.accessToken) {
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    });
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