const { SensorData } = require('../utils/mongoClient');
const { sendSMSAlert, sendWhatsAppAlert } = require('../utils/alertService');
const { logger } = require('../utils/logger');

// Alert thresholds
const ALERT_THRESHOLDS = {
  moisture: { low: 25, critical: 15 },
  temperature: { high: 35, critical: 40 }
};

// Alert cooldown to prevent spam (in minutes)
const ALERT_COOLDOWN = 30; // 30 minutes
let lastAlertTime = {};

exports.receiveSensorData = async (req, res) => {
  try {
    const { 
      fieldId, 
      moisture, 
      temperature, 
      timestamp, 
      deviceId = 'unknown',
      location = 'unknown'
    } = req.body;

    // Create sensor data document
    const data = new SensorData({ 
      fieldId, 
      moisture, 
      temperature, 
      timestamp: new Date(timestamp),
      deviceId,
      location
    });
    await data.save();

    // Check for alerts
    await checkAndSendAlerts(fieldId, moisture, temperature, deviceId, location);

    res.status(201).json({ 
      message: {
        english: 'Sensor data stored successfully',
        marathi: 'सेन्सर डेटा यशस्वीरित्या साठवला'
      },
      data: {
        fieldId,
        moisture,
        temperature,
        timestamp: data.timestamp,
        deviceId,
        location
      }
    });

  } catch (err) {
    logger.error('Error storing sensor data:', err);
    res.status(500).json({ 
      error: 'Failed to store sensor data',
      message: {
        english: 'Failed to store sensor data',
        marathi: 'सेन्सर डेटा साठवण्यात अयशस्वी'
      }
    });
  }
};

async function checkAndSendAlerts(fieldId, moisture, temperature, deviceId, location) {
  const now = Date.now();
  const alertKey = `${fieldId}_${deviceId}`;
  
  // Check if enough time has passed since last alert
  if (lastAlertTime[alertKey] && (now - lastAlertTime[alertKey]) < (ALERT_COOLDOWN * 60 * 1000)) {
    return; // Skip alert due to cooldown
  }

  let alerts = [];

  // Moisture alerts
  if (moisture <= ALERT_THRESHOLDS.moisture.critical) {
    alerts.push(`🚨 CRITICAL: Moisture extremely low (${moisture}%) in ${fieldId}`);
  } else if (moisture <= ALERT_THRESHOLDS.moisture.low) {
    alerts.push(`⚠️ WARNING: Moisture low (${moisture}%) in ${fieldId}`);
  }

  // Temperature alerts
  if (temperature >= ALERT_THRESHOLDS.temperature.critical) {
    alerts.push(`🚨 CRITICAL: Temperature extremely high (${temperature}°C) in ${fieldId}`);
  } else if (temperature >= ALERT_THRESHOLDS.temperature.high) {
    alerts.push(`⚠️ WARNING: Temperature high (${temperature}°C) in ${fieldId}`);
  }

  // Send alerts if any
  if (alerts.length > 0) {
    const alertMessage = `🌱 Smart Krushi Alert\n\n${alerts.join('\n')}\n\n📍 Location: ${location}\n📱 Device: ${deviceId}\n⏰ Time: ${new Date().toLocaleString('en-IN')}`;
    
    try {
      await Promise.all([
        sendSMSAlert(alertMessage),
        sendWhatsAppAlert(alertMessage)
      ]);
      logger.info('Alerts sent successfully');
      lastAlertTime[alertKey] = now;
    } catch (error) {
      logger.error('Failed to send alerts:', error);
    }
  }
}

exports.getLatestSensorData = async (req, res) => {
  try {
    const { fieldId } = req.query;
    
    // Validate field access
    const Field = require('../models/Field');
    const field = await Field.findOne({ fieldId });
    
    if (!field) {
      return res.status(404).json({
        error: 'Field not found',
        message: {
          english: 'Field not found',
          marathi: 'शेत सापडले नाही'
        }
      });
    }

    // Check if user has access to this field
    const canAccess = field.canUserAccess(req.user._id, req.user.role);
    if (!canAccess) {
      return res.status(403).json({
        error: 'Access denied',
        message: {
          english: 'You do not have permission to access this field',
          marathi: 'तुम्हाला या शेतावर प्रवेश करण्याची परवानगी नाही'
        }
      });
    }

    const latest = await SensorData.findOne({ fieldId }).sort({ timestamp: -1 });
    console.log(latest); 
    if (!latest) {
      return res.status(404).json({
        error: 'No data found',
        message: {
          english: 'No sensor data found for this field',
          marathi: 'या फील्डसाठी कोणताही सेन्सर डेटा सापडला नाही'
        }
      });
    }

    res.json(latest);
  } catch (err) {
    logger.error('Error fetching latest sensor data:', err);
    res.status(500).json({ 
      error: 'Failed to fetch latest sensor data',
      message: {
        english: 'Failed to fetch latest sensor data',
        marathi: 'नवीनतम सेन्सर डेटा मिळवण्यात अयशस्वी'
      }
    });
  }
};

exports.getSensorData24h = async (req, res) => {
  try {
    const { fieldId } = req.query;
    
    // Validate field access
    const Field = require('../models/Field');
    const field = await Field.findOne({ fieldId });
    
    if (!field) {
      return res.status(404).json({
        error: 'Field not found',
        message: {
          english: 'Field not found',
          marathi: 'शेत सापडले नाही'
        }
      });
    }

    // Check if user has access to this field
    const canAccess = field.canUserAccess(req.user._id, req.user.role);
    if (!canAccess) {
      return res.status(403).json({
        error: 'Access denied',
        message: {
          english: 'You do not have permission to access this field',
          marathi: 'तुम्हाला या शेतावर प्रवेश करण्याची परवानगी नाही'
        }
      });
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const data = await SensorData.find({ 
      fieldId, 
      timestamp: { $gte: since }
    }).sort({ timestamp: 1 });

    // Return 200 with empty array and message if no data
    return res.status(200).json({
      data,
      message: data.length === 0
        ? { english: 'No sensor data found for the last 24 hours', marathi: 'मागील २४ तासांसाठी कोणताही सेन्सर डेटा सापडला नाही' }
        : { english: 'Sensor data fetched successfully', marathi: 'सेन्सर डेटा यशस्वीरित्या मिळाला' }
    });
  } catch (err) {
    logger.error('Error fetching 24h sensor data:', err);
    res.status(500).json({ 
      error: 'Failed to fetch 24h sensor data',
      message: {
        english: 'Failed to fetch sensor data for last 24 hours',
        marathi: 'मागील २४ तासांचा सेन्सर डेटा मिळवण्यात अयशस्वी'
      }
    });
  }
};

exports.getDeviceStatus = async (req, res) => {
  try {
    const { deviceId } = req.query;
    const latest = await SensorData.findOne({ deviceId }).sort({ timestamp: -1 });
    
    if (!latest) {
      return res.status(404).json({
        error: 'Device not found',
        message: {
          english: 'No data found for this device',
          marathi: 'या डिव्हाइससाठी कोणताही डेटा सापडला नाही'
        }
      });
    }
    
    const timeSinceLastData = Date.now() - latest.timestamp.getTime();
    const isOnline = timeSinceLastData < (5 * 60 * 1000); // 5 minutes
    
    res.json({
      status: isOnline ? 'online' : 'offline',
      lastSeen: latest.timestamp,
      lastData: {
        moisture: latest.moisture,
        temperature: latest.temperature,
        fieldId: latest.fieldId,
        location: latest.location
      }
    });
  } catch (err) {
    logger.error('Error fetching device status:', err);
    res.status(500).json({ 
      error: 'Failed to get device status',
      message: {
        english: 'Failed to get device status',
        marathi: 'डिव्हाइस स्थिती मिळवण्यात अयशस्वी'
      }
    });
  }
}; 