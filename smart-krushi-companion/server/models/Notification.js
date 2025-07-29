const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  fieldId: {
    type: String,
    required: false,
    index: true
  },
  type: {
    type: String,
    enum: ['alert', 'warning', 'info', 'success', 'weather', 'disease', 'irrigation', 'sensor'],
    default: 'info'
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  expiresAt: {
    type: Date,
    default: null
  },
  sentVia: [{
    type: String,
    enum: ['app', 'email', 'sms', 'push'],
    default: ['app']
  }],
  metadata: {
    source: String,
    category: String,
    tags: [String],
    relatedField: String,
    sensorData: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes for better query performance
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ fieldId: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ priority: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { sparse: true });

// TTL index to automatically delete expired notifications
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for time since creation
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
});

// Static method to create notification
notificationSchema.statics.createNotification = async function(notificationData) {
  try {
    const notification = new this(notificationData);
    await notification.save();
    
    // Emit real-time event if using Socket.IO or SSE
    if (global.io) {
      global.io.to(notificationData.userId.toString()).emit('newNotification', notification);
    }
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Static method to create bulk notifications
notificationSchema.statics.createBulkNotifications = async function(notificationsData) {
  try {
    const notifications = await this.insertMany(notificationsData);
    
    // Emit real-time events for each notification
    if (global.io) {
      notifications.forEach(notification => {
        global.io.to(notification.userId.toString()).emit('newNotification', notification);
      });
    }
    
    return notifications;
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    throw error;
  }
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
  try {
    return await this.countDocuments({ userId, read: false });
  } catch (error) {
    console.error('Error getting unread count:', error);
    throw error;
  }
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = async function(userId) {
  try {
    const result = await this.updateMany(
      { userId, read: false },
      { read: true }
    );
    
    // Emit real-time event
    if (global.io) {
      global.io.to(userId.toString()).emit('notificationsMarkedRead');
    }
    
    return result;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Static method to delete old notifications
notificationSchema.statics.cleanupOldNotifications = async function(daysOld = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const result = await this.deleteMany({
      createdAt: { $lt: cutoffDate },
      read: true
    });
    
    console.log(`Cleaned up ${result.deletedCount} old notifications`);
    return result;
  } catch (error) {
    console.error('Error cleaning up old notifications:', error);
    throw error;
  }
};

// Instance method to mark as read
notificationSchema.methods.markAsRead = async function() {
  try {
    this.read = true;
    await this.save();
    
    // Emit real-time event
    if (global.io) {
      global.io.to(this.userId.toString()).emit('notificationRead', this._id);
    }
    
    return this;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Pre-save middleware to set expiration for certain types
notificationSchema.pre('save', function(next) {
  // Set expiration for weather and sensor notifications (24 hours)
  if (['weather', 'sensor'].includes(this.type) && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  
  // Set expiration for low priority notifications (7 days)
  if (this.priority === 'low' && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
  
  next();
});

// Pre-remove middleware to emit deletion event
notificationSchema.pre('remove', function(next) {
  if (global.io) {
    global.io.to(this.userId.toString()).emit('notificationDeleted', this._id);
  }
  next();
});

module.exports = mongoose.model('Notification', notificationSchema); 