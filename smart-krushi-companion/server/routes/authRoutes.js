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
const { standardLimiter } = require('../utils/security');

const router = express.Router();

// Public routes (with rate limiting)
router.post('/login', standardLimiter, login);
router.post('/refresh-token', standardLimiter, refresh);
router.post('/forgot-password', standardLimiter, forgotPassword);
router.post('/reset-password/:token', standardLimiter, resetPassword);

// Protected routes (require authentication)
router.post('/register', auth, standardLimiter, register);
router.post('/logout', auth, logout);
router.get('/profile', auth, getProfile);
router.patch('/profile', auth, updateProfile);

module.exports = router; 