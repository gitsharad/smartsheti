const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { logger } = require('./logger');

// Advanced security configuration
const SECURITY_CONFIG = {
  // Encryption settings
  ENCRYPTION_ALGORITHM: 'aes-256-gcm',
  KEY_LENGTH: 32,
  IV_LENGTH: 16,
  AUTH_TAG_LENGTH: 16,
  
  // JWT settings
  JWT_ALGORITHM: 'RS256',
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
  
  // Rate limiting
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  SUSPICIOUS_ACTIVITY_THRESHOLD: 10,
  
  // Session management
  MAX_CONCURRENT_SESSIONS: 3,
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  INACTIVITY_TIMEOUT: 15 * 60 * 1000, // 15 minutes
};

// Store for tracking security events
const securityEvents = new Map();
const failedLoginAttempts = new Map();
const activeSessions = new Map();

/**
 * Advanced encryption utilities
 */
class EncryptionService {
  static generateKey() {
    return crypto.randomBytes(SECURITY_CONFIG.KEY_LENGTH);
  }

  static encrypt(data, key) {
    try {
      const iv = crypto.randomBytes(SECURITY_CONFIG.IV_LENGTH);
      const cipher = crypto.createCipher(SECURITY_CONFIG.ENCRYPTION_ALGORITHM, key);
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      };
    } catch (error) {
      logger.error('Encryption error:', error);
      throw new Error('Encryption failed');
    }
  }

  static decrypt(encryptedData, key, iv, authTag) {
    try {
      const decipher = crypto.createDecipher(SECURITY_CONFIG.ENCRYPTION_ALGORITHM, key);
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));
      
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      logger.error('Decryption error:', error);
      throw new Error('Decryption failed');
    }
  }

  static hashSensitiveData(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

/**
 * Multi-factor authentication service
 */
class MFAService {
  static generateTOTPSecret() {
    return crypto.randomBytes(20).toString('base32');
  }

  static generateTOTP(secret, timeStep = 30) {
    const counter = Math.floor(Date.now() / 1000 / timeStep);
    const key = Buffer.from(secret, 'base32');
    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeBigUInt64BE(BigInt(counter), 0);
    
    const hmac = crypto.createHmac('sha1', key);
    hmac.update(counterBuffer);
    const hash = hmac.digest();
    
    const offset = hash[hash.length - 1] & 0xf;
    const code = ((hash[offset] & 0x7f) << 24) |
                 ((hash[offset + 1] & 0xff) << 16) |
                 ((hash[offset + 2] & 0xff) << 8) |
                 (hash[offset + 3] & 0xff);
    
    return (code % 1000000).toString().padStart(6, '0');
  }

  static verifyTOTP(secret, token, window = 1) {
    const timeStep = 30;
    const counter = Math.floor(Date.now() / 1000 / timeStep);
    
    for (let i = -window; i <= window; i++) {
      const expectedToken = this.generateTOTP(secret, timeStep);
      if (token === expectedToken) {
        return true;
      }
    }
    return false;
  }

  static generateBackupCodes() {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }
}

/**
 * Threat detection service
 */
class ThreatDetectionService {
  static detectSuspiciousActivity(req, user) {
    const clientIP = req.ip;
    const userAgent = req.get('User-Agent');
    const timestamp = Date.now();
    
    // Track activity patterns
    const activityKey = `${clientIP}:${user?._id || 'anonymous'}`;
    const activities = securityEvents.get(activityKey) || [];
    
    // Add current activity
    activities.push({
      timestamp,
      userAgent,
      endpoint: req.path,
      method: req.method,
      user: user?._id
    });
    
    // Keep only recent activities (last hour)
    const recentActivities = activities.filter(
      activity => timestamp - activity.timestamp < 60 * 60 * 1000
    );
    
    securityEvents.set(activityKey, recentActivities);
    
    // Detect suspicious patterns
    const threats = [];
    
    // Too many requests
    if (recentActivities.length > SECURITY_CONFIG.SUSPICIOUS_ACTIVITY_THRESHOLD) {
      threats.push({
        type: 'RATE_LIMIT_EXCEEDED',
        severity: 'HIGH',
        details: `Too many requests from ${clientIP}`
      });
    }
    
    // Failed login attempts
    const failedAttempts = failedLoginAttempts.get(clientIP) || 0;
    if (failedAttempts > SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
      threats.push({
        type: 'BRUTE_FORCE_ATTEMPT',
        severity: 'CRITICAL',
        details: `Multiple failed login attempts from ${clientIP}`
      });
    }
    
    // Unusual user agent
    if (this.isUnusualUserAgent(userAgent)) {
      threats.push({
        type: 'SUSPICIOUS_USER_AGENT',
        severity: 'MEDIUM',
        details: `Unusual user agent: ${userAgent}`
      });
    }
    
    // Log threats
    if (threats.length > 0) {
      logger.warn('Threats detected:', { clientIP, threats, user: user?._id });
    }
    
    return threats;
  }

  static isUnusualUserAgent(userAgent) {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i,
      /perl/i
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  static recordFailedLogin(ip) {
    const attempts = failedLoginAttempts.get(ip) || 0;
    failedLoginAttempts.set(ip, attempts + 1);
    
    // Reset after lockout duration
    setTimeout(() => {
      failedLoginAttempts.delete(ip);
    }, SECURITY_CONFIG.LOCKOUT_DURATION);
  }

  static isIPLocked(ip) {
    const attempts = failedLoginAttempts.get(ip) || 0;
    return attempts >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS;
  }
}

/**
 * Session management service
 */
class SessionService {
  static createSession(userId, deviceInfo) {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const session = {
      id: sessionId,
      userId,
      deviceInfo,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      isActive: true
    };
    
    // Store session
    if (!activeSessions.has(userId)) {
      activeSessions.set(userId, new Map());
    }
    
    const userSessions = activeSessions.get(userId);
    userSessions.set(sessionId, session);
    
    // Enforce max concurrent sessions
    if (userSessions.size > SECURITY_CONFIG.MAX_CONCURRENT_SESSIONS) {
      const oldestSession = Array.from(userSessions.values())
        .sort((a, b) => a.createdAt - b.createdAt)[0];
      userSessions.delete(oldestSession.id);
    }
    
    return sessionId;
  }

  static validateSession(sessionId, userId) {
    const userSessions = activeSessions.get(userId);
    if (!userSessions) return false;
    
    const session = userSessions.get(sessionId);
    if (!session || !session.isActive) return false;
    
    // Check inactivity timeout
    if (Date.now() - session.lastActivity > SECURITY_CONFIG.INACTIVITY_TIMEOUT) {
      session.isActive = false;
      return false;
    }
    
    // Update last activity
    session.lastActivity = Date.now();
    return true;
  }

  static invalidateSession(sessionId, userId) {
    const userSessions = activeSessions.get(userId);
    if (userSessions) {
      userSessions.delete(sessionId);
    }
  }

  static invalidateAllSessions(userId) {
    activeSessions.delete(userId);
  }
}

/**
 * Advanced security middleware
 */
const advancedSecurityMiddleware = {
  // Enhanced authentication middleware
  enhancedAuth: async (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({
          error: 'Authentication required',
          message: {
            english: 'Please authenticate',
            marathi: 'कृपया प्रमाणीकरण करा'
          }
        });
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if IP is locked
      if (ThreatDetectionService.isIPLocked(req.ip)) {
        return res.status(429).json({
          error: 'Account temporarily locked',
          message: {
            english: 'Too many failed attempts. Please try again later.',
            marathi: 'खूप प्रयत्न अयशस्वी. कृपया नंतर पुन्हा प्रयत्न करा.'
          }
        });
      }

      // Validate session
      if (!SessionService.validateSession(decoded.sessionId, decoded.id)) {
        return res.status(401).json({
          error: 'Session expired',
          message: {
            english: 'Your session has expired. Please login again.',
            marathi: 'तुमचा सत्र कालबाह्य झाले आहे. कृपया पुन्हा लॉगिन करा.'
          }
        });
      }

      // Detect threats
      const threats = ThreatDetectionService.detectSuspiciousActivity(req, { _id: decoded.id });
      if (threats.some(t => t.severity === 'CRITICAL')) {
        return res.status(403).json({
          error: 'Suspicious activity detected',
          message: {
            english: 'Suspicious activity detected. Please contact support.',
            marathi: 'संशयास्पद क्रियाकलाप आढळले. कृपया समर्थनाशी संपर्क साधा.'
          }
        });
      }

      req.user = { _id: decoded.id };
      req.sessionId = decoded.sessionId;
      next();
    } catch (error) {
      logger.error('Enhanced auth error:', error);
      res.status(401).json({
        error: 'Authentication failed',
        message: {
          english: 'Please authenticate with valid credentials',
          marathi: 'कृपया वैध क्रेडेन्शियल्ससह प्रमाणीकरण करा'
        }
      });
    }
  },

  // Data encryption middleware
  encryptSensitiveData: (req, res, next) => {
    if (req.body && req.body.sensitiveData) {
      try {
        const key = EncryptionService.generateKey();
        const encrypted = EncryptionService.encrypt(
          JSON.stringify(req.body.sensitiveData),
          key
        );
        
        req.body.encryptedData = encrypted;
        req.body.encryptionKey = key.toString('hex');
        delete req.body.sensitiveData;
      } catch (error) {
        logger.error('Data encryption error:', error);
        return res.status(500).json({
          error: 'Data encryption failed',
          message: {
            english: 'Failed to encrypt sensitive data',
            marathi: 'संवेदनशील डेटा एन्क्रिप्ट करण्यात अयशस्वी'
          }
        });
      }
    }
    next();
  },

  // Security headers middleware
  enhancedSecurityHeaders: (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.openweathermap.org");
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
  },

  // Rate limiting with threat detection
  intelligentRateLimit: (req, res, next) => {
    const clientIP = req.ip;
    const threats = ThreatDetectionService.detectSuspiciousActivity(req);
    
    if (threats.some(t => t.severity === 'HIGH' || t.severity === 'CRITICAL')) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: {
          english: 'Too many requests. Please try again later.',
          marathi: 'खूप विनंती. कृपया नंतर पुन्हा प्रयत्न करा.'
        }
      });
    }
    
    next();
  }
};

module.exports = {
  EncryptionService,
  MFAService,
  ThreatDetectionService,
  SessionService,
  advancedSecurityMiddleware,
  SECURITY_CONFIG
}; 