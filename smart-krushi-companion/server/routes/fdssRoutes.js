const express = require('express');
const compression = require('compression');
const fdssController = require('../controllers/fdssController');

const router = express.Router();

// Apply compression to all routes
router.use(compression());

// GET /api/fdss/weather/current - Get current weather data
router.get('/weather/current', fdssController.getCurrentWeather);

/**
 * @swagger
 * /api/fdss/insights:
 *   get:
 *     summary: Get farm insights and recommendations
 *     tags: [FDSS]
 *     parameters:
 *       - in: query
 *         name: fieldId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the field
 *     responses:
 *       200:
 *         description: Farm insights and recommendations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 insights:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         enum: [alert, recommendation, info]
 *                       message:
 *                         type: object
 *                         properties:
 *                           marathi:
 *                             type: string
 *                           english:
 *                             type: string
 *                       priority:
 *                         type: string
 *                         enum: [low, medium, high]
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Missing field ID
 *       500:
 *         description: Server error
 */
router.get('/insights', fdssController.validateFieldId, fdssController.getInsights);

/**
 * @swagger
 * /api/fdss/weather:
 *   get:
 *     summary: Get weather forecast for the field
 *     tags: [FDSS]
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: City name (defaults to Pune)
 *     responses:
 *       200:
 *         description: Weather forecast data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 daily:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                       temperature:
 *                         type: object
 *                         properties:
 *                           min:
 *                             type: number
 *                           max:
 *                             type: number
 *                       humidity:
 *                         type: number
 *                       precipitation:
 *                         type: number
 *                       description:
 *                         type: object
 *                         properties:
 *                           marathi:
 *                             type: string
 *                           english:
 *                             type: string
 */
router.get('/weather', fdssController.getWeatherForecast);

module.exports = router; 