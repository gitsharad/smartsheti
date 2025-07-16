const express = require('express');
const router = express.Router();
const ndviController = require('../controllers/ndviController');

/**
 * @swagger
 * /api/v1/ndvi/register-field:
 *   post:
 *     summary: Register a new field for NDVI monitoring
 *     tags: [NDVI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lat
 *               - lon
 *             properties:
 *               lat:
 *                 type: number
 *                 description: Latitude of the field center
 *                 example: 28.9845
 *               lon:
 *                 type: number
 *                 description: Longitude of the field center
 *                 example: 77.7064
 *               radius:
 *                 type: number
 *                 description: Field radius in meters
 *                 default: 500
 *                 example: 500
 *               name:
 *                 type: string
 *                 description: Name of the field
 *                 default: "My Farm"
 *                 example: "My Farm"
 *     responses:
 *       200:
 *         description: Field registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fieldId:
 *                   type: string
 *                   description: ID of the registered field
 *       400:
 *         description: Invalid coordinates
 *       500:
 *         description: Server error
 */
router.post('/register-field', ndviController.registerField);

/**
 * @swagger
 * /api/v1/ndvi/time-series:
 *   get:
 *     summary: Get NDVI time series data for a field
 *     tags: [NDVI]
 *     parameters:
 *       - in: query
 *         name: fieldId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the registered field
 *         example: "68624a185a63912974b289bb"
 *     responses:
 *       200:
 *         description: NDVI time series data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ndvi:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date-time
 *                       ndvi:
 *                         type: number
 *       400:
 *         description: Missing field ID
 *       500:
 *         description: Server error
 */
router.get('/time-series', ndviController.fetchNDVITimeSeries);

module.exports = router; 