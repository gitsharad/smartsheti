const { logger } = require('./logger');

const validateSensorData = (req, res, next) => {
  const { 
    fieldId, 
    moisture, 
    temperature, 
    timestamp,
    deviceId,
    location
  } = req.body;

  const errors = [];

  // Required fields validation
  if (!fieldId) errors.push('fieldId is required');
  if (moisture === undefined) errors.push('moisture is required');
  if (temperature === undefined) errors.push('temperature is required');
  if (!timestamp) errors.push('timestamp is required');

  // Type validation
  if (typeof fieldId !== 'string') errors.push('fieldId must be a string');
  if (typeof moisture !== 'number') errors.push('moisture must be a number');
  if (typeof temperature !== 'number') errors.push('temperature must be a number');
  if (!isValidDate(timestamp)) errors.push('timestamp must be a valid date string');

  // Range validation
  if (moisture < 0 || moisture > 100) errors.push('moisture must be between 0-100%');
  if (temperature < -10 || temperature > 60) errors.push('temperature must be between -10°C to 60°C');

  // Optional fields validation
  if (deviceId && typeof deviceId !== 'string') errors.push('deviceId must be a string');
  if (location && typeof location !== 'string') errors.push('location must be a string');

  if (errors.length > 0) {
    logger.warn(`Sensor data validation failed: ${errors.join(', ')}`);
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors,
      message: {
        english: 'Invalid sensor data format',
        marathi: 'सेन्सर डेटा फॉरमॅट अवैध आहे'
      }
    });
  }

  next();
};

const validateFieldId = (req, res, next) => {
  const { fieldId } = req.query;
  
  if (!fieldId) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: ['fieldId is required'],
      message: {
        english: 'Field ID is required',
        marathi: 'फील्ड आयडी आवश्यक आहे'
      }
    });
  }

  if (typeof fieldId !== 'string') {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: ['fieldId must be a string'],
      message: {
        english: 'Field ID must be text',
        marathi: 'फील्ड आयडी टेक्स्ट असावा'
      }
    });
  }

  next();
};

const validateDeviceId = (req, res, next) => {
  const { deviceId } = req.query;
  
  if (!deviceId) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: ['deviceId is required'],
      message: {
        english: 'Device ID is required',
        marathi: 'डिव्हाइस आयडी आवश्यक आहे'
      }
    });
  }

  if (typeof deviceId !== 'string') {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: ['deviceId must be a string'],
      message: {
        english: 'Device ID must be text',
        marathi: 'डिव्हाइस आयडी टेक्स्ट असावा'
      }
    });
  }

  next();
};

function isValidDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

module.exports = {
  validateSensorData,
  validateFieldId,
  validateDeviceId
}; 