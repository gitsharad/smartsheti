const Notification = require('../models/Notification');
const User = require('../models/User');
const Field = require('../models/Field');
const { SensorData } = require('../utils/mongoClient');

// Store active SSE connections
const sseConnections = new Map();

// Get user notifications
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, read } = req.query;
    const userId = req.user._id;

    const query = { userId };
    if (type) query.type = type;
    if (read !== undefined) query.read = read === 'true';

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('userId', 'name email');

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.getUnreadCount(userId);

    res.json({
      notifications,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

// Get latest notifications (for polling fallback)
const getLatestNotifications = async (req, res) => {
  try {
    const { since } = req.query;
    const userId = req.user._id;

    const query = { userId };
    if (since) {
      query.createdAt = { $gt: new Date(since) };
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ notifications });
  } catch (error) {
    console.error('Error fetching latest notifications:', error);
    res.status(500).json({ error: 'Failed to fetch latest notifications' });
  }
};

// Get unread count
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const count = await Notification.getUnreadCount(userId);
    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOne({ _id: id, userId });
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await notification.markAsRead();
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    await Notification.markAllAsRead(userId);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndDelete({ _id: id, userId });
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
};

// Clear read notifications
const clearReadNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await Notification.deleteMany({ userId, read: true });
    res.json({ message: `${result.deletedCount} read notifications cleared` });
  } catch (error) {
    console.error('Error clearing read notifications:', error);
    res.status(500).json({ error: 'Failed to clear read notifications' });
  }
};

// Server-Sent Events stream
const streamNotifications = async (req, res) => {
  const userId = req.user._id;

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connection', message: 'Connected to notification stream' })}\n\n`);

  // Store connection
  sseConnections.set(userId.toString(), res);

  // Send existing unread notifications
  try {
    const unreadNotifications = await Notification.find({ userId, read: false })
      .sort({ createdAt: -1 })
      .limit(5);

    unreadNotifications.forEach(notification => {
      res.write(`data: ${JSON.stringify({ type: 'notification', data: notification })}\n\n`);
    });
  } catch (error) {
    console.error('Error sending existing notifications:', error);
  }

  // Handle client disconnect
  req.on('close', () => {
    sseConnections.delete(userId.toString());
    console.log(`SSE connection closed for user ${userId}`);
  });

  // Keep connection alive with heartbeat
  const heartbeat = setInterval(() => {
    if (sseConnections.has(userId.toString())) {
      res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`);
    } else {
      clearInterval(heartbeat);
    }
  }, 30000); // Send heartbeat every 30 seconds
};

// Create notification (admin/coordinator only)
const createNotification = async (req, res) => {
  try {
    const { userId, type, title, message, data, priority, fieldId } = req.body;
    const currentUser = req.user;

    // Check permissions
    if (!['admin', 'coordinator'].includes(currentUser.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // If coordinator, can only create notifications for their farmers
    if (currentUser.role === 'coordinator') {
      const targetUser = await User.findById(userId);
      if (!targetUser || targetUser.managedBy?.toString() !== currentUser._id.toString()) {
        return res.status(403).json({ error: 'Can only create notifications for managed farmers' });
      }
    }

    const notification = await Notification.createNotification({
      userId,
      type,
      title,
      message,
      data,
      priority,
      fieldId
    });

    res.status(201).json({ notification });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
};

// Create bulk notifications
const createBulkNotifications = async (req, res) => {
  try {
    const { notifications } = req.body;
    const currentUser = req.user;

    // Check permissions
    if (!['admin', 'coordinator'].includes(currentUser.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Validate notifications
    if (!Array.isArray(notifications) || notifications.length === 0) {
      return res.status(400).json({ error: 'Invalid notifications array' });
    }

    // If coordinator, validate user access
    if (currentUser.role === 'coordinator') {
      const userIds = [...new Set(notifications.map(n => n.userId))];
      const users = await User.find({ _id: { $in: userIds } });
      
      const unauthorizedUsers = users.filter(user => 
        user.managedBy?.toString() !== currentUser._id.toString()
      );
      
      if (unauthorizedUsers.length > 0) {
        return res.status(403).json({ error: 'Cannot create notifications for unauthorized users' });
      }
    }

    const createdNotifications = await Notification.createBulkNotifications(notifications);
    res.status(201).json({ notifications: createdNotifications });
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    res.status(500).json({ error: 'Failed to create bulk notifications' });
  }
};

// Create field-specific alert
const createFieldAlert = async (req, res) => {
  try {
    const { fieldId, type, title, message, priority = 'medium' } = req.body;
    const currentUser = req.user;

    // Check permissions
    if (!['admin', 'coordinator'].includes(currentUser.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Get field and validate access
    const field = await Field.findOne({ fieldId });
    if (!field) {
      return res.status(404).json({ error: 'Field not found' });
    }

    // If coordinator, check if they manage the field owner
    if (currentUser.role === 'coordinator') {
      const fieldOwner = await User.findById(field.owner);
      if (!fieldOwner || fieldOwner.managedBy?.toString() !== currentUser._id.toString()) {
        return res.status(403).json({ error: 'Cannot create alerts for this field' });
      }
    }

    const notification = await Notification.createNotification({
      userId: field.owner,
      type,
      title,
      message,
      priority,
      fieldId,
      data: { fieldName: field.name }
    });

    res.status(201).json({ notification });
  } catch (error) {
    console.error('Error creating field alert:', error);
    res.status(500).json({ error: 'Failed to create field alert' });
  }
};

// Create weather alert
const createWeatherAlert = async (req, res) => {
  try {
    const { fieldId, weatherData, severity } = req.body;
    const currentUser = req.user;

    // Check permissions
    if (!['admin', 'coordinator'].includes(currentUser.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Get field
    const field = await Field.findOne({ fieldId });
    if (!field) {
      return res.status(404).json({ error: 'Field not found' });
    }

    const title = `Weather Alert - ${field.name}`;
    const message = `Weather conditions require attention: ${weatherData.description}`;
    const priority = severity === 'severe' ? 'high' : 'medium';

    const notification = await Notification.createNotification({
      userId: field.owner,
      type: 'weather',
      title,
      message,
      priority,
      fieldId,
      data: { weatherData, severity }
    });

    res.status(201).json({ notification });
  } catch (error) {
    console.error('Error creating weather alert:', error);
    res.status(500).json({ error: 'Failed to create weather alert' });
  }
};

// Create sensor alert
const createSensorAlert = async (req, res) => {
  try {
    const { fieldId, sensorType, value, threshold, condition } = req.body;
    const currentUser = req.user;

    // Check permissions
    if (!['admin', 'coordinator'].includes(currentUser.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Get field
    const field = await Field.findOne({ fieldId });
    if (!field) {
      return res.status(404).json({ error: 'Field not found' });
    }

    const title = `Sensor Alert - ${field.name}`;
    const message = `${sensorType} sensor reading (${value}) is ${condition} threshold (${threshold})`;
    const priority = condition === 'above' ? 'high' : 'medium';

    const notification = await Notification.createNotification({
      userId: field.owner,
      type: 'sensor',
      title,
      message,
      priority,
      fieldId,
      data: { sensorType, value, threshold, condition }
    });

    res.status(201).json({ notification });
  } catch (error) {
    console.error('Error creating sensor alert:', error);
    res.status(500).json({ error: 'Failed to create sensor alert' });
  }
};

// Utility function to send notification to SSE connection
const sendNotificationToUser = (userId, notification) => {
  const connection = sseConnections.get(userId.toString());
  if (connection) {
    connection.write(`data: ${JSON.stringify({ type: 'notification', data: notification })}\n\n`);
  }
};

// Utility function to broadcast notification to multiple users
const broadcastNotification = (userIds, notification) => {
  userIds.forEach(userId => {
    sendNotificationToUser(userId, notification);
  });
};

module.exports = {
  getNotifications,
  getLatestNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications,
  streamNotifications,
  createNotification,
  createBulkNotifications,
  createFieldAlert,
  createWeatherAlert,
  createSensorAlert,
  sendNotificationToUser,
  broadcastNotification
}; 