const rateLimit = require('express-rate-limit');
const { logger } = require('./logger');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'कृपया थोड्या वेळाने पुन्हा प्रयत्न करा (Too many requests, please try again later)',
  },
  handler: (req, res, next, options) => {
    logger.warn({
      message: 'Rate limit exceeded',
      ip: req.ip,
      path: req.originalUrl
    });
    res.status(429).json(options.message);
  }
});

// Stricter limiter for sensitive endpoints (like NDVI API calls)
const sensitiveApiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 requests per hour
  message: {
    error: 'कृपया एक तासानंतर पुन्हा प्रयत्न करा (Rate limit exceeded, please try again after an hour)',
  },
  handler: (req, res, next, options) => {
    logger.warn({
      message: 'Sensitive API rate limit exceeded',
      ip: req.ip,
      path: req.originalUrl
    });
    res.status(429).json(options.message);
  }
});

module.exports = {
  apiLimiter,
  sensitiveApiLimiter
}; 