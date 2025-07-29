const mongoose = require('mongoose');

const realTimeSensorDataSchema = new mongoose.Schema({
  sensorId: {
    type: String,
    required: true,
    index: true
  },
  fieldId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  sensorType: {
    type: String,
    enum: [
      'soil_moisture',
      'temperature',
      'humidity',
      'ph_sensor',
      'nitrogen_sensor',
      'phosphorus_sensor',
      'potassium_sensor',
      'light_intensity',
      'wind_speed',
      'rainfall',
      'pressure',
      'co2_sensor',
      'multi_sensor'
    ],
    required: true
  },
  readings: {
    // Soil moisture sensor readings
    soilMoisture: {
      value: { type: Number, min: 0, max: 100 },
      unit: { type: String, default: '%' },
      depth: { type: Number, default: 10 }, // cm below surface
      quality: { type: String, enum: ['excellent', 'good', 'fair', 'poor'], default: 'good' }
    },
    // Temperature readings
    temperature: {
      value: { type: Number, min: -50, max: 100 },
      unit: { type: String, default: '°C' },
      humidity: { type: Number, min: 0, max: 100 },
      heatIndex: { type: Number },
      quality: { type: String, enum: ['excellent', 'good', 'fair', 'poor'], default: 'good' }
    },
    // pH sensor readings
    ph: {
      value: { type: Number, min: 0, max: 14 },
      unit: { type: String, default: 'pH' },
      quality: { type: String, enum: ['excellent', 'good', 'fair', 'poor'], default: 'good' }
    },
    // NPK sensor readings
    npk: {
      nitrogen: { type: Number, min: 0, max: 1000 },
      phosphorus: { type: Number, min: 0, max: 1000 },
      potassium: { type: Number, min: 0, max: 1000 },
      unit: { type: String, default: 'mg/kg' },
      quality: { type: String, enum: ['excellent', 'good', 'fair', 'poor'], default: 'good' }
    },
    // Environmental readings
    environmental: {
      lightIntensity: { type: Number, min: 0 },
      windSpeed: { type: Number, min: 0 },
      rainfall: { type: Number, min: 0 },
      pressure: { type: Number, min: 0 },
      co2: { type: Number, min: 0 },
      quality: { type: String, enum: ['excellent', 'good', 'fair', 'poor'], default: 'good' }
    }
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    elevation: Number,
    accuracy: Number // GPS accuracy in meters
  },
  dataQuality: {
    signalStrength: { type: Number, min: 0, max: 100 },
    batteryLevel: { type: Number, min: 0, max: 100 },
    transmissionQuality: { type: String, enum: ['excellent', 'good', 'fair', 'poor'] },
    validationStatus: { type: String, enum: ['valid', 'suspicious', 'invalid'], default: 'valid' },
    confidence: { type: Number, min: 0, max: 100, default: 95 }
  },
  processing: {
    rawValue: Number, // Original sensor reading
    calibratedValue: Number, // After calibration
    filteredValue: Number, // After noise filtering
    finalValue: Number, // Final processed value
    calibrationOffset: Number,
    noiseLevel: Number,
    processingTime: Number // milliseconds
  },
  alerts: [{
    type: { type: String, enum: ['threshold', 'anomaly', 'sensor_fault', 'calibration_needed'] },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
    message: String,
    threshold: Number,
    actualValue: Number,
    timestamp: { type: Date, default: Date.now }
  }],
  metadata: {
    deviceId: String,
    firmwareVersion: String,
    transmissionProtocol: String,
    dataFormat: String,
    compression: Boolean,
    encryption: Boolean
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
realTimeSensorDataSchema.index({ sensorId: 1, timestamp: -1 });
realTimeSensorDataSchema.index({ fieldId: 1, timestamp: -1 });
realTimeSensorDataSchema.index({ userId: 1, timestamp: -1 });
realTimeSensorDataSchema.index({ location: '2dsphere' });
realTimeSensorDataSchema.index({ 'dataQuality.validationStatus': 1 });
realTimeSensorDataSchema.index({ 'alerts.severity': 1, timestamp: -1 });

// TTL index for automatic data cleanup (keep 2 years)
realTimeSensorDataSchema.index({ timestamp: 1 }, { 
  expireAfterSeconds: 2 * 365 * 24 * 60 * 60 
});

// Virtual for formatted timestamp
realTimeSensorDataSchema.virtual('formattedTimestamp').get(function() {
  return this.timestamp.toISOString();
});

// Virtual for primary reading value
realTimeSensorDataSchema.virtual('primaryValue').get(function() {
  switch (this.sensorType) {
    case 'soil_moisture':
      return this.readings.soilMoisture?.value;
    case 'temperature':
      return this.readings.temperature?.value;
    case 'ph_sensor':
      return this.readings.ph?.value;
    case 'nitrogen_sensor':
      return this.readings.npk?.nitrogen;
    case 'phosphorus_sensor':
      return this.readings.npk?.phosphorus;
    case 'potassium_sensor':
      return this.readings.npk?.potassium;
    case 'light_intensity':
      return this.readings.environmental?.lightIntensity;
    case 'wind_speed':
      return this.readings.environmental?.windSpeed;
    case 'rainfall':
      return this.readings.environmental?.rainfall;
    case 'pressure':
      return this.readings.environmental?.pressure;
    case 'co2_sensor':
      return this.readings.environmental?.co2;
    default:
      return null;
  }
});

// Virtual for primary unit
realTimeSensorDataSchema.virtual('primaryUnit').get(function() {
  switch (this.sensorType) {
    case 'soil_moisture':
      return this.readings.soilMoisture?.unit;
    case 'temperature':
      return this.readings.temperature?.unit;
    case 'ph_sensor':
      return this.readings.ph?.unit;
    case 'nitrogen_sensor':
    case 'phosphorus_sensor':
    case 'potassium_sensor':
      return this.readings.npk?.unit;
    case 'light_intensity':
      return 'lux';
    case 'wind_speed':
      return 'm/s';
    case 'rainfall':
      return 'mm';
    case 'pressure':
      return 'hPa';
    case 'co2_sensor':
      return 'ppm';
    default:
      return '';
  }
});

// Static method to get latest readings by sensor
realTimeSensorDataSchema.statics.getLatestReadings = async function(sensorId) {
  return this.findOne({ sensorId }).sort({ timestamp: -1 });
};

// Static method to get readings by field and time range
realTimeSensorDataSchema.statics.getFieldReadings = async function(fieldId, startDate, endDate, sensorType = null) {
  const query = { fieldId, timestamp: { $gte: startDate, $lte: endDate } };
  if (sensorType) query.sensorType = sensorType;
  
  return this.find(query).sort({ timestamp: 1 });
};

// Static method to get aggregated data
realTimeSensorDataSchema.statics.getAggregatedData = async function(fieldId, sensorType, aggregation, timeRange) {
  const matchStage = { fieldId, sensorType };
  
  if (timeRange) {
    matchStage.timestamp = { $gte: timeRange.start, $lte: timeRange.end };
  }

  const groupStage = {
    _id: {
      $dateToString: {
        format: aggregation === 'hourly' ? '%Y-%m-%d %H:00:00' : '%Y-%m-%d',
        date: '$timestamp'
      }
    },
    avgValue: { $avg: '$processing.finalValue' },
    minValue: { $min: '$processing.finalValue' },
    maxValue: { $max: '$processing.finalValue' },
    count: { $sum: 1 },
    avgQuality: { $avg: '$dataQuality.confidence' }
  };

  return this.aggregate([
    { $match: matchStage },
    { $group: groupStage },
    { $sort: { _id: 1 } }
  ]);
};

// Static method to find anomalies
realTimeSensorDataSchema.statics.findAnomalies = async function(fieldId, sensorType, threshold = 2) {
  const pipeline = [
    { $match: { fieldId, sensorType } },
    { $sort: { timestamp: -1 } },
    { $limit: 100 },
    {
      $group: {
        _id: null,
        avgValue: { $avg: '$processing.finalValue' },
        stdDev: { $stdDevPop: '$processing.finalValue' }
      }
    },
    {
      $lookup: {
        from: 'realtimesensordata',
        pipeline: [
          { $match: { fieldId, sensorType } },
          { $sort: { timestamp: -1 } },
          { $limit: 100 }
        ],
        as: 'recentData'
      }
    },
    {
      $project: {
        anomalies: {
          $filter: {
            input: '$recentData',
            as: 'data',
            cond: {
              $or: [
                { $gt: ['$$data.processing.finalValue', { $add: ['$avgValue', { $multiply: ['$stdDev', threshold] }] }] },
                { $lt: ['$$data.processing.finalValue', { $subtract: ['$avgValue', { $multiply: ['$stdDev', threshold] }] }] }
              ]
            }
          }
        }
      }
    }
  ];

  return this.aggregate(pipeline);
};

// Static method to get sensor health statistics
realTimeSensorDataSchema.statics.getSensorHealthStats = async function(userId, timeRange = 24) {
  const cutoffTime = new Date(Date.now() - timeRange * 60 * 60 * 1000);
  
  return this.aggregate([
    { $match: { userId, timestamp: { $gte: cutoffTime } } },
    {
      $group: {
        _id: '$sensorId',
        avgSignalStrength: { $avg: '$dataQuality.signalStrength' },
        avgBatteryLevel: { $avg: '$dataQuality.batteryLevel' },
        avgConfidence: { $avg: '$dataQuality.confidence' },
        totalReadings: { $sum: 1 },
        validReadings: {
          $sum: { $cond: [{ $eq: ['$dataQuality.validationStatus', 'valid'] }, 1, 0] }
        },
        lastReading: { $max: '$timestamp' }
      }
    }
  ]);
};

// Instance method to validate reading
realTimeSensorDataSchema.methods.validateReading = function() {
  const value = this.primaryValue;
  if (value === null || value === undefined) {
    this.dataQuality.validationStatus = 'invalid';
    this.dataQuality.confidence = 0;
    return false;
  }

  // Basic range validation based on sensor type
  let isValid = true;
  switch (this.sensorType) {
    case 'soil_moisture':
      isValid = value >= 0 && value <= 100;
      break;
    case 'temperature':
      isValid = value >= -50 && value <= 100;
      break;
    case 'ph_sensor':
      isValid = value >= 0 && value <= 14;
      break;
    case 'nitrogen_sensor':
    case 'phosphorus_sensor':
    case 'potassium_sensor':
      isValid = value >= 0 && value <= 1000;
      break;
  }

  if (!isValid) {
    this.dataQuality.validationStatus = 'invalid';
    this.dataQuality.confidence = 0;
  } else if (this.dataQuality.signalStrength < 50 || this.dataQuality.batteryLevel < 20) {
    this.dataQuality.validationStatus = 'suspicious';
    this.dataQuality.confidence = Math.min(70, this.dataQuality.confidence);
  } else {
    this.dataQuality.validationStatus = 'valid';
    this.dataQuality.confidence = Math.max(90, this.dataQuality.confidence);
  }

  return this.dataQuality.validationStatus === 'valid';
};

// Instance method to check for alerts
realTimeSensorDataSchema.methods.checkAlerts = function() {
  const value = this.primaryValue;
  if (!value) return [];

  const alerts = [];
  
  // Threshold alerts (example thresholds)
  const thresholds = {
    soil_moisture: { low: 20, high: 80, critical: 10 },
    temperature: { low: 5, high: 35, critical: 40 },
    ph_sensor: { low: 5.5, high: 8.5, critical: 4.5 }
  };

  const sensorThresholds = thresholds[this.sensorType];
  if (sensorThresholds) {
    if (value <= sensorThresholds.critical) {
      alerts.push({
        type: 'threshold',
        severity: 'critical',
        message: `${this.sensorType} reading is critically low: ${value}`,
        threshold: sensorThresholds.critical,
        actualValue: value
      });
    } else if (value <= sensorThresholds.low) {
      alerts.push({
        type: 'threshold',
        severity: 'high',
        message: `${this.sensorType} reading is low: ${value}`,
        threshold: sensorThresholds.low,
        actualValue: value
      });
    } else if (value >= sensorThresholds.high) {
      alerts.push({
        type: 'threshold',
        severity: 'medium',
        message: `${this.sensorType} reading is high: ${value}`,
        threshold: sensorThresholds.high,
        actualValue: value
      });
    }
  }

  // Quality alerts
  if (this.dataQuality.signalStrength < 30) {
    alerts.push({
      type: 'sensor_fault',
      severity: 'high',
      message: 'Low signal strength detected',
      threshold: 30,
      actualValue: this.dataQuality.signalStrength
    });
  }

  if (this.dataQuality.batteryLevel < 15) {
    alerts.push({
      type: 'sensor_fault',
      severity: 'medium',
      message: 'Low battery level detected',
      threshold: 15,
      actualValue: this.dataQuality.batteryLevel
    });
  }

  this.alerts = alerts;
  return alerts;
};

// Pre-save middleware
realTimeSensorDataSchema.pre('save', function(next) {
  // Validate reading
  this.validateReading();
  
  // Check for alerts
  this.checkAlerts();
  
  // Set processing values if not set
  if (!this.processing.finalValue) {
    this.processing.finalValue = this.primaryValue;
  }
  
  next();
});

module.exports = mongoose.model('RealTimeSensorData', realTimeSensorDataSchema); 