// Production configuration example
// Copy this to config.js and update the API_URL for your production server
window.APP_CONFIG = {
  // API Configuration - UPDATE THIS FOR YOUR PRODUCTION SERVER
  API_URL: 'https://api.smartsheti.com/api/v1',
  
  // Environment
  NODE_ENV: 'production',
  
  // Other configuration options
  DEBUG: false,
  
  // Feature flags
  FEATURES: {
    CHATBOT: true,
    ANALYTICS: true,
    NOTIFICATIONS: true
  }
}; 