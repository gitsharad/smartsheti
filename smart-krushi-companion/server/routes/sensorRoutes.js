const express = require('express');
const router = express.Router();
const { receiveSensorData, getLatestSensorData, getSensorData24h, getDeviceStatus } = require('../controllers/sensorController');
const { validateSensorData, validateFieldId, validateDeviceId } = require('../utils/validators');

/**
 * @swagger
 * components:
 *   schemas:
 *     SensorData:
 *       type: object
 *       required:
 *         - fieldId
 *         - moisture
 *         - temperature
 *         - timestamp
 *       properties:
 *         fieldId:
 *           type: string
 *           description: Unique identifier for the field
 *           example: "plot1"
 *         moisture:
 *           type: number
 *           description: Soil moisture percentage (0-100)
 *           minimum: 0
 *           maximum: 100
 *           example: 45.5
 *         temperature:
 *           type: number
 *           description: Temperature in Celsius (-10 to 60)
 *           minimum: -10
 *           maximum: 60
 *           example: 28.3
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Time when the reading was taken
 *           example: "2024-02-20T10:30:00Z"
 *         deviceId:
 *           type: string
 *           description: ID of the sensor device (optional)
 *           example: "ESP32_001"
 *         location:
 *           type: string
 *           description: Location description (optional)
 *           example: "North field"
 *   responses:
 *     ValidationError:
 *       description: Invalid input data
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               error:
 *                 type: string
 *                 example: "Validation failed"
 *               details:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["moisture must be between 0-100%"]
 *               message:
 *                 type: object
 *                 properties:
 *                   english:
 *                     type: string
 *                   marathi:
 *                     type: string
 */

/**
 * @swagger
 * /api/v1/sensor-data:
 *   post:
 *     summary: Submit new sensor data
 *     tags: [Sensors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SensorData'
 *     responses:
 *       201:
 *         description: Sensor data saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/SensorData'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         description: Server error
 */
router.post('/', validateSensorData, receiveSensorData);

/**
 * @swagger
 * /api/v1/sensor-data/latest:
 *   get:
 *     summary: Get latest sensor data for a field
 *     tags: [Sensors]
 *     parameters:
 *       - in: query
 *         name: fieldId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the field
 *         example: "plot1"
 *     responses:
 *       200:
 *         description: Latest sensor data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SensorData'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         description: No data found for the field
 */
router.get('/latest', validateFieldId, getLatestSensorData);

/**
 * @swagger
 * /api/v1/sensor-data/24h:
 *   get:
 *     summary: Get sensor data for the last 24 hours
 *     tags: [Sensors]
 *     parameters:
 *       - in: query
 *         name: fieldId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the field
 *         example: "plot1"
 *     responses:
 *       200:
 *         description: 24-hour sensor data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SensorData'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get('/24h', validateFieldId, getSensorData24h);

/**
 * @swagger
 * /api/v1/sensor-data/device-status:
 *   get:
 *     summary: Get device status
 *     tags: [Sensors]
 *     parameters:
 *       - in: query
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the sensor device
 *         example: "ESP32_001"
 *     responses:
 *       200:
 *         description: Device status information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [online, offline]
 *                 lastSeen:
 *                   type: string
 *                   format: date-time
 *                 lastData:
 *                   type: object
 *                   properties:
 *                     moisture:
 *                       type: number
 *                     temperature:
 *                       type: number
 *                     fieldId:
 *                       type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get('/device-status', validateDeviceId, getDeviceStatus);

module.exports = router; 