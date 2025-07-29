const IoTSensor = require('../models/IoTSensor');
const RealTimeSensorData = require('../models/RealTimeSensorData');
const { logger } = require('../utils/logger');

// Get all IoT sensors for a user
const getUserSensors = async (req, res) => {
  try {
    const userId = req.user._id;
    const { fieldId, type, status } = req.query;

    const query = { userId };
    if (fieldId) query.fieldId = fieldId;
    if (type) query.type = type;
    if (status) query.status = status;

    const sensors = await IoTSensor.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      sensors,
      count: sensors.length
    });
  } catch (error) {
    logger.error('Error getting user sensors:', error);
    res.status(500).json({
      error: 'Failed to get sensors',
      message: {
        english: 'Unable to load sensors',
        marathi: 'सेन्सर्स लोड करण्यात अयशस्वी'
      }
    });
  }
};

// Create new IoT sensor
const createSensor = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      sensorId,
      fieldId,
      name,
      type,
      manufacturer,
      model,
      location,
      specifications,
      configuration
    } = req.body;

    // Validate required fields
    if (!sensorId || !fieldId || !name || !type || !location) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: {
          english: 'Sensor ID, field ID, name, type, and location are required',
          marathi: 'सेन्सर ID, फील्ड ID, नाव, प्रकार आणि स्थान आवश्यक आहेत'
        }
      });
    }

    // Check if sensor already exists
    const existingSensor = await IoTSensor.findOne({ sensorId });
    if (existingSensor) {
      return res.status(400).json({
        error: 'Sensor already exists',
        message: {
          english: 'A sensor with this ID already exists',
          marathi: 'या ID सह सेन्सर आधीपासून अस्तित्वात आहे'
        }
      });
    }

    // Create sensor
    const sensor = new IoTSensor({
      sensorId,
      fieldId,
      userId,
      name,
      type,
      manufacturer,
      model,
      location: {
        type: 'Point',
        coordinates: location.coordinates,
        elevation: location.elevation,
        depth: location.depth
      },
      specifications,
      configuration,
      installation: {
        date: new Date(),
        technician: req.user.name,
        notes: 'Initial installation'
      }
    });

    await sensor.save();

    res.status(201).json({
      success: true,
      message: {
        english: 'Sensor created successfully',
        marathi: 'सेन्सर यशस्वीरित्या तयार केले'
      },
      sensor
    });
  } catch (error) {
    logger.error('Error creating sensor:', error);
    res.status(500).json({
      error: 'Failed to create sensor',
      message: {
        english: 'Unable to create sensor',
        marathi: 'सेन्सर तयार करण्यात अयशस्वी'
      }
    });
  }
};

// Update sensor
const updateSensor = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const updateData = req.body;

    const sensor = await IoTSensor.findOne({ _id: id, userId });
    if (!sensor) {
      return res.status(404).json({
        error: 'Sensor not found',
        message: {
          english: 'Sensor not found',
          marathi: 'सेन्सर सापडले नाही'
        }
      });
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (key !== 'sensorId' && key !== 'userId') {
        sensor[key] = updateData[key];
      }
    });

    await sensor.save();

    res.json({
      success: true,
      message: {
        english: 'Sensor updated successfully',
        marathi: 'सेन्सर यशस्वीरित्या अद्ययावत केले'
      },
      sensor
    });
  } catch (error) {
    logger.error('Error updating sensor:', error);
    res.status(500).json({
      error: 'Failed to update sensor',
      message: {
        english: 'Unable to update sensor',
        marathi: 'सेन्सर अद्ययावत करण्यात अयशस्वी'
      }
    });
  }
};

// Get sensor by ID
const getSensorById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const sensor = await IoTSensor.findOne({ _id: id, userId })
      .populate('userId', 'name email');

    if (!sensor) {
      return res.status(404).json({
        error: 'Sensor not found',
        message: {
          english: 'Sensor not found',
          marathi: 'सेन्सर सापडले नाही'
        }
      });
    }

    res.json({
      success: true,
      sensor
    });
  } catch (error) {
    logger.error('Error getting sensor by ID:', error);
    res.status(500).json({
      error: 'Failed to get sensor',
      message: {
        english: 'Unable to load sensor',
        marathi: 'सेन्सर लोड करण्यात अयशस्वी'
      }
    });
  }
};

// Get sensor statistics
const getSensorStatistics = async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await IoTSensor.getSensorStats(userId);
    const healthStats = await RealTimeSensorData.getSensorHealthStats(userId);

    res.json({
      success: true,
      stats: {
        overview: stats[0] || {
          totalSensors: 0,
          activeSensors: 0,
          offlineSensors: 0,
          avgBatteryLevel: 0,
          avgSignalStrength: 0
        },
        health: healthStats
      }
    });
  } catch (error) {
    logger.error('Error getting sensor statistics:', error);
    res.status(500).json({
      error: 'Failed to get sensor statistics',
      message: {
        english: 'Unable to load sensor statistics',
        marathi: 'सेन्सर आकडेवारी लोड करण्यात अयशस्वी'
      }
    });
  }
};

// Get offline sensors
const getOfflineSensors = async (req, res) => {
  try {
    const { hours = 24 } = req.query;
    const userId = req.user._id;

    const offlineSensors = await IoTSensor.findOfflineSensors(parseInt(hours));
    const userOfflineSensors = offlineSensors.filter(sensor => 
      sensor.userId.toString() === userId.toString()
    );

    res.json({
      success: true,
      sensors: userOfflineSensors,
      count: userOfflineSensors.length
    });
  } catch (error) {
    logger.error('Error getting offline sensors:', error);
    res.status(500).json({
      error: 'Failed to get offline sensors',
      message: {
        english: 'Unable to get offline sensors',
        marathi: 'ऑफलाइन सेन्सर्स मिळवण्यात अयशस्वी'
      }
    });
  }
};

// Update sensor heartbeat (for real IoT devices)
const updateSensorHeartbeat = async (req, res) => {
  try {
    const { sensorId } = req.params;
    const { batteryLevel, signalStrength, status } = req.body;

    const sensor = await IoTSensor.findOne({ sensorId });
    if (!sensor) {
      return res.status(404).json({
        error: 'Sensor not found',
        message: {
          english: 'Sensor not found',
          marathi: 'सेन्सर सापडले नाही'
        }
      });
    }

    // Update heartbeat
    await sensor.updateHeartbeat();

    // Update other health metrics
    if (batteryLevel !== undefined) {
      await sensor.updateBatteryLevel(batteryLevel);
    }

    if (signalStrength !== undefined) {
      await sensor.updateSignalStrength(signalStrength);
    }

    if (status) {
      sensor.status = status;
      await sensor.save();
    }

    res.json({
      success: true,
      message: {
        english: 'Sensor heartbeat updated',
        marathi: 'सेन्सर हार्टबीट अद्ययावत केले'
      },
      sensor: {
        sensorId: sensor.sensorId,
        status: sensor.status,
        lastHeartbeat: sensor.health.lastHeartbeat,
        batteryLevel: sensor.health.batteryLevel,
        signalStrength: sensor.health.signalStrength
      }
    });
  } catch (error) {
    logger.error('Error updating sensor heartbeat:', error);
    res.status(500).json({
      error: 'Failed to update sensor heartbeat',
      message: {
        english: 'Unable to update sensor heartbeat',
        marathi: 'सेन्सर हार्टबीट अद्ययावत करण्यात अयशस्वी'
      }
    });
  }
};

// Record sensor error
const recordSensorError = async (req, res) => {
  try {
    const { sensorId } = req.params;
    const { errorCode, errorMessage } = req.body;

    const sensor = await IoTSensor.findOne({ sensorId });
    if (!sensor) {
      return res.status(404).json({
        error: 'Sensor not found',
        message: {
          english: 'Sensor not found',
          marathi: 'सेन्सर सापडले नाही'
        }
      });
    }

    await sensor.recordError(errorCode, errorMessage);

    res.json({
      success: true,
      message: {
        english: 'Sensor error recorded',
        marathi: 'सेन्सर त्रुटी नोंदवली'
      },
      sensor: {
        sensorId: sensor.sensorId,
        errorCount: sensor.health.errorCount,
        lastError: sensor.health.lastError
      }
    });
  } catch (error) {
    logger.error('Error recording sensor error:', error);
    res.status(500).json({
      error: 'Failed to record sensor error',
      message: {
        english: 'Unable to record sensor error',
        marathi: 'सेन्सर त्रुटी नोंदवण्यात अयशस्वी'
      }
    });
  }
};

// Get sensor maintenance schedule
const getMaintenanceSchedule = async (req, res) => {
  try {
    const userId = req.user._id;
    const { days = 30 } = req.query;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + parseInt(days));

    const sensors = await IoTSensor.find({
      userId,
      $or: [
        { 'calibration.nextCalibration': { $lte: cutoffDate } },
        { 'maintenance.nextMaintenance': { $lte: cutoffDate } }
      ]
    }).populate('userId', 'name email');

    const maintenanceSchedule = sensors.map(sensor => ({
      sensorId: sensor.sensorId,
      name: sensor.name,
      fieldId: sensor.fieldId,
      nextCalibration: sensor.calibration.nextCalibration,
      nextMaintenance: sensor.maintenance.length > 0 ? 
        sensor.maintenance[sensor.maintenance.length - 1].nextMaintenance : null,
      daysUntilCalibration: sensor.calibration.nextCalibration ? 
        Math.ceil((sensor.calibration.nextCalibration - new Date()) / (1000 * 60 * 60 * 24)) : null,
      daysUntilMaintenance: sensor.maintenance.length > 0 ? 
        Math.ceil((sensor.maintenance[sensor.maintenance.length - 1].nextMaintenance - new Date()) / (1000 * 60 * 60 * 24)) : null
    }));

    res.json({
      success: true,
      maintenanceSchedule,
      count: maintenanceSchedule.length
    });
  } catch (error) {
    logger.error('Error getting maintenance schedule:', error);
    res.status(500).json({
      error: 'Failed to get maintenance schedule',
      message: {
        english: 'Unable to get maintenance schedule',
        marathi: 'देखभाल वेळापत्रक मिळवण्यात अयशस्वी'
      }
    });
  }
};

// Add maintenance record
const addMaintenanceRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const {
      type,
      description,
      technician,
      cost,
      nextMaintenance
    } = req.body;

    const sensor = await IoTSensor.findOne({ _id: id, userId });
    if (!sensor) {
      return res.status(404).json({
        error: 'Sensor not found',
        message: {
          english: 'Sensor not found',
          marathi: 'सेन्सर सापडले नाही'
        }
      });
    }

    sensor.maintenance.push({
      date: new Date(),
      type,
      description,
      technician,
      cost,
      nextMaintenance: nextMaintenance ? new Date(nextMaintenance) : null
    });

    // Update calibration if it's a calibration maintenance
    if (type === 'calibration') {
      sensor.calibration.lastCalibrated = new Date();
      if (nextMaintenance) {
        sensor.calibration.nextCalibration = new Date(nextMaintenance);
      }
    }

    await sensor.save();

    res.json({
      success: true,
      message: {
        english: 'Maintenance record added successfully',
        marathi: 'देखभाल नोंद यशस्वीरित्या जोडली'
      },
      sensor
    });
  } catch (error) {
    logger.error('Error adding maintenance record:', error);
    res.status(500).json({
      error: 'Failed to add maintenance record',
      message: {
        english: 'Unable to add maintenance record',
        marathi: 'देखभाल नोंद जोडण्यात अयशस्वी'
      }
    });
  }
};

// Get sensor data quality report
const getDataQualityReport = async (req, res) => {
  try {
    const userId = req.user._id;
    const { fieldId, sensorType, days = 7 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const query = { userId, timestamp: { $gte: startDate } };
    if (fieldId) query.fieldId = fieldId;
    if (sensorType) query.sensorType = sensorType;

    const qualityStats = await RealTimeSensorData.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$sensorId',
          totalReadings: { $sum: 1 },
          validReadings: {
            $sum: { $cond: [{ $eq: ['$dataQuality.validationStatus', 'valid'] }, 1, 0] }
          },
          suspiciousReadings: {
            $sum: { $cond: [{ $eq: ['$dataQuality.validationStatus', 'suspicious'] }, 1, 0] }
          },
          invalidReadings: {
            $sum: { $cond: [{ $eq: ['$dataQuality.validationStatus', 'invalid'] }, 1, 0] }
          },
          avgConfidence: { $avg: '$dataQuality.confidence' },
          avgSignalStrength: { $avg: '$dataQuality.signalStrength' },
          avgBatteryLevel: { $avg: '$dataQuality.batteryLevel' }
        }
      }
    ]);

    res.json({
      success: true,
      qualityReport: {
        period: `${days} days`,
        fieldId: fieldId || 'all',
        sensorType: sensorType || 'all',
        stats: qualityStats
      }
    });
  } catch (error) {
    logger.error('Error getting data quality report:', error);
    res.status(500).json({
      error: 'Failed to get data quality report',
      message: {
        english: 'Unable to get data quality report',
        marathi: 'डेटा गुणवत्ता अहवाल मिळवण्यात अयशस्वी'
      }
    });
  }
};

module.exports = {
  getUserSensors,
  createSensor,
  updateSensor,
  getSensorById,
  getSensorStatistics,
  getOfflineSensors,
  updateSensorHeartbeat,
  recordSensorError,
  getMaintenanceSchedule,
  addMaintenanceRecord,
  getDataQualityReport
}; 