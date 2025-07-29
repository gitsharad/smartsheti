const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Field = require('../models/Field');
const { logger } = require('../utils/logger');
//mongodb+srv://<db_username>:<db_password>@cluster0.mzxragd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
// Basic authentication middleware
const auth = async (req, res, next) => {
  try {
    // Skip auth for public coordinators endpoint
    if (
      req.method === 'GET' &&
      (
        req.path === '/api/v1/users/coordinators' ||
        req.originalUrl === '/api/v1/users/coordinators'
      )
    ) {
      return next();
    }
    // Get token from header
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

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findOne({ 
      _id: decoded.id,
      isActive: true
    }).populate('managedBy', 'name email role');

    if (!user) {
      throw new Error('User not found');
    }

    // Update last activity
    user.lastActive = new Date();
    await user.save();

    // Add user to request
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({
      error: 'Authentication failed',
      message: {
        english: 'Please authenticate with valid credentials',
        marathi: 'कृपया वैध क्रेडेन्शियल्ससह प्रमाणीकरण करा'
      }
    });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: {
          english: 'Please authenticate first',
          marathi: 'कृपया प्रथम प्रमाणीकरण करा'
        }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied',
        message: {
          english: `Access denied. Required roles: ${roles.join(', ')}`,
          marathi: `प्रवेश नाकारले. आवश्यक भूमिका: ${roles.join(', ')}`
        }
      });
    }

    next();
  };
};

// Permission-based authorization middleware
const hasPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: {
          english: 'Please authenticate first',
          marathi: 'कृपया प्रथम प्रमाणीकरण करा'
        }
      });
    }

    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({
        error: 'Permission denied',
        message: {
          english: `Permission denied. Required permission: ${permission}`,
          marathi: `परवानगी नाकारली. आवश्यक परवानगी: ${permission}`
        }
      });
    }

    next();
  };
};

// Field access control middleware
const fieldAccess = async (req, res, next) => {
  try {
    const fieldId = req.params.fieldId || req.body.fieldId || req.query.fieldId;
    
    if (!fieldId) {
      return res.status(400).json({
        error: 'Field ID required',
        message: {
          english: 'Field ID is required',
          marathi: 'शेत ID आवश्यक आहे'
        }
      });
    }

    // Find the field
    const field = await Field.findOne({ fieldId }).populate('owner', 'name email role');
    
    if (!field) {
      return res.status(404).json({
        error: 'Field not found',
        message: {
          english: 'Field not found',
          marathi: 'शेत सापडले नाही'
        }
      });
    }

    // Check if user can access this field
    const canAccess = await checkFieldAccess(req.user, field);
    
    if (!canAccess) {
      return res.status(403).json({
        error: 'Field access denied',
        message: {
          english: 'You do not have permission to access this field',
          marathi: 'तुम्हाला या शेतावर प्रवेश करण्याची परवानगी नाही'
        }
      });
    }

    // Add field to request
    req.field = field;
    next();
  } catch (error) {
    logger.error('Field access check error:', error);
    res.status(500).json({
      error: 'Field access check failed',
      message: {
        english: 'Failed to verify field access',
        marathi: 'शेत प्रवेश तपासण्यात अयशस्वी'
      }
    });
  }
};

// Helper function to check field access
const checkFieldAccess = async (user, field) => {
  // Admin can access all fields
  if (user.role === 'admin') return true;
  
  // Owner can access their own fields
  if (field.owner._id.toString() === user._id.toString()) return true;
  
  // Check if user is assigned to this field
  const assignment = field.assignedTo.find(a => 
    a.user.toString() === user._id.toString()
  );
  if (assignment) return true;
  
  // If coordinator, check if field belongs to managed farmers
  if (user.role === 'coordinator') {
    const managedUsers = await user.getManagedUsers();
    const managedUserIds = managedUsers.map(u => u._id.toString());
    
    if (managedUserIds.includes(field.owner._id.toString())) {
      return true;
    }
  }
  
  return false;
};

// User management authorization (for coordinators and admins)
const canManageUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId || req.body.userId;
    
    if (!targetUserId) {
      return res.status(400).json({
        error: 'User ID required',
        message: {
          english: 'User ID is required',
          marathi: 'वापरकर्ता ID आवश्यक आहे'
        }
      });
    }

    const targetUser = await User.findById(targetUserId);
    
    if (!targetUser) {
      return res.status(404).json({
        error: 'User not found',
        message: {
          english: 'User not found',
          marathi: 'वापरकर्ता सापडला नाही'
        }
      });
    }

    // Admin can manage all users
    if (req.user.role === 'admin') {
      req.targetUser = targetUser;
      return next();
    }

    // Coordinator can only manage farmers
    if (req.user.role === 'coordinator' && targetUser.role === 'farmer') {
      // Check if farmer is managed by this coordinator
      if (targetUser.managedBy.toString() === req.user._id.toString()) {
        req.targetUser = targetUser;
        return next();
      }
    }

    return res.status(403).json({
      error: 'User management denied',
      message: {
        english: 'You do not have permission to manage this user',
        marathi: 'तुम्हाला या वापरकर्त्याचे व्यवस्थापन करण्याची परवानगी नाही'
      }
    });
  } catch (error) {
    logger.error('User management check error:', error);
    res.status(500).json({
      error: 'User management check failed',
      message: {
        english: 'Failed to verify user management permissions',
        marathi: 'वापरकर्ता व्यवस्थापन परवानगी तपासण्यात अयशस्वी'
      }
    });
  }
};

// Mobile app access control (read-only for farmers)
const mobileAppAccess = (req, res, next) => {
  // Check if request is from mobile app
  const userAgent = req.headers['user-agent'] || '';
  const isMobileApp = userAgent.includes('Expo') || userAgent.includes('ReactNative');
  
  if (isMobileApp && req.user.role !== 'farmer') {
    return res.status(403).json({
      error: 'Mobile app access denied',
      message: {
        english: 'Mobile app is only available for farmers',
        marathi: 'मोबाईल अॅप केवळ शेतकऱ्यांसाठी उपलब्ध आहे'
      }
    });
  }

  next();
};

// Web app access control (full access for coordinators and admins)
const webAppAccess = (req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  const isWebApp = !userAgent.includes('Expo') && !userAgent.includes('ReactNative');
  
  if (isWebApp && req.user.role === 'farmer') {
    // Farmers can only access limited web features
    const allowedEndpoints = [
      '/api/v1/profile',
      '/api/v1/fields',
      '/api/v1/fields/own',
      '/api/v1/sensor-data',
      '/api/v1/sensor-data/own',
      '/api/v1/reports/own',
      '/api/v1/fdss',
      '/api/v1/disease',
      '/api/v1/land-report',
      '/api/v1/land',
      '/api/v1/chatbot',
      '/api/v1/ndvi',
      // Also allow without /api/v1 prefix for route-level middleware
      '/profile',
      '/fields',
      '/fields/own',
      '/sensor-data',
      '/sensor-data/own',
      '/reports/own',
      '/fdss',
      '/disease',
      '/land-report',
      '/land',
      '/chatbot',
      '/ndvi'
    ];
    
    const currentPath = req.path;
    const fullPath = req.originalUrl;
    
    // Check both the route path and the full URL path
    const isAllowed = allowedEndpoints.some(endpoint => 
      currentPath.startsWith(endpoint) || fullPath.startsWith(endpoint)
    );
    
    if (!isAllowed) {
      return res.status(403).json({
        error: 'Web app access limited',
        message: {
          english: 'Farmers have limited web app access. Use mobile app for full features.',
          marathi: 'शेतकऱ्यांना मर्यादित वेब अॅप प्रवेश आहे. पूर्ण वैशिष्ट्यांसाठी मोबाईल अॅप वापरा.'
        }
      });
    }
  }

  next();
};

module.exports = {
  auth,
  authorize,
  hasPermission,
  fieldAccess,
  canManageUser,
  mobileAppAccess,
  webAppAccess,
  checkFieldAccess
}; 