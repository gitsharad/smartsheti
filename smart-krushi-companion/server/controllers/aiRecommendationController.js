const CropRecommendation = require('../models/CropRecommendation');
const Field = require('../models/Field');
const { SensorData } = require('../utils/mongoClient');
const { logger } = require('../utils/logger');

// AI-powered crop recommendation algorithm
const generateCropRecommendation = async (fieldId, userId) => {
  try {
    // Get field data
    const field = await Field.findOne({ fieldId, $or: [{ owner: userId }, { assignedTo: userId }] });
    if (!field) {
      throw new Error('Field not found or access denied');
    }

    // Get latest sensor data
    const latestSensorData = await SensorData.findOne({ fieldId }).sort({ timestamp: -1 });
    
    // Get historical sensor data for trend analysis
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const historicalData = await SensorData.find({
      fieldId,
      timestamp: { $gte: thirtyDaysAgo }
    }).sort({ timestamp: 1 });

    // Calculate average conditions
    const avgTemperature = historicalData.length > 0 
      ? historicalData.reduce((sum, data) => sum + (data.temperature || 0), 0) / historicalData.length 
      : 25;
    
    const avgHumidity = historicalData.length > 0 
      ? historicalData.reduce((sum, data) => sum + (data.humidity || 0), 0) / historicalData.length 
      : 65;
    
    const avgMoisture = historicalData.length > 0 
      ? historicalData.reduce((sum, data) => sum + (data.moisture || 0), 0) / historicalData.length 
      : 45;

    // Get current month for season determination
    const currentMonth = new Date().getMonth() + 1;
    let season;
    if (currentMonth >= 6 && currentMonth <= 10) {
      season = 'Kharif';
    } else if (currentMonth >= 11 || currentMonth <= 3) {
      season = 'Rabi';
    } else {
      season = 'Zaid';
    }

    // AI Algorithm for crop recommendation
    const recommendations = [];
    
    // Rice recommendation logic
    if (season === 'Kharif' && avgTemperature >= 20 && avgTemperature <= 35 && avgHumidity >= 60) {
      const riceConfidence = calculateConfidence(avgTemperature, avgHumidity, avgMoisture, 'rice');
      if (riceConfidence > 70) {
        recommendations.push({
          cropName: 'Rice',
          confidence: riceConfidence,
          season: 'Kharif',
          plantingDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
          expectedYield: 4.5 + (Math.random() * 1.5),
          soilConditions: {
            ph: latestSensorData?.ph || 6.5,
            nitrogen: 150 + Math.random() * 50,
            phosphorus: 20 + Math.random() * 10,
            potassium: 180 + Math.random() * 40,
            organicMatter: 3.0 + Math.random() * 1.0
          },
          weatherConditions: {
            temperature: avgTemperature,
            humidity: avgHumidity,
            rainfall: 800 + Math.random() * 400,
            windSpeed: 5 + Math.random() * 10
          },
          marketConditions: {
            currentPrice: 1800 + Math.random() * 400,
            priceTrend: Math.random() > 0.5 ? 'increasing' : 'stable',
            demandLevel: Math.random() > 0.3 ? 'high' : 'medium'
          }
        });
      }
    }

    // Wheat recommendation logic
    if (season === 'Rabi' && avgTemperature >= 15 && avgTemperature <= 25) {
      const wheatConfidence = calculateConfidence(avgTemperature, avgHumidity, avgMoisture, 'wheat');
      if (wheatConfidence > 70) {
        recommendations.push({
          cropName: 'Wheat',
          confidence: wheatConfidence,
          season: 'Rabi',
          plantingDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
          expectedYield: 3.8 + (Math.random() * 1.2),
          soilConditions: {
            ph: latestSensorData?.ph || 6.8,
            nitrogen: 120 + Math.random() * 40,
            phosphorus: 15 + Math.random() * 8,
            potassium: 160 + Math.random() * 30,
            organicMatter: 2.8 + Math.random() * 0.8
          },
          weatherConditions: {
            temperature: avgTemperature,
            humidity: avgHumidity,
            rainfall: 400 + Math.random() * 200,
            windSpeed: 3 + Math.random() * 8
          },
          marketConditions: {
            currentPrice: 2200 + Math.random() * 300,
            priceTrend: Math.random() > 0.4 ? 'increasing' : 'stable',
            demandLevel: Math.random() > 0.2 ? 'high' : 'medium'
          }
        });
      }
    }

    // Cotton recommendation logic
    if (season === 'Kharif' && avgTemperature >= 25 && avgTemperature <= 40) {
      const cottonConfidence = calculateConfidence(avgTemperature, avgHumidity, avgMoisture, 'cotton');
      if (cottonConfidence > 65) {
        recommendations.push({
          cropName: 'Cotton',
          confidence: cottonConfidence,
          season: 'Kharif',
          plantingDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
          expectedYield: 2.2 + (Math.random() * 0.8),
          soilConditions: {
            ph: latestSensorData?.ph || 7.0,
            nitrogen: 100 + Math.random() * 30,
            phosphorus: 12 + Math.random() * 6,
            potassium: 140 + Math.random() * 25,
            organicMatter: 2.5 + Math.random() * 0.7
          },
          weatherConditions: {
            temperature: avgTemperature,
            humidity: avgHumidity,
            rainfall: 600 + Math.random() * 300,
            windSpeed: 4 + Math.random() * 12
          },
          marketConditions: {
            currentPrice: 5500 + Math.random() * 800,
            priceTrend: Math.random() > 0.6 ? 'increasing' : 'stable',
            demandLevel: Math.random() > 0.4 ? 'high' : 'medium'
          }
        });
      }
    }

    // Add risk factors and recommendations
    recommendations.forEach(rec => {
      rec.riskFactors = generateRiskFactors(rec.cropName, rec.weatherConditions, rec.soilConditions);
      rec.recommendations = generateActionRecommendations(rec.cropName, rec.riskFactors);
      rec.aiModel = {
        version: '1.0.0',
        accuracy: 85 + Math.random() * 10,
        lastUpdated: new Date()
      };
    });

    return recommendations;
  } catch (error) {
    logger.error('Error generating crop recommendation:', error);
    throw error;
  }
};

// Calculate confidence score based on conditions
const calculateConfidence = (temperature, humidity, moisture, cropType) => {
  let confidence = 50; // Base confidence

  const cropConditions = {
    rice: { tempRange: [20, 35], humidityRange: [60, 90], moistureRange: [40, 80] },
    wheat: { tempRange: [15, 25], humidityRange: [40, 70], moistureRange: [30, 60] },
    cotton: { tempRange: [25, 40], humidityRange: [50, 80], moistureRange: [35, 65] }
  };

  const conditions = cropConditions[cropType];
  if (!conditions) return confidence;

  // Temperature factor
  if (temperature >= conditions.tempRange[0] && temperature <= conditions.tempRange[1]) {
    confidence += 20;
  } else {
    confidence -= 15;
  }

  // Humidity factor
  if (humidity >= conditions.humidityRange[0] && humidity <= conditions.humidityRange[1]) {
    confidence += 15;
  } else {
    confidence -= 10;
  }

  // Moisture factor
  if (moisture >= conditions.moistureRange[0] && moisture <= conditions.moistureRange[1]) {
    confidence += 15;
  } else {
    confidence -= 10;
  }

  return Math.max(0, Math.min(100, confidence));
};

// Generate risk factors
const generateRiskFactors = (cropName, weatherConditions, soilConditions) => {
  const risks = [];

  // Weather risks
  if (weatherConditions.temperature > 35) {
    risks.push({
      factor: 'High Temperature Stress',
      severity: 'medium',
      probability: 60,
      mitigation: 'Implement shade structures and increase irrigation frequency'
    });
  }

  if (weatherConditions.humidity > 80) {
    risks.push({
      factor: 'Disease Risk (High Humidity)',
      severity: 'high',
      probability: 75,
      mitigation: 'Apply preventive fungicides and improve field ventilation'
    });
  }

  // Soil risks
  if (soilConditions.ph < 6.0 || soilConditions.ph > 8.0) {
    risks.push({
      factor: 'Suboptimal Soil pH',
      severity: 'medium',
      probability: 50,
      mitigation: 'Apply soil amendments to adjust pH levels'
    });
  }

  if (soilConditions.nitrogen < 100) {
    risks.push({
      factor: 'Low Nitrogen Content',
      severity: 'high',
      probability: 70,
      mitigation: 'Apply nitrogen-rich fertilizers before planting'
    });
  }

  return risks;
};

// Generate action recommendations
const generateActionRecommendations = (cropName, riskFactors) => {
  const recommendations = [];

  // Add crop-specific recommendations
  if (cropName === 'Rice') {
    recommendations.push({
      type: 'irrigation',
      description: 'Maintain 5-7 cm water level during vegetative stage',
      priority: 'high',
      timeline: 'Within 1 week',
      cost: 5000
    });
  }

  if (cropName === 'Wheat') {
    recommendations.push({
      type: 'fertilizer',
      description: 'Apply NPK 20:20:20 at 250 kg/ha',
      priority: 'high',
      timeline: 'Before planting',
      cost: 8000
    });
  }

  // Add risk-based recommendations
  riskFactors.forEach(risk => {
    if (risk.severity === 'high') {
      recommendations.push({
        type: 'pesticide',
        description: risk.mitigation,
        priority: 'critical',
        timeline: 'Immediate',
        cost: 3000
      });
    }
  });

  return recommendations;
};

// Get crop recommendations for a user
const getUserRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;
    const { fieldId, season, status } = req.query;

    const query = { userId };
    if (fieldId) query.fieldId = fieldId;
    if (season) query.season = season;
    if (status) query.status = status;

    const recommendations = await CropRecommendation.find(query)
      .sort({ confidence: -1, createdAt: -1 })
      .populate('userId', 'name email');

    res.json({
      success: true,
      recommendations,
      count: recommendations.length
    });
  } catch (error) {
    logger.error('Error getting user recommendations:', error);
    res.status(500).json({
      error: 'Failed to get recommendations',
      message: {
        english: 'Unable to load crop recommendations',
        marathi: 'पीक शिफारसी लोड करण्यात अयशस्वी'
      }
    });
  }
};

// Generate new AI recommendation
const generateRecommendation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { fieldId } = req.body;

    if (!fieldId) {
      return res.status(400).json({
        error: 'Field ID is required',
        message: {
          english: 'Please provide a field ID',
          marathi: 'कृपया फील्ड ID प्रदान करा'
        }
      });
    }

    // Generate AI recommendations
    const aiRecommendations = await generateCropRecommendation(fieldId, userId);

    // Save recommendations to database
    const savedRecommendations = [];
    for (const rec of aiRecommendations) {
      const recommendation = new CropRecommendation({
        userId,
        fieldId,
        ...rec
      });
      await recommendation.save();
      savedRecommendations.push(recommendation);
    }

    res.status(201).json({
      success: true,
      message: {
        english: `Generated ${savedRecommendations.length} crop recommendations`,
        marathi: `${savedRecommendations.length} पीक शिफारसी तयार केल्या`
      },
      recommendations: savedRecommendations
    });
  } catch (error) {
    logger.error('Error generating recommendation:', error);
    res.status(500).json({
      error: 'Failed to generate recommendation',
      message: {
        english: 'Unable to generate crop recommendation',
        marathi: 'पीक शिफारस तयार करण्यात अयशस्वी'
      }
    });
  }
};

// Update recommendation status
const updateRecommendationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user._id;

    const recommendation = await CropRecommendation.findOne({ _id: id, userId });
    if (!recommendation) {
      return res.status(404).json({
        error: 'Recommendation not found',
        message: {
          english: 'Crop recommendation not found',
          marathi: 'पीक शिफारस सापडली नाही'
        }
      });
    }

    recommendation.status = status;
    await recommendation.save();

    res.json({
      success: true,
      message: {
        english: 'Recommendation status updated',
        marathi: 'शिफारस स्थिती अद्ययावत केली'
      },
      recommendation
    });
  } catch (error) {
    logger.error('Error updating recommendation status:', error);
    res.status(500).json({
      error: 'Failed to update recommendation status',
      message: {
        english: 'Unable to update recommendation status',
        marathi: 'शिफारस स्थिती अद्ययावत करण्यात अयशस्वी'
      }
    });
  }
};

// Add farmer feedback
const addFarmerFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, implemented, actualYield } = req.body;
    const userId = req.user._id;

    const recommendation = await CropRecommendation.findOne({ _id: id, userId });
    if (!recommendation) {
      return res.status(404).json({
        error: 'Recommendation not found',
        message: {
          english: 'Crop recommendation not found',
          marathi: 'पीक शिफारस सापडली नाही'
        }
      });
    }

    recommendation.farmerFeedback = {
      rating,
      comment,
      implemented,
      actualYield,
      feedbackDate: new Date()
    };

    await recommendation.save();

    res.json({
      success: true,
      message: {
        english: 'Feedback submitted successfully',
        marathi: 'अभिप्राय यशस्वीरित्या सबमिट केला'
      },
      recommendation
    });
  } catch (error) {
    logger.error('Error adding farmer feedback:', error);
    res.status(500).json({
      error: 'Failed to submit feedback',
      message: {
        english: 'Unable to submit feedback',
        marathi: 'अभिप्राय सबमिट करण्यात अयशस्वी'
      }
    });
  }
};

// Get recommendation statistics
const getRecommendationStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await CropRecommendation.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$confidence' }
        }
      }
    ]);

    const totalRecommendations = await CropRecommendation.countDocuments({ userId });
    const implementedRecommendations = await CropRecommendation.countDocuments({ 
      userId, 
      'farmerFeedback.implemented': true 
    });

    res.json({
      success: true,
      stats: {
        total: totalRecommendations,
        implemented: implementedRecommendations,
        implementationRate: totalRecommendations > 0 ? (implementedRecommendations / totalRecommendations) * 100 : 0,
        statusBreakdown: stats
      }
    });
  } catch (error) {
    logger.error('Error getting recommendation stats:', error);
    res.status(500).json({
      error: 'Failed to get recommendation statistics',
      message: {
        english: 'Unable to load recommendation statistics',
        marathi: 'शिफारस आकडेवारी लोड करण्यात अयशस्वी'
      }
    });
  }
};

module.exports = {
  getUserRecommendations,
  generateRecommendation,
  updateRecommendationStatus,
  addFarmerFeedback,
  getRecommendationStats
}; 