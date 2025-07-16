const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const { 
  getDashboardStats,
  getManagedFarmers,
  getFieldOverview,
  getAlerts,
  getAnalytics,
  sendMessage
} = require('../controllers/coordinatorController');
const { standardLimiter } = require('../utils/security');

const router = express.Router();

// All routes require authentication and coordinator role
router.use(auth);
router.use(authorize('coordinator', 'admin', 'superadmin'));

// Dashboard stats
router.get('/dashboard-stats', standardLimiter, getDashboardStats);

// Managed farmers
router.get('/managed-farmers', standardLimiter, getManagedFarmers);

// Field overview
router.get('/field-overview', standardLimiter, getFieldOverview);

// Alerts
router.get('/alerts', standardLimiter, getAlerts);

// Analytics
router.get('/analytics', standardLimiter, getAnalytics);

// Send message to farmers
router.post('/send-message', standardLimiter, sendMessage);

module.exports = router; 