const mongoose = require('mongoose');

const iotSensorSchema = new mongoose.Schema({
  sensorId: {
    type: String,
    required: true,
    unique: true,
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
  name: {
    type: String,
    required: true
  },
  type: {
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
  manufacturer: {
    type: String,
    default: 'unknown'
  },
  model: {
    type: String,
    default: 'unknown'
  },
  firmware: {
    version: String,
    lastUpdated: Date
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
    depth: Number // for soil sensors (cm below surface)
  },
  specifications: {
    measurementRange: {
      min: Number,
      max: Number,
      unit: String
    },
    accuracy: Number, // percentage
    resolution: Number,
    samplingRate: Number, // readings per hour
    batteryLife: Number, // hours
    powerSource: {
      type: String,
      enum: ['battery', 'solar', 'wired', 'hybrid'],
      default: 'battery'
    }
  },
  calibration: {
    lastCalibrated: Date,
    nextCalibration: Date,
    calibrationData: [{
      date: Date,
      referenceValue: Number,
      measuredValue: Number,
      offset: Number,
      technician: String
    }]
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'error', 'offline'],
    default: 'active'
  },
  health: {
    batteryLevel: {
      type: Number,
      min: 0,
      max: 100,
      default: 100
    },
    signalStrength: {
      type: Number,
      min: 0,
      max: 100,
      default: 100
    },
    lastHeartbeat: Date,
    uptime: Number, // hours
    errorCount: {
      type: Number,
      default: 0
    },
    lastError: {
      code: String,
      message: String,
      timestamp: Date
    }
  },
  configuration: {
    samplingInterval: {
      type: Number,
      default: 3600 // seconds
    },
    transmissionInterval: {
      type: Number,
      default: 3600 // seconds
    },
    alertThresholds: {
      low: Number,
      high: Number,
      critical: Number
    },
    dataRetention: {
      type: Number,
      default: 90 // days
    }
  },
  connectivity: {
    type: {
      type: String,
      enum: ['wifi', 'cellular', 'lora', 'bluetooth', 'ethernet'],
      default: 'cellular'
    },
    networkId: String,
    simCard: {
      iccid: String,
      phoneNumber: String,
      dataPlan: String
    },
    wifi: {
      ssid: String,
      strength: Number
    }
  },
  installation: {
    date: Date,
    technician: String,
    notes: String,
    warrantyExpiry: Date
  },
  maintenance: [{
    date: Date,
    type: {
      type: String,
      enum: ['cleaning', 'calibration', 'repair', 'replacement', 'inspection']
    },
    description: String,
    technician: String,
    cost: Number,
    nextMaintenance: Date
  }],
  dataQuality: {
    totalReadings: {
      type: Number,
      default: 0
    },
    validReadings: {
      type: Number,
      default: 0
    },
    accuracy: {
      type: Number,
      default: 100
    },
    lastValidation: Date
  }
}, {
  timestamps: true
});

// Geospatial index for location queries
iotSensorSchema.index({ location: '2dsphere' });
iotSensorSchema.index({ fieldId: 1, type: 1 });
iotSensorSchema.index({ userId: 1, status: 1 });
iotSensorSchema.index({ 'health.lastHeartbeat': -1 });

// Virtual for data quality percentage
iotSensorSchema.virtual('dataQualityPercentage').get(function() {
  if (this.dataQuality.totalReadings === 0) return 100;
  return (this.dataQuality.validReadings / this.dataQuality.totalReadings) * 100;
});

// Virtual for uptime in days
iotSensorSchema.virtual('uptimeDays').get(function() {
  return this.health.uptime ? Math.floor(this.health.uptime / 24) : 0;
});

// Static method to find sensors by field
iotSensorSchema.statics.findByField = async function(fieldId) {
  return this.find({ fieldId }).populate('userId', 'name email');
};

// Static method to find sensors by type
iotSensorSchema.statics.findByType = async function(type) {
  return this.find({ type }).populate('userId', 'name email');
};

// Static method to find offline sensors
iotSensorSchema.statics.findOfflineSensors = async function(hours = 24) {
  const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
  return this.find({
    $or: [
      { 'health.lastHeartbeat': { $lt: cutoffTime } },
      { status: 'offline' }
    ]
  }).populate('userId', 'name email');
};

// Static method to get sensor statistics
iotSensorSchema.statics.getSensorStats = async function(userId) {
  return this.aggregate([
    { $match: { userId: userId } },
    {
      $group: {
        _id: null,
        totalSensors: { $sum: 1 },
        activeSensors: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        offlineSensors: {
          $sum: { $cond: [{ $eq: ['$status', 'offline'] }, 1, 0] }
        },
        avgBatteryLevel: { $avg: '$health.batteryLevel' },
        avgSignalStrength: { $avg: '$health.signalStrength' }
      }
    }
  ]);
};

// Instance method to update heartbeat
iotSensorSchema.methods.updateHeartbeat = function() {
  this.health.lastHeartbeat = new Date();
  this.health.uptime = this.health.uptime ? this.health.uptime + 1 : 1;
  return this.save();
};

// Instance method to record error
iotSensorSchema.methods.recordError = function(errorCode, errorMessage) {
  this.health.errorCount += 1;
  this.health.lastError = {
    code: errorCode,
    message: errorMessage,
    timestamp: new Date()
  };
  return this.save();
};

// Instance method to update battery level
iotSensorSchema.methods.updateBatteryLevel = function(level) {
  this.health.batteryLevel = Math.max(0, Math.min(100, level));
  return this.save();
};

// Instance method to update signal strength
iotSensorSchema.methods.updateSignalStrength = function(strength) {
  this.health.signalStrength = Math.max(0, Math.min(100, strength));
  return this.save();
};

// Pre-save middleware to validate coordinates
iotSensorSchema.pre('save', function(next) {
  if (this.location && this.location.coordinates) {
    const [lon, lat] = this.location.coordinates;
    if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
      return next(new Error('Invalid coordinates'));
    }
  }
  next();
});

module.exports = mongoose.model('IoTSensor', iotSensorSchema); 