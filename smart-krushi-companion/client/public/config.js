// Runtime configuration for the application
// This file can be updated without rebuilding the React app
window.APP_CONFIG = {
  // API Configuration
  API_URL: process.env.NODE_ENV === 'production' 
    ? 'https://your-production-domain.com/api/v1'  // Update this for production
    : '/api/v1',
  
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Other configuration options
  DEBUG: process.env.NODE_ENV !== 'production',
  
  // Feature flags
  FEATURES: {
    CHATBOT: true,
    ANALYTICS: true,
    NOTIFICATIONS: true
  }
}; 