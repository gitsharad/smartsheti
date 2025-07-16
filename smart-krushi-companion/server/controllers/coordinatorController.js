const User = require('../models/User');
const Field = require('../models/Field');
const { logger } = require('../utils/logger');

// Get coordinator dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const coordinatorId = req.user._id;
    
    // Get managed farmers count
    const managedFarmers = await User.find({ 
      managedBy: coordinatorId,
      role: 'farmer',
      isActive: true 
    });
    
    // Get total fields from managed farmers
    const farmerIds = managedFarmers.map(farmer => farmer._id);
    const totalFields = await Field.countDocuments({ 
      owner: { $in: farmerIds } 
    });
    
    // Get active fields (fields with recent sensor data)
    const activeFields = await Field.countDocuments({ 
      owner: { $in: farmerIds },
      'lastSensorData': { $exists: true, $ne: null }
    });
    
    // Get alerts count (this week)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    // TODO: Implement actual alerts system
    const alertsThisWeek = 8; // Mock data for now
    
    // Calculate average yield (mock data for now)
    const averageYield = 85; // Mock data for now
    
    const stats = {
      totalFarmers: managedFarmers.length,
      activeFields,
      totalFields,
      alertsThisWeek,
      averageYield
    };
    
    res.json({ success: true, stats });
  } catch (error) {
    logger.error('Error getting coordinator dashboard stats:', error);
    res.status(500).json({ 
      error: 'Failed to get dashboard stats',
      message: {
        english: 'Unable to load dashboard statistics',
        marathi: 'डॅशबोर्ड आकडेवारी लोड करण्यात अयशस्वी'
      }
    });
  }
};

// Get managed farmers list
const getManagedFarmers = async (req, res) => {
  try {
    const coordinatorId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Get managed farmers with pagination
    const managedFarmers = await User.find({ 
      managedBy: coordinatorId,
      role: 'farmer',
      isActive: true 
    })
    .select('name email phoneNumber preferredLanguage lastActive isActive')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });
    
    // Get total count for pagination
    const totalFarmers = await User.countDocuments({ 
      managedBy: coordinatorId,
      role: 'farmer',
      isActive: true 
    });
    
    // Get field count for each farmer
    const farmersWithFieldCount = await Promise.all(
      managedFarmers.map(async (farmer) => {
        const fieldCount = await Field.countDocuments({ owner: farmer._id });
        return {
          ...farmer.toObject(),
          fieldCount,
          status: farmer.isActive ? 'Active' : 'Inactive'
        };
      })
    );
    
    res.json({
      success: true,
      farmers: farmersWithFieldCount,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalFarmers / limit),
        totalFarmers,
        hasNextPage: page * limit < totalFarmers,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    logger.error('Error getting managed farmers:', error);
    res.status(500).json({ 
      error: 'Failed to get managed farmers',
      message: {
        english: 'Unable to load farmer list',
        marathi: 'शेतकरी यादी लोड करण्यात अयशस्वी'
      }
    });
  }
};

// Get field overview for managed farmers
const getFieldOverview = async (req, res) => {
  try {
    const coordinatorId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Get managed farmers
    const managedFarmers = await User.find({ 
      managedBy: coordinatorId,
      role: 'farmer',
      isActive: true 
    });
    
    const farmerIds = managedFarmers.map(farmer => farmer._id);
    
    // Get fields with pagination
    const fields = await Field.find({ 
      owner: { $in: farmerIds } 
    })
    .populate('owner', 'name email')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });
    
    // Get total count for pagination
    const totalFields = await Field.countDocuments({ 
      owner: { $in: farmerIds } 
    });
    
    // Process field data
    const fieldsWithStatus = fields.map(field => {
      let status = 'Good';
      let moistureStatus = 'Normal';
      let temperatureStatus = 'Normal';
      
      // Check sensor data for status
      if (field.lastSensorData) {
        const { moisture, temperature } = field.lastSensorData;
        
        if (moisture < 30) {
          moistureStatus = 'Low';
          status = 'Alert';
        } else if (moisture > 80) {
          moistureStatus = 'High';
          status = 'Warning';
        }
        
        if (temperature > 35) {
          temperatureStatus = 'High';
          status = 'Alert';
        } else if (temperature < 10) {
          temperatureStatus = 'Low';
          status = 'Warning';
        }
      }
      
      return {
        ...field.toObject(),
        status,
        moistureStatus,
        temperatureStatus
      };
    });
    
    res.json({
      success: true,
      fields: fieldsWithStatus,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalFields / limit),
        totalFields,
        hasNextPage: page * limit < totalFields,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    logger.error('Error getting field overview:', error);
    res.status(500).json({ 
      error: 'Failed to get field overview',
      message: {
        english: 'Unable to load field overview',
        marathi: 'शेतांचा आढावा लोड करण्यात अयशस्वी'
      }
    });
  }
};

// Get alerts for managed farmers
const getAlerts = async (req, res) => {
  try {
    const coordinatorId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Get managed farmers
    const managedFarmers = await User.find({ 
      managedBy: coordinatorId,
      role: 'farmer',
      isActive: true 
    });
    
    const farmerIds = managedFarmers.map(farmer => farmer._id);
    
    // Get fields with sensor data
    const fields = await Field.find({ 
      owner: { $in: farmerIds },
      lastSensorData: { $exists: true, $ne: null }
    }).populate('owner', 'name email');
    
    // Generate alerts based on sensor data
    const alerts = [];
    
    fields.forEach(field => {
      const { moisture, temperature } = field.lastSensorData;
      
      if (moisture < 30) {
        alerts.push({
          id: `moisture-${field._id}`,
          type: 'moisture',
          severity: 'high',
          message: `Low moisture detected in ${field.fieldName || field.fieldId}`,
          farmer: field.owner.name,
          fieldId: field.fieldId,
          fieldName: field.fieldName,
          value: moisture,
          threshold: 30,
          createdAt: new Date()
        });
      } else if (moisture > 80) {
        alerts.push({
          id: `moisture-high-${field._id}`,
          type: 'moisture',
          severity: 'medium',
          message: `High moisture detected in ${field.fieldName || field.fieldId}`,
          farmer: field.owner.name,
          fieldId: field.fieldId,
          fieldName: field.fieldName,
          value: moisture,
          threshold: 80,
          createdAt: new Date()
        });
      }
      
      if (temperature > 35) {
        alerts.push({
          id: `temperature-${field._id}`,
          type: 'temperature',
          severity: 'high',
          message: `High temperature detected in ${field.fieldName || field.fieldId}`,
          farmer: field.owner.name,
          fieldId: field.fieldId,
          fieldName: field.fieldName,
          value: temperature,
          threshold: 35,
          createdAt: new Date()
        });
      }
    });
    
    // Sort alerts by severity and date
    alerts.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[b.severity] - severityOrder[a.severity];
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    // Apply pagination
    const paginatedAlerts = alerts.slice(skip, skip + limit);
    
    res.json({
      success: true,
      alerts: paginatedAlerts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(alerts.length / limit),
        totalAlerts: alerts.length,
        hasNextPage: page * limit < alerts.length,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    logger.error('Error getting alerts:', error);
    res.status(500).json({ 
      error: 'Failed to get alerts',
      message: {
        english: 'Unable to load alerts',
        marathi: 'सूचना लोड करण्यात अयशस्वी'
      }
    });
  }
};

// Get analytics for managed farmers
const getAnalytics = async (req, res) => {
  try {
    const coordinatorId = req.user._id;
    const period = req.query.period || 'month'; // week, month, quarter, year
    
    // Get managed farmers
    const managedFarmers = await User.find({ 
      managedBy: coordinatorId,
      role: 'farmer',
      isActive: true 
    });
    
    const farmerIds = managedFarmers.map(farmer => farmer._id);
    
    // Get fields
    const fields = await Field.find({ 
      owner: { $in: farmerIds } 
    });
    
    // Calculate analytics (mock data for now)
    const analytics = {
      totalFarmers: managedFarmers.length,
      totalFields: fields.length,
      averageYield: 85, // Mock data
      waterUsage: {
        current: 1200,
        previous: 1350,
        change: -11
      },
      pestIssues: {
        current: 3,
        previous: 7,
        change: -57
      },
      fieldHealth: {
        excellent: Math.floor(fields.length * 0.4),
        good: Math.floor(fields.length * 0.4),
        fair: Math.floor(fields.length * 0.15),
        poor: Math.floor(fields.length * 0.05)
      },
      cropDistribution: {
        wheat: 35,
        rice: 25,
        cotton: 20,
        sugarcane: 15,
        others: 5
      }
    };
    
    res.json({ success: true, analytics });
  } catch (error) {
    logger.error('Error getting analytics:', error);
    res.status(500).json({ 
      error: 'Failed to get analytics',
      message: {
        english: 'Unable to load analytics',
        marathi: 'विश्लेषण लोड करण्यात अयशस्वी'
      }
    });
  }
};

// Send message to farmers
const sendMessage = async (req, res) => {
  try {
    const coordinatorId = req.user._id;
    const { farmerIds, message, subject } = req.body;
    
    if (!farmerIds || !message) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: {
          english: 'Farmer IDs and message are required',
          marathi: 'शेतकरी ID आणि संदेश आवश्यक आहेत'
        }
      });
    }
    
    // Verify that all farmers are managed by this coordinator
    const managedFarmers = await User.find({ 
      _id: { $in: farmerIds },
      managedBy: coordinatorId,
      role: 'farmer'
    });
    
    if (managedFarmers.length !== farmerIds.length) {
      return res.status(403).json({
        error: 'Unauthorized',
        message: {
          english: 'You can only send messages to your managed farmers',
          marathi: 'तुम्ही फक्त तुमच्या व्यवस्थापित शेतकऱ्यांना संदेश पाठवू शकता'
        }
      });
    }
    
    // TODO: Implement actual messaging system
    // For now, just log the message
    logger.info(`Coordinator ${coordinatorId} sent message to farmers:`, {
      farmerIds,
      subject,
      message,
      timestamp: new Date()
    });
    
    res.json({
      success: true,
      message: {
        english: 'Message sent successfully',
        marathi: 'संदेश यशस्वीरित्या पाठवला'
      },
      sentTo: managedFarmers.length
    });
  } catch (error) {
    logger.error('Error sending message:', error);
    res.status(500).json({ 
      error: 'Failed to send message',
      message: {
        english: 'Unable to send message',
        marathi: 'संदेश पाठवण्यात अयशस्वी'
      }
    });
  }
};

module.exports = {
  getDashboardStats,
  getManagedFarmers,
  getFieldOverview,
  getAlerts,
  getAnalytics,
  sendMessage
}; 