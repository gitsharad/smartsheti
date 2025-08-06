const User = require('../models/User');
const Field = require('../models/Field');
const { logger } = require('../utils/logger');

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    let fields = [];
    if (user.role === 'farmer') {
      fields = await Field.find({ owner: user._id });
    } else if (user.role === 'coordinator') {
      fields = await Field.find({ 'assignedTo.user': user._id });
    } else if (user.role === 'admin') {
      fields = await Field.find({});
    }
    res.json({
      message: {
        english: 'Profile retrieved successfully',
        marathi: 'प्रोफाइल यशस्वीरित्या प्राप्त झाले'
      },
      user,
      fields
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(400).json({
      error: 'Failed to get profile',
      message: {
        english: 'Unable to retrieve profile',
        marathi: 'प्रोफाइल प्राप्त करण्यात अयशस्वी'
      }
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  const updates = Object.keys(req.body);
  
  // Enhanced allowed updates to include all profile fields
  const allowedUpdates = [
    // Basic profile fields
    'name', 
    'email',
    'phoneNumber', 
    'preferredLanguage', 
    'password',
    
    // Address fields
    'address',
    'village',
    'district', 
    'state',
    'pincode',
    
    // Profile fields
    'profileImage',
    'location',
    'notificationPreferences',
    'notifications', // Backward compatibility
    
    // User model fields
    'profile',
    'deviceInfo',
    'permissions',
    'isActive',
    'isVerified',
    'lastLogin',
    'lastActive',
    
    // Role and management fields
    'role',
    'managedBy',
    'managedUsers',
    'assignedFields',
    'ownedFields',
    
    // Security fields
    'passwordResetToken',
    'passwordResetExpires',
    'passwordChangedAt',
    
    // Timestamps (should not be updated but included for safety)
    'createdAt',
    'updatedAt'
  ];
  
  // Log the incoming request for debugging
  logger.info('Profile update request:', {
    userId: req.user._id,
    requestedUpdates: updates,
    allowedUpdates: allowedUpdates,
    body: req.body
  });

  // Check if all requested fields are allowed
  const invalidFields = updates.filter(update => !allowedUpdates.includes(update));
  const isValidOperation = invalidFields.length === 0;

  if (!isValidOperation) {
    logger.warn('Invalid profile update fields:', {
      userId: req.user._id,
      invalidFields: invalidFields,
      requestedUpdates: updates,
      body: req.body
    });
    
    return res.status(400).json({
      error: 'Invalid updates',
      message: {
        english: 'Some update fields are not allowed',
        marathi: 'काही अपडेट फील्ड्स अनुमत नाहीत'
      },
      invalidFields: invalidFields,
      allowedFields: allowedUpdates,
      receivedFields: updates
    });
  }

  try {
    // Handle email update separately to check for duplicates
    if (req.body.email && req.body.email !== req.user.email) {
      const existingUser = await User.findOne({ email: req.body.email });
      if (existingUser) {
        return res.status(400).json({
          error: 'Email already exists',
          message: {
            english: 'This email is already registered',
            marathi: 'हा ईमेल आधीपासून नोंदवलेला आहे'
          }
        });
      }
    }

    // Handle password update separately for hashing
    if (req.body.password) {
      req.user.password = req.body.password;
      delete req.body.password; // Remove from body to avoid double assignment
    }

    // Handle notificationPreferences update
    if (req.body.notificationPreferences) {
      req.user.notificationPreferences = {
        ...req.user.notificationPreferences,
        ...req.body.notificationPreferences
      };
      delete req.body.notificationPreferences; // Remove from body to avoid double assignment
    }

    // Handle notifications field (backward compatibility)
    if (req.body.notifications !== undefined) {
      // Convert simple notifications boolean to notificationPreferences structure
      if (typeof req.body.notifications === 'boolean') {
        req.user.notificationPreferences = {
          email: req.body.notifications,
          sms: req.body.notifications,
          push: req.body.notifications,
          alerts: req.body.notifications,
          reports: req.body.notifications
        };
      }
      delete req.body.notifications; // Remove from body to avoid double assignment
    }

    // Update all other fields
    updates.forEach(update => {
      if (update !== 'password' && update !== 'notificationPreferences' && update !== 'notifications') { // Skip handled fields
        // Only update if the field exists in the user model or is a safe field
        if (req.user[update] !== undefined || allowedUpdates.includes(update)) {
          req.user[update] = req.body[update];
        }
      }
    });

    // Validate phone number format if provided
    if (req.body.phoneNumber && !/^[0-9]{10}$/.test(req.body.phoneNumber)) {
      return res.status(400).json({
        error: 'Invalid phone number',
        message: {
          english: 'Phone number must be 10 digits',
          marathi: 'फोन नंबर 10 अंकांचा असला पाहिजे'
        }
      });
    }

    // Validate pincode format if provided
    if (req.body.pincode && !/^[0-9]{6}$/.test(req.body.pincode)) {
      return res.status(400).json({
        error: 'Invalid pincode',
        message: {
          english: 'Pincode must be 6 digits',
          marathi: 'पिनकोड 6 अंकांचा असला पाहिजे'
        }
      });
    }

    // Validate email format if provided
    if (req.body.email && !/\S+@\S+\.\S+/.test(req.body.email)) {
      return res.status(400).json({
        error: 'Invalid email format',
        message: {
          english: 'Please provide a valid email address',
          marathi: 'कृपया वैध ईमेल पता प्रदान करा'
        }
      });
    }

    await req.user.save();

    // Log the profile update
    logger.info(`Profile updated for user: ${req.user._id}`, {
      userId: req.user._id,
      updatedFields: updates,
      timestamp: new Date()
    });

    res.json({
      message: {
        english: 'Profile updated successfully',
        marathi: 'प्रोफाइल यशस्वीरित्या अपडेट झाले'
      },
      user: req.user,
      updatedFields: updates
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(400).json({
      error: 'Update failed',
      message: {
        english: 'Unable to update profile',
        marathi: 'प्रोफाइल अपडेट करण्यात अयशस्वी'
      },
      details: error.message
    });
  }
};

// Change password (separate endpoint for security)
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Missing password fields',
        message: {
          english: 'Current password and new password are required',
          marathi: 'सध्याचा पासवर्ड आणि नवीन पासवर्ड आवश्यक आहेत'
        }
      });
    }

    // Verify current password
    const isMatch = await req.user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        error: 'Invalid current password',
        message: {
          english: 'Current password is incorrect',
          marathi: 'सध्याचा पासवर्ड चुकीचा आहे'
        }
      });
    }

    // Update password
    req.user.password = newPassword;
    await req.user.save();

    logger.info(`Password changed for user: ${req.user._id}`);

    res.json({
      message: {
        english: 'Password changed successfully',
        marathi: 'पासवर्ड यशस्वीरित्या बदलला'
      }
    });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(400).json({
      error: 'Password change failed',
      message: {
        english: 'Unable to change password',
        marathi: 'पासवर्ड बदलण्यात अयशस्वी'
      }
    });
  }
};

// Get user activity/logs
const getUserActivity = async (req, res) => {
  try {
    // This would typically fetch from a separate activity/logs collection
    // For now, return a placeholder
    res.json({
      message: {
        english: 'User activity retrieved',
        marathi: 'वापरकर्ता क्रियाकलाप प्राप्त झाले'
      },
      activity: []
    });
  } catch (error) {
    logger.error('Get user activity error:', error);
    res.status(400).json({
      error: 'Failed to get user activity',
      message: {
        english: 'Unable to retrieve user activity',
        marathi: 'वापरकर्ता क्रियाकलाप प्राप्त करण्यात अयशस्वी'
      }
    });
  }
};

// Debug endpoint to test profile updates
const debugProfileUpdate = async (req, res) => {
  logger.info('Debug profile update request:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
    user: req.user ? req.user._id : 'No user'
  });
  
  res.json({
    message: 'Debug endpoint called',
    receivedData: req.body,
    userFields: Object.keys(req.user || {}),
    timestamp: new Date()
  });
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getUserActivity,
  debugProfileUpdate
}; 