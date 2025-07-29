const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { logger } = require('../utils/logger');
const crypto = require('crypto');
const { sendEmail } = require('../utils/emailService');
const { sendSMSAlert } = require('../utils/alertService');

// Helper function to create tokens
const createTokens = async (user, req) => {
  const accessToken = user.generateAuthToken();
  const refreshToken = user.generateRefreshToken();

  // Save refresh token (handle duplicate key error gracefully)
  try {
    await RefreshToken.create({
      token: refreshToken,
      user: user._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    });
  } catch (err) {
    if (err.code !== 11000) throw err; // Ignore duplicate key error
  }

  return { accessToken, refreshToken };
};



const register = async (req, res) => {
  try {
    const { name, email, password, role, phoneNumber, location, profile } = req.body;
    
    // Check if user is authenticated (registration should only be done after login)
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required for user registration' });
    }

    // Role-based registration permissions
    const currentUserRole = req.user.role;
    const targetRole = role || 'farmer';

    // Superadmin can register admins, coordinators, and farmers
    if (currentUserRole === 'superadmin') {
      if (!['admin', 'coordinator', 'farmer'].includes(targetRole)) {
        return res.status(403).json({ error: 'Superadmin can only register admins, coordinators, and farmers' });
      }
    }
    // Admin can register coordinators and farmers
    else if (currentUserRole === 'admin') {
      if (!['coordinator', 'farmer'].includes(targetRole)) {
        return res.status(403).json({ error: 'Admin can only register coordinators and farmers' });
      }
    }
    // Coordinator can only register farmers
    else if (currentUserRole === 'coordinator') {
      if (targetRole !== 'farmer') {
        return res.status(403).json({ error: 'Coordinator can only register farmers' });
      }
    }
    // Farmers cannot register anyone
    else {
      return res.status(403).json({ error: 'Farmers cannot register new users' });
    }

    // Set managedBy based on role hierarchy
    if (targetRole === 'coordinator') {
      if (currentUserRole === 'superadmin') {
        req.body.managedBy = req.user._id; // Superadmin manages coordinators
      } else if (currentUserRole === 'admin') {
        req.body.managedBy = req.user._id; // Admin manages coordinators
      }
    }

    if (targetRole === 'farmer') {
      if (currentUserRole === 'coordinator') {
        req.body.managedBy = req.user._id; // Coordinator manages farmers
      } else if (currentUserRole === 'admin') {
        // Admin can create farmer for a specific coordinator
        if (!req.body.managedBy) {
          return res.status(400).json({ error: 'managedBy (coordinator ID) is required for farmer when created by admin' });
        }
      } else if (currentUserRole === 'superadmin') {
        // Superadmin can create farmer for a specific coordinator
        if (!req.body.managedBy) {
          return res.status(400).json({ error: 'managedBy (coordinator ID) is required for farmer when created by superadmin' });
        }
      }
    }

    // For admin registration by superadmin, managedBy is not required
    if (targetRole === 'admin' && currentUserRole === 'superadmin') {
      delete req.body.managedBy;
    }

    const user = new User({
      name,
      email,
      password,
      role: targetRole,
      phoneNumber,
      managedBy: req.body.managedBy,
      location,
      profile
    });

    await user.save();
    res.status(201).json({ success: true, user });
  } catch (error) {
    console.log('error', error);
    res.status(500).json({ error: error.message });
  }
};

// Login user
const login = async (req, res) => {
  try {
    logger.info('Login request received', { email: req.body.email });
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    logger.info('User lookup complete', { userFound: !!user });
    if (!user) {
      logger.warn('User not found', { email });
      return res.status(401).json({
        error: 'Authentication failed',
        message: {
          english: 'Invalid email or password',
          marathi: 'अवैध ईमेल किंवा पासवर्ड'
        }
      });
    }

    // Check if user is active
    logger.info('Checking if user is active', { isActive: user.isActive });
    if (!user.isActive) {
      logger.warn('User account disabled', { email });
      return res.status(401).json({
        error: 'Account disabled',
        message: {
          english: 'Your account has been disabled',
          marathi: 'तुमचे खाते अक्षम केले आहे'
        }
      });
    }

    // Verify password
    logger.info('Verifying password');
    const isValidPassword = await user.comparePassword(password);
    logger.info('Password verification result', { isValidPassword });
    if (!isValidPassword) {
      logger.warn('Invalid password', { email });
      return res.status(401).json({
        error: 'Authentication failed',
        message: {
          english: 'Invalid email or password',
          marathi: 'अवैध ईमेल किंवा पासवर्ड'
        }
      });
    }

    // Generate tokens
    logger.info('Generating tokens');
    const { accessToken, refreshToken } = await createTokens(user, req);
    logger.info('Tokens generated');

    // Update last login
    user.lastLogin = new Date();
    await user.save();
    logger.info('User lastLogin updated');

    res.json({
      message: {
        english: 'Login successful',
        marathi: 'लॉगिन यशस्वी'
      },
      user,
      accessToken,
      refreshToken
    });
    logger.info('Login response sent');
  } catch (error) {
    logger.error('Login error:', error);
    res.status(400).json({
      error: 'Login failed',
      message: {
        english: 'Unable to login',
        marathi: 'लॉगिन करण्यात अयशस्वी'
      }
    });
  }
};

// Refresh token
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh token required',
        message: {
          english: 'Refresh token is required',
          marathi: 'रिफ्रेश टोकन आवश्यक आहे'
        }
      });
    }

    // Find refresh token in database
    const savedToken = await RefreshToken.findOne({ token: refreshToken });
    if (!savedToken || !savedToken.isValid()) {
      return res.status(401).json({
        error: 'Invalid refresh token',
        message: {
          english: 'Invalid or expired refresh token',
          marathi: 'अवैध किंवा कालबाह्य रिफ्रेश टोकन'
        }
      });
    }

    // Find user
    const user = await User.findById(savedToken.user);
    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'User not found',
        message: {
          english: 'User not found or inactive',
          marathi: 'वापरकर्ता सापडला नाही किंवा निष्क्रिय आहे'
        }
      });
    }

    // Revoke old refresh token BEFORE creating new one
    savedToken.isRevoked = true;
    await savedToken.save();

    // Generate new tokens (handle duplicate key error gracefully)
    let tokens;
    try {
      tokens = await createTokens(user, req);
    } catch (err) {
      if (err.code !== 11000) throw err; // Ignore duplicate key error
      // If duplicate, reuse the old token (should not happen, but fallback)
      tokens = { accessToken: user.generateAuthToken(), refreshToken: refreshToken };
    }

    res.json({
      message: {
        english: 'Token refresh successful',
        marathi: 'टोकन रिफ्रेश यशस्वी'
      },
      ...tokens
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(400).json({
      error: 'Token refresh failed',
      message: {
        english: 'Unable to refresh token',
        marathi: 'टोकन रिफ्रेश करण्यात अयशस्वी'
      }
    });
  }
};

// Forgot password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: {
          english: 'No user found with this email',
          marathi: 'या ईमेलसह कोणताही वापरकर्ता सापडला नाही'
        }
      });
    }

    // Generate reset token
    const resetToken = user.createPasswordResetToken();
    await user.save();

    // Create reset URL
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${resetToken}`;

    // Send email
    await sendEmail({
      email: user.email,
      subject: 'Password Reset Request',
      template: 'passwordReset',
      data: {
        name: user.name,
        resetURL,
        language: user.preferredLanguage
      }
    });

    res.json({
      message: {
        english: 'Password reset link sent to email',
        marathi: 'पासवर्ड रीसेट लिंक ईमेलवर पाठवली आहे'
      }
    });
  } catch (error) {
    logger.error('Forgot password error:', error);

    // Reset passwordResetToken fields
    if (error.user) {
      error.user.passwordResetToken = undefined;
      error.user.passwordResetExpires = undefined;
      await error.user.save();
    }

    res.status(500).json({
      error: 'Password reset failed',
      message: {
        english: 'Unable to send password reset email',
        marathi: 'पासवर्ड रीसेट ईमेल पाठवण्यात अयशस्वी'
      }
    });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Hash the reset token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        error: 'Invalid token',
        message: {
          english: 'Password reset token is invalid or has expired',
          marathi: 'पासवर्ड रीसेट टोकन अवैध आहे किंवा कालबाह्य झाले आहे'
        }
      });
    }

    // Update password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Generate new tokens
    const tokens = await createTokens(user, req);

    res.json({
      message: {
        english: 'Password reset successful',
        marathi: 'पासवर्ड रीसेट यशस्वी'
      },
      ...tokens
    });
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(400).json({
      error: 'Password reset failed',
      message: {
        english: 'Unable to reset password',
        marathi: 'पासवर्ड रीसेट करण्यात अयशस्वी'
      }
    });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // Revoke refresh token if provided
    if (refreshToken) {
      await RefreshToken.findOneAndUpdate(
        { token: refreshToken },
        { isRevoked: true }
      );
    }

    res.json({
      message: {
        english: 'Logout successful',
        marathi: 'लॉगआउट यशस्वी'
      }
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: {
        english: 'Unable to logout',
        marathi: 'लॉगआउट करण्यात अयशस्वी'
      }
    });
  }
};

// In-memory OTP store (for demo; use Redis or DB in production)
const otpStore = {};

// Mobile OTP request
const mobileOtpRequest = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number required' });
    }
    
    // Find user
    const user = await User.findOne({ phoneNumber, isActive: true });
    if (!user) {
      return res.status(404).json({ error: 'User not found or inactive' });
    }
    
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[phoneNumber] = { otp, expires: Date.now() + 5 * 60 * 1000 };
    
    // Send SMS with OTP
    const message = `Your Smart Krishi OTP is: ${otp}. Valid for 5 minutes.`;
    
    // Always log OTP for testing (since SMS is not configured properly)
    logger.info(`OTP for ${phoneNumber}: ${otp} - Use this OTP for testing`);
    
    try {
      await sendSMSAlert(message, phoneNumber);
      logger.info(`SMS sent to ${phoneNumber} with OTP: ${otp}`);
    } catch (smsError) {
      logger.error('SMS sending failed:', smsError);
      // SMS failed, but OTP is logged above for testing
    }
    
    res.json({ message: { english: 'OTP sent', marathi: 'ओटीपी पाठवला' } });
  } catch (error) {
    logger.error('Mobile OTP request error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
};

// Mobile OTP verify
const mobileOtpVerify = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;
    if (!phoneNumber || !otp) {
      return res.status(400).json({ error: 'Phone number and OTP required' });
    }
    const record = otpStore[phoneNumber];
    if (!record || record.otp !== otp || record.expires < Date.now()) {
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }
    // OTP valid, delete it
    delete otpStore[phoneNumber];
    // Find user
    const user = await User.findOne({ phoneNumber, isActive: true });
    if (!user) {
      return res.status(404).json({ error: 'User not found or inactive' });
    }
    // Generate tokens
    const { accessToken, refreshToken } = await createTokens(user, req);
    user.lastLogin = new Date();
    await user.save();
    res.json({
      message: { english: 'Login successful', marathi: 'लॉगिन यशस्वी' },
      user,
      accessToken,
      refreshToken
    });
  } catch (error) {
    logger.error('Mobile OTP verify error:', error);
    res.status(500).json({ error: 'OTP verification failed' });
  }
};

// Test SMS function (for debugging)
const testSMS = async (req, res) => {
  try {
    const { phoneNumber, message = 'Test SMS from Smart Krishi' } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number required' });
    }
    
    try {
      await sendSMSAlert(message, phoneNumber);
      logger.info(`Test SMS sent to ${phoneNumber}`);
      res.json({ success: true, message: 'Test SMS sent successfully' });
    } catch (smsError) {
      logger.error('Test SMS failed:', smsError);
      res.status(500).json({ error: 'SMS sending failed', details: smsError.message });
    }
  } catch (error) {
    logger.error('Test SMS error:', error);
    res.status(500).json({ error: 'Test SMS failed' });
  }
};

module.exports = {
  register,
  login,
  refresh,
  forgotPassword,
  resetPassword,
  logout,
  getProfile: require('./profileController').getProfile,
  updateProfile: require('./profileController').updateProfile,
  mobileOtpRequest,
  mobileOtpVerify,
  testSMS
}; 