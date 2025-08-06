const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long']
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'coordinator', 'farmer'],
    default: 'farmer'
  },
  // Hierarchical relationships
  managedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // Only farmers have a manager (coordinator)
    required: function() { return this.role === 'farmer'; }
  },
  managedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Field assignments
  assignedFields: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Field'
  }],
  // Personal fields (for farmers)
  ownedFields: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Field'
  }],
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[\d\s\-\(\)\+]+$/, 'Please enter a valid phone number']
  },
  preferredLanguage: {
    type: String,
    enum: ['english', 'marathi', 'hindi'],
    default: 'marathi'
  },
  // Enhanced location and address information
  address: {
    type: String,
    trim: true
  },
  village: {
    type: String,
    trim: true
  },
  district: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  pincode: {
    type: String,
    match: [/^[0-9]{6}$/, 'Pincode must be 6 digits']
  },
  // Location and personal info
  location: {
    state: String,
    district: String,
    village: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  // Profile image
  profileImage: {
    type: String,
    trim: true
  },
  // Profile information
  profile: {
    avatar: String,
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },
    education: {
      type: String,
      enum: ['primary', 'secondary', 'higher_secondary', 'graduate', 'post_graduate']
    },
    farmingExperience: Number, // in years
    landHolding: Number, // in acres
    primaryCrops: [String]
  },
  // Status and activity
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  // Device and app info
  deviceInfo: {
    mobileAppVersion: String,
    lastMobileLogin: Date,
    webAppLastLogin: Date
  },
  // Permissions based on role
  permissions: {
    type: [String],
    default: function() {
      switch(this.role) {
        case 'superadmin':
          return ['manage_all', 'manage_admins', 'manage_coordinators', 'manage_farmers', 'view_reports', 'system_settings', 'billing'];
        case 'admin':
          return ['manage_coordinators', 'manage_farmers', 'view_reports', 'system_settings', 'billing'];
        case 'coordinator':
          return ['manage_farmers', 'view_reports', 'manage_fields', 'view_analytics'];
        case 'farmer':
          return ['view_own_data', 'view_reports', 'manage_own_fields'];
        default:
          return [];
      }
    }
  },
  // Security and tokens
  passwordResetToken: String,
  passwordResetExpires: Date,
  passwordChangedAt: Date,
  // Notification preferences
  notificationPreferences: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    alerts: { type: Boolean, default: true },
    reports: { type: Boolean, default: true }
  }
}, {
  timestamps: true
});

// Indexes for performance
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ managedBy: 1 });
userSchema.index({ email: 1 });
userSchema.index({ 'location.district': 1, 'location.village': 1 });
userSchema.index({ village: 1, district: 1, state: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    
    // Update passwordChangedAt if password is changed (but not when new user is created)
    if (this.isModified('password') && !this.isNew) {
      this.passwordChangedAt = Date.now() - 1000; // subtract 1 second to ensure token is created after password change
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token with role and hierarchy info
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      email: this.email,
      role: this.role,
      name: this.name,
      managedBy: this.managedBy,
      permissions: this.permissions,
      version: this.passwordChangedAt ? this.passwordChangedAt.getTime() : undefined
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '15m'
    }
  );
};

// Generate Refresh Token
userSchema.methods.generateRefreshToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      version: this.passwordChangedAt ? this.passwordChangedAt.getTime() : undefined
    },
    process.env.REFRESH_TOKEN_SECRET,
    { 
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'
    }
  );
};

// Create password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Virtual for user's full address
userSchema.virtual('fullAddress').get(function() {
  const parts = [];
  if (this.address) parts.push(this.address);
  if (this.village) parts.push(this.village);
  if (this.district) parts.push(this.district);
  if (this.state) parts.push(this.state);
  if (this.pincode) parts.push(this.pincode);
  return parts.join(', ');
});

// Virtual for notifications (compatibility with frontend)
userSchema.virtual('notifications').get(function() {
  return this.notificationPreferences && 
         (this.notificationPreferences.email || 
          this.notificationPreferences.sms || 
          this.notificationPreferences.push || 
          this.notificationPreferences.alerts || 
          this.notificationPreferences.reports);
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

const User = mongoose.model('User', userSchema);

module.exports = User; 