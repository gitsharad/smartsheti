const mongoose = require('mongoose');
const { logger } = require('./logger');
//require('dotenv').config();

const uri = process.env.MONGODB_URI;

// Connection options
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4
};

// Create the MongoDB connection
mongoose.connect(uri, options)
  .then(() => {
    logger.info('MongoDB connected successfully');
  })
  .catch((err) => {
    logger.error('MongoDB connection error:', err);
  });

// Handle connection events
mongoose.connection.on('error', err => {
  logger.error('MongoDB error:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected. Attempting to reconnect...');
});

// Schema definition with optimized indexes
const sensorDataSchema = new mongoose.Schema({
  fieldId: { 
    type: String, 
    required: true,
    index: true // Index for faster lookups
  },
  moisture: { 
    type: Number, 
    required: true,
    min: 0,
    max: 100
  },
  temperature: { 
    type: Number, 
    required: true,
    min: -10,
    max: 60
  },
  timestamp: { 
    type: Date, 
    required: true,
    index: true // Index for time-based queries
  },
  deviceId: { 
    type: String, 
    default: 'unknown',
    index: true // Index for device status queries
  },
  location: { 
    type: String, 
    default: 'unknown'
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
  // Create a compound index for common queries
  indexes: [
    // Index for getting sensor data by field and time range
    { fieldId: 1, timestamp: -1 },
    // Index for device status queries
    { deviceId: 1, timestamp: -1 }
  ]
});

// Add TTL index for data cleanup (keep 3 months of data)
sensorDataSchema.index({ timestamp: 1 }, { 
  expireAfterSeconds: 90 * 24 * 60 * 60 // 90 days
});

// Add schema methods for data aggregation
sensorDataSchema.statics.getHourlyAverages = async function(fieldId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        fieldId,
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: "$timestamp" },
          month: { $month: "$timestamp" },
          day: { $dayOfMonth: "$timestamp" },
          hour: { $hour: "$timestamp" }
        },
        avgMoisture: { $avg: "$moisture" },
        avgTemperature: { $avg: "$temperature" },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.hour": 1 }
    }
  ]);
};

// Add schema methods for data cleanup
sensorDataSchema.statics.cleanupOldData = async function(daysToKeep = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  try {
    const result = await this.deleteMany({
      timestamp: { $lt: cutoffDate }
    });
    logger.info(`Cleaned up ${result.deletedCount} old sensor records`);
    return result;
  } catch (error) {
    logger.error('Error cleaning up old data:', error);
    throw error;
  }
};

const SensorData = mongoose.model('SensorData', sensorDataSchema, 'sensorData');

// Export the mongoose connection and models
module.exports = { 
  mongoose, 
  SensorData,
  connection: mongoose.connection
}; 