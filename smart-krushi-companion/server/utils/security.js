const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const { logger } = require('./logger');

// Rate limiting configuration
const createRateLimiter = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: {
    error: 'Too many requests',
    message: {
      english: message,
      marathi: 'कृपया थोड्या वेळाने पुन्हा प्रयत्न करा'
    }
  },
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests',
      message: {
        english: message,
        marathi: 'कृपया थोड्या वेळाने पुन्हा प्रयत्न करा'
      }
    });
  }
});

// API key validation
const validateApiKey = (req, res, next) => {
  const apiKey = req.header('X-API-Key');
  
  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn(`Invalid API key attempt from IP: ${req.ip}`);
    return res.status(401).json({
      error: 'Unauthorized',
      message: {
        english: 'Invalid API key',
        marathi: 'अवैध API की'
      }
    });
  }
  
  next();
};

// Security headers middleware
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.openweathermap.org"]
    }
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: true,
  frameguard: { action: "deny" },
  hidePoweredBy: true,
  hsts: true,
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true
});

// Request sanitization middleware
const sanitizeRequest = (req, res, next) => {
  // Sanitize request body
  if (req.body) {
    // Remove any properties starting with '$' or containing '.'
    mongoSanitize()(req, res, () => {});
    
    // Sanitize string values
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key]
          .replace(/[<>]/g, '') // Remove < and >
          .trim();
      }
    });
  }
  
  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key]
          .replace(/[<>]/g, '')
          .trim();
      }
    });
  }
  
  next();
};

// Error handling for uncaught exceptions
const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error:', err);
  
  // Don't expose error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
  
  res.status(500).json({
    error: 'Internal server error',
    message: {
      english: message,
      marathi: 'सर्व्हर त्रुटी'
    }
  });
};

module.exports = {
  // Rate limiters
  standardLimiter: createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    process.env.NODE_ENV === 'development' ? 1000 : 100, // 1000 requests in dev, 100 in prod
    'Too many requests, please try again later'
  ),
  
  strictLimiter: createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    process.env.NODE_ENV === 'development' ? 500 : 50, // 500 requests in dev, 50 in prod
    'Too many sensitive requests, please try again later'
  ),
  
  // Development rate limiter (very generous for testing)
  devLimiter: createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    10000, // 10,000 requests per 15 minutes for development
    'Too many requests, please try again later'
  ),
  
  // Security middleware
  validateApiKey,
  securityHeaders,
  sanitizeRequest,
  errorHandler
}; 