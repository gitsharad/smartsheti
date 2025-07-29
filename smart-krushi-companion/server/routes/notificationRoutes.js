const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { auth } = require('../middleware/auth');

// Apply authentication to all routes
router.use(auth);

// REST endpoints
router.get('/', notificationController.getNotifications);
router.get('/latest', notificationController.getLatestNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.put('/:id/read', notificationController.markAsRead);
router.put('/mark-all-read', notificationController.markAllAsRead);
router.delete('/:id', notificationController.deleteNotification);
router.delete('/clear-read', notificationController.clearReadNotifications);

// Server-Sent Events endpoint for real-time notifications
router.get('/stream', notificationController.streamNotifications);

// Admin endpoints (for creating notifications)
router.post('/', notificationController.createNotification);
router.post('/bulk', notificationController.createBulkNotifications);
router.post('/field-alert', notificationController.createFieldAlert);
router.post('/weather-alert', notificationController.createWeatherAlert);
router.post('/sensor-alert', notificationController.createSensorAlert);

module.exports = router; 