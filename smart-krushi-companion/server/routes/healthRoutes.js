const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

// Basic health check
router.get('/', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Detailed health check
router.get('/detailed', async (req, res) => {
  try {
    // Check MongoDB connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Get memory usage
    const memoryUsage = process.memoryUsage();
    
    // Get uptime
    const uptime = process.uptime();
    
    res.json({
      status: 'OK',
      timestamp: new Date(),
      database: {
        status: dbStatus
      },
      server: {
        uptime: uptime,
        memory: {
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
          rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB'
        },
        version: process.version
      }
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({ 
      status: 'ERROR',
      error: error.message 
    });
  }
});

module.exports = router; 