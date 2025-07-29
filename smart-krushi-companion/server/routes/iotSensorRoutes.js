const express = require('express');
const router = express.Router();
const iotSensorController = require('../controllers/iotSensorController');
const { auth } = require('../middleware/auth');

// Apply authentication to all routes
router.use(auth);

// Sensor management endpoints
router.get('/', iotSensorController.getUserSensors);
router.post('/', iotSensorController.createSensor);
router.get('/statistics', iotSensorController.getSensorStatistics);
router.get('/offline', iotSensorController.getOfflineSensors);
router.get('/maintenance-schedule', iotSensorController.getMaintenanceSchedule);
router.get('/data-quality-report', iotSensorController.getDataQualityReport);

// Sensor-specific endpoints
router.get('/:id', iotSensorController.getSensorById);
router.put('/:id', iotSensorController.updateSensor);
router.post('/:id/maintenance', iotSensorController.addMaintenanceRecord);

// Real-time IoT device endpoints (for actual sensors)
router.put('/heartbeat/:sensorId', iotSensorController.updateSensorHeartbeat);
router.post('/error/:sensorId', iotSensorController.recordSensorError);

module.exports = router; 