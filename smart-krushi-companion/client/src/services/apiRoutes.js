import { api } from './authService';

const apiRoutes = {
  // Auth
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.patch('/auth/profile', data),
  changePassword: (currentPassword, newPassword) => api.post('/auth/change-password', { currentPassword, newPassword }),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
  refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),

  // Two-Factor Authentication
  getTwoFactorStatus: () => api.get('/auth/2fa/status'),
  setupTwoFactor: () => api.post('/auth/2fa/setup'),
  verifyTwoFactor: (code) => api.post('/auth/2fa/verify', { code }),
  disableTwoFactor: () => api.post('/auth/2fa/disable'),
  verifyBackupCode: (code) => api.post('/auth/2fa/backup', { code }),

  // Login History & Security
  getLoginHistory: () => api.get('/auth/login-history'),
  revokeSession: (sessionId) => api.delete(`/auth/sessions/${sessionId}`),
  reportSuspiciousActivity: (sessionId) => api.post(`/auth/suspicious/${sessionId}`),
  getActiveSessions: () => api.get('/auth/sessions/active'),

  // Sensor Data
  getSensorData: () => api.get('/sensor-data'),
  getLatestSensorData: (fieldId) => api.get(`/sensor-data/latest?fieldId=${fieldId}`),
  getSensorData24h: (fieldId) => api.get(`/sensor-data/24h?fieldId=${fieldId}`),

  // Land
  getLand: () => api.get('/land'),
  // Add more land endpoints as needed

  // NDVI
  getNDVI: () => api.get('/ndvi'),
  registerField: (fieldData) => api.post('/ndvi/register-field', fieldData),
  // Add more NDVI endpoints as needed

  // Chatbot
  getChatbot: (data) => api.post('/chatbot', data),
  // Add more chatbot endpoints as needed

  // FDSS
  getFDSS: () => api.get('/fdss'),
  getFDSSAdvice: (fieldId) => api.get(`/fdss/insights?fieldId=${fieldId}`),
  getFDSSWeather: (fieldId) => api.get(`/fdss/weather/current?fieldId=${fieldId}`),
  // Add more FDSS endpoints as needed

  // Disease
  getDisease: () => api.get('/disease'),
  // Add more disease endpoints as needed

  analyzeDisease: (formData) => api.post('/disease/detect', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // Field Analytics
  getFieldAnalyticsOverview: () => api.get('/fields/analytics/overview'),
  // Yield Trends Analytics
  getYieldTrends: (query = '') => api.get(`/fields/analytics/yield-trends${query}`),

  // Admin Alerts
  getAdminAlerts: () => api.get('/admin/alerts'),
  acknowledgeAlert: (alertId) => api.patch(`/admin/alerts/${alertId}/acknowledge`),
  assignAlert: (alertId, coordinatorId) => api.patch(`/admin/alerts/${alertId}/assign`, { coordinatorId }),
  // Admin Coordinators (for assignment dropdown)
  getAdminCoordinators: () => api.get('/admin/coordinators'),
};

export default apiRoutes; 