const express = require('express');
const { auth } = require('../middleware/auth');
const { 
  register, 
  login, 
  refresh,
  forgotPassword,
  resetPassword,
  logout,
  getProfile, 
  updateProfile 
} = require('../controllers/authController');
const { changePassword, testProfileUpdate } = require('../controllers/profileController');
const { standardLimiter } = require('../utils/security');

const router = express.Router();

// Public routes (with rate limiting)
router.post('/login', standardLimiter, login);
router.post('/refresh-token', standardLimiter, refresh);
router.post('/forgot-password', standardLimiter, forgotPassword);
router.post('/reset-password/:token', standardLimiter, resetPassword);
// Mobile OTP login endpoints
router.post('/mobile-otp-request', standardLimiter, require('../controllers/authController').mobileOtpRequest);
router.post('/mobile-otp-verify', standardLimiter, require('../controllers/authController').mobileOtpVerify);
// Test SMS endpoint (for debugging)
router.post('/test-sms', standardLimiter, require('../controllers/authController').testSMS);

// Protected routes (require authentication)
router.post('/register', auth, standardLimiter, register);
router.post('/logout', auth, logout);
router.get('/profile', auth, getProfile);
router.patch('/profile', auth, updateProfile);
router.post('/change-password', auth, changePassword);

// Test route for debugging profile updates
router.patch('/profile-test', auth, testProfileUpdate);

module.exports = router; 