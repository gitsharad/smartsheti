const axios = require('axios');
const NodeCache = require('node-cache');
const { logger } = require('./logger');

// Cache weather data for 30 minutes
const weatherCache = new NodeCache({ stdTTL: 1800 });

class WeatherService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
  }

  async getCurrentWeather(city) {
    const cacheKey = `weather:${city}`;
    const cachedData = weatherCache.get(cacheKey);

    if (cachedData) {
      logger.info(`Returning cached weather data for ${city}`);
      return cachedData;
    }

    try {
      const url = `${this.baseUrl}/weather?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=metric&lang=mr`;
      const response = await axios.get(url);
      const weather = response.data;

      const formattedData = {
        temperature: weather.main.temp,
        humidity: weather.main.humidity,
        rainChance: this._calculateRainChance(weather),
        windSpeed: weather.wind.speed,
        description: weather.weather[0].description,
        timestamp: new Date().toISOString()
      };

      weatherCache.set(cacheKey, formattedData);
      return formattedData;
    } catch (error) {
      logger.error('Weather API error:', error.response?.data || error.message);
      throw new Error('Failed to fetch weather data');
    }
  }

  async getForecast(city) {
    const cacheKey = `forecast:${city}`;
    const cachedData = weatherCache.get(cacheKey);

    if (cachedData) {
      logger.info(`Returning cached forecast data for ${city}`);
      return cachedData;
    }

    try {
      const url = `${this.baseUrl}/forecast?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=metric&lang=mr`;
      const response = await axios.get(url);
      const forecast = response.data;

      const formattedData = {
        daily: forecast.list.slice(0, 5).map(day => ({
          date: new Date(day.dt * 1000).toISOString().split('T')[0],
          temperature: {
            min: day.main.temp_min,
            max: day.main.temp_max
          },
          humidity: day.main.humidity,
          precipitation: this._calculatePrecipitation(day),
          description: {
            marathi: day.weather[0].description,
            english: this._translateWeatherToEnglish(day.weather[0].main)
          }
        }))
      };

      weatherCache.set(cacheKey, formattedData);
      return formattedData;
    } catch (error) {
      logger.error('Forecast API error:', error.response?.data || error.message);
      throw new Error('Failed to fetch forecast data');
    }
  }

  _calculateRainChance(weather) {
    if (weather.rain) {
      return 100;
    }
    if (weather.clouds.all > 75) {
      return 60;
    }
    if (weather.clouds.all > 50) {
      return 30;
    }
    return 0;
  }

  _calculatePrecipitation(day) {
    return (day.rain?.['3h'] || 0) * 8; // Convert 3h rain to 24h estimate
  }

  _translateWeatherToEnglish(condition) {
    const translations = {
      'Clear': 'Clear sky',
      'Clouds': 'Cloudy',
      'Rain': 'Rainy',
      'Drizzle': 'Light rain',
      'Thunderstorm': 'Thunderstorm',
      'Snow': 'Snow',
      'Mist': 'Misty',
      'Fog': 'Foggy'
    };
    return translations[condition] || condition;
  }
}

module.exports = WeatherService; 