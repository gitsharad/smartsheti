const { SensorData } = require('../utils/mongoClient');
const { logger } = require('../utils/logger');
const WeatherService = require('../utils/weatherService');
const InsightGenerator = require('../utils/insightGenerator');
const compression = require('compression');

const weatherService = new WeatherService(process.env.OPENWEATHER_API_KEY);
const insightGenerator = new InsightGenerator();

// Middleware for request validation
const validateFieldId = (req, res, next) => {
  const { fieldId } = req.query;
  if (!fieldId) {
    return res.status(400).json({ 
      error: 'Field ID is required',
      message: {
        english: 'Field ID is required',
        marathi: 'फील्ड आयडी आवश्यक आहे'
      }
    });
  }
  next();
};

// Controller functions
const getCurrentWeather = async (req, res) => {
  try {
    const { city = 'Pune' } = req.query;
    const weatherData = await weatherService.getCurrentWeather(city);
    res.json(weatherData);
  } catch (error) {
    logger.error('Weather fetch error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch weather data',
      message: {
        english: 'Failed to fetch weather data',
        marathi: 'हवामान माहिती मिळवण्यात अयशस्वी'
      }
    });
  }
};

const getInsights = async (req, res) => {
  try {
    const { fieldId } = req.query;
    const [weatherData, sensorData] = await Promise.all([
      weatherService.getCurrentWeather('Pune'), // Default to Pune if location not specified
      SensorData.findOne({ fieldId }).sort({ timestamp: -1 })
    ]);

    const insights = insightGenerator.generateInsights(sensorData, weatherData);

    // Format response
    const formattedInsights = {
      insights: [
        ...insights.immediateActions.map(i => ({
          type: 'alert',
          message: { marathi: i.description, english: '' },
          priority: i.priority,
          timestamp: new Date().toISOString()
        })),
        ...insights.riskAlerts.map(i => ({
          type: 'alert',
          message: { marathi: i.description, english: '' },
          priority: i.priority,
          timestamp: new Date().toISOString()
        })),
        ...insights.recommendations.map(i => ({
          type: 'recommendation',
          message: { marathi: i.description, english: '' },
          priority: i.priority,
          timestamp: new Date().toISOString()
        }))
      ]
    };
    
    res.json(formattedInsights);
  } catch (error) {
    logger.error('Error generating insights:', error);
    res.status(500).json({ 
      error: 'Failed to generate insights',
      message: {
        english: 'Failed to generate farm insights',
        marathi: 'शेती विश्लेषण तयार करण्यात अयशस्वी'
      }
    });
  }
};

const getWeatherForecast = async (req, res) => {
  try {
    const { city = 'Pune' } = req.query;
    const forecast = await weatherService.getForecast(city);
    res.json(forecast);
  } catch (error) {
    logger.error('Error fetching weather forecast:', error);
    res.status(500).json({ 
      error: 'Failed to fetch weather forecast',
      message: {
        english: 'Failed to fetch weather forecast',
        marathi: 'हवामान अंदाज मिळवण्यात अयशस्वी'
      }
    });
  }
};

module.exports = {
  getCurrentWeather,
  getInsights,
  getWeatherForecast,
  validateFieldId
}; 