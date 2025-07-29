const { SensorData } = require('../utils/mongoClient');
const Field = require('../models/Field');
const User = require('../models/User');

// Get sensor data trends
const getSensorTrends = async (req, res) => {
  try {
    const { fieldId, timeRange = '7d' } = req.query;
    const userId = req.user._id;

    // Validate field access
    const field = await Field.findOne({ fieldId, $or: [{ owner: userId }, { assignedTo: userId }] });
    if (!field) {
      return res.status(404).json({ error: 'Field not found or access denied' });
    }

    // Calculate date range
    const now = new Date();
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));

    // Get sensor data
    const sensorData = await SensorData.find({
      fieldId,
      timestamp: { $gte: startDate }
    }).sort({ timestamp: 1 });

    // Process data for trends
    const labels = [];
    const temperature = [];
    const humidity = [];
    const moisture = [];
    const light = [];
    const ph = [];

    // Group data by day
    const groupedData = {};
    sensorData.forEach(data => {
      const date = data.timestamp.toISOString().split('T')[0];
      if (!groupedData[date]) {
        groupedData[date] = { temp: [], hum: [], moist: [], light: [], ph: [] };
      }
      if (data.temperature) groupedData[date].temp.push(data.temperature);
      if (data.humidity) groupedData[date].hum.push(data.humidity);
      if (data.moisture) groupedData[date].moist.push(data.moisture);
      if (data.light) groupedData[date].light.push(data.light);
      if (data.ph) groupedData[date].ph.push(data.ph);
    });

    // Calculate averages
    Object.keys(groupedData).forEach(date => {
      labels.push(new Date(date).toLocaleDateString('en-US', { weekday: 'short' }));
      temperature.push(groupedData[date].temp.length > 0 ? 
        (groupedData[date].temp.reduce((a, b) => a + b, 0) / groupedData[date].temp.length).toFixed(1) : 0);
      humidity.push(groupedData[date].hum.length > 0 ? 
        (groupedData[date].hum.reduce((a, b) => a + b, 0) / groupedData[date].hum.length).toFixed(1) : 0);
      moisture.push(groupedData[date].moist.length > 0 ? 
        (groupedData[date].moist.reduce((a, b) => a + b, 0) / groupedData[date].moist.length).toFixed(1) : 0);
      light.push(groupedData[date].light.length > 0 ? 
        (groupedData[date].light.reduce((a, b) => a + b, 0) / groupedData[date].light.length).toFixed(1) : 0);
      ph.push(groupedData[date].ph.length > 0 ? 
        (groupedData[date].ph.reduce((a, b) => a + b, 0) / groupedData[date].ph.length).toFixed(1) : 0);
    });

    res.json({
      labels,
      temperature: temperature.map(t => parseFloat(t)),
      humidity: humidity.map(h => parseFloat(h)),
      moisture: moisture.map(m => parseFloat(m)),
      light: light.map(l => parseFloat(l)),
      ph: ph.map(p => parseFloat(p))
    });
  } catch (error) {
    console.error('Error fetching sensor trends:', error);
    res.status(500).json({ error: 'Failed to fetch sensor trends' });
  }
};

// Get crop performance data
const getCropPerformance = async (req, res) => {
  try {
    const { fieldId } = req.query;
    const userId = req.user._id;

    // Validate field access
    const field = await Field.findOne({ fieldId, $or: [{ owner: userId }, { assignedTo: userId }] });
    if (!field) {
      return res.status(404).json({ error: 'Field not found or access denied' });
    }

    // Mock crop performance data (replace with real data from crop database)
    const cropPerformance = {
      crops: ['Rice', 'Wheat', 'Cotton', 'Sugarcane', 'Tomato', 'Onion'],
      yields: [4.2, 3.8, 2.1, 85.5, 25.3, 18.7],
      quality: [85, 88, 92, 78, 90, 87],
      profit: [45000, 38000, 63000, 120000, 75000, 56000]
    };

    res.json(cropPerformance);
  } catch (error) {
    console.error('Error fetching crop performance:', error);
    res.status(500).json({ error: 'Failed to fetch crop performance' });
  }
};

// Get weather correlation data
const getWeatherCorrelation = async (req, res) => {
  try {
    const { fieldId, timeRange = '7d' } = req.query;
    const userId = req.user._id;

    // Validate field access
    const field = await Field.findOne({ fieldId, $or: [{ owner: userId }, { assignedTo: userId }] });
    if (!field) {
      return res.status(404).json({ error: 'Field not found or access denied' });
    }

    // Mock weather correlation data
    const weatherCorrelation = {
      temperature: {
        correlation: 0.75,
        impact: 'High - Temperature affects crop growth significantly'
      },
      rainfall: {
        correlation: 0.82,
        impact: 'Very High - Rainfall directly impacts soil moisture and crop health'
      },
      humidity: {
        correlation: 0.68,
        impact: 'Medium - Humidity affects disease risk and transpiration'
      },
      wind: {
        correlation: 0.45,
        impact: 'Low - Wind affects pollination and water loss'
      }
    };

    res.json(weatherCorrelation);
  } catch (error) {
    console.error('Error fetching weather correlation:', error);
    res.status(500).json({ error: 'Failed to fetch weather correlation' });
  }
};

// Get soil health data
const getSoilHealth = async (req, res) => {
  try {
    const { fieldId } = req.query;
    const userId = req.user._id;

    // Validate field access
    const field = await Field.findOne({ fieldId, $or: [{ owner: userId }, { assignedTo: userId }] });
    if (!field) {
      return res.status(404).json({ error: 'Field not found or access denied' });
    }

    // Get latest sensor data for soil health
    const latestData = await SensorData.findOne({ fieldId }).sort({ timestamp: -1 });

    // Mock soil health data (replace with real soil analysis)
    const soilHealth = {
      ph: latestData?.ph || 6.8,
      nitrogen: 150,
      phosphorus: 18,
      potassium: 180,
      organicMatter: 3.2,
      healthScore: 78,
      recommendations: [
        'Consider adding organic matter to improve soil structure',
        'pH levels are optimal for most crops',
        'Nitrogen levels are adequate for current growth stage'
      ]
    };

    res.json(soilHealth);
  } catch (error) {
    console.error('Error fetching soil health:', error);
    res.status(500).json({ error: 'Failed to fetch soil health' });
  }
};

// Get yield prediction
const getYieldPrediction = async (req, res) => {
  try {
    const { fieldId } = req.query;
    const userId = req.user._id;

    // Validate field access
    const field = await Field.findOne({ fieldId, $or: [{ owner: userId }, { assignedTo: userId }] });
    if (!field) {
      return res.status(404).json({ error: 'Field not found or access denied' });
    }

    // Mock yield prediction data
    const yieldPrediction = {
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      predictions: [4.1, 4.3, 4.5, 4.2, 4.8, 5.1],
      confidence: [85, 87, 82, 89, 84, 91],
      factors: [
        'Current soil conditions are favorable',
        'Weather forecast shows adequate rainfall',
        'Crop health indicators are positive'
      ]
    };

    res.json(yieldPrediction);
  } catch (error) {
    console.error('Error fetching yield prediction:', error);
    res.status(500).json({ error: 'Failed to fetch yield prediction' });
  }
};

// Get financial metrics
const getFinancialMetrics = async (req, res) => {
  try {
    const { fieldId } = req.query;
    const userId = req.user._id;

    // Validate field access
    const field = await Field.findOne({ fieldId, $or: [{ owner: userId }, { assignedTo: userId }] });
    if (!field) {
      return res.status(404).json({ error: 'Field not found or access denied' });
    }

    // Mock financial metrics (replace with real financial data)
    const financialMetrics = {
      revenue: 125000,
      costs: 85000,
      profit: 40000,
      investment: 60000,
      roi: 66.7,
      costBreakdown: {
        seeds: 15000,
        fertilizers: 20000,
        irrigation: 12000,
        labor: 25000,
        equipment: 8000,
        other: 5000
      },
      trends: {
        revenueGrowth: 12.5,
        costReduction: -8.3,
        profitIncrease: 15.2
      }
    };

    res.json(financialMetrics);
  } catch (error) {
    console.error('Error fetching financial metrics:', error);
    res.status(500).json({ error: 'Failed to fetch financial metrics' });
  }
};

// Get field comparison
const getFieldComparison = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's fields
    const fields = await Field.find({ $or: [{ owner: userId }, { assignedTo: userId }] });

    // Mock field comparison data
    const fieldComparison = fields.map(field => ({
      fieldId: field.fieldId,
      name: field.name,
      performance: Math.random() * 100,
      yield: Math.random() * 10 + 2,
      efficiency: Math.random() * 100,
      health: Math.random() * 100
    }));

    res.json(fieldComparison);
  } catch (error) {
    console.error('Error fetching field comparison:', error);
    res.status(500).json({ error: 'Failed to fetch field comparison' });
  }
};

// Get seasonal analysis
const getSeasonalAnalysis = async (req, res) => {
  try {
    const { fieldId } = req.query;
    const userId = req.user._id;

    // Validate field access
    const field = await Field.findOne({ fieldId, $or: [{ owner: userId }, { assignedTo: userId }] });
    if (!field) {
      return res.status(404).json({ error: 'Field not found or access denied' });
    }

    // Mock seasonal analysis
    const seasonalAnalysis = {
      seasons: ['Kharif', 'Rabi', 'Zaid'],
      yields: [4.2, 3.8, 2.1],
      optimalCrops: ['Rice', 'Wheat', 'Vegetables'],
      recommendations: [
        'Kharif season shows best performance',
        'Consider crop rotation for Rabi season',
        'Zaid season suitable for short-duration crops'
      ]
    };

    res.json(seasonalAnalysis);
  } catch (error) {
    console.error('Error fetching seasonal analysis:', error);
    res.status(500).json({ error: 'Failed to fetch seasonal analysis' });
  }
};

// Get risk assessment
const getRiskAssessment = async (req, res) => {
  try {
    const { fieldId } = req.query;
    const userId = req.user._id;

    // Validate field access
    const field = await Field.findOne({ fieldId, $or: [{ owner: userId }, { assignedTo: userId }] });
    if (!field) {
      return res.status(404).json({ error: 'Field not found or access denied' });
    }

    // Mock risk assessment
    const riskAssessment = {
      overallRisk: 'Low',
      risks: [
        {
          type: 'Weather',
          severity: 'Medium',
          probability: 0.3,
          impact: 'Moderate crop damage',
          mitigation: 'Install weather monitoring system'
        },
        {
          type: 'Disease',
          severity: 'Low',
          probability: 0.2,
          impact: 'Minor yield reduction',
          mitigation: 'Regular crop monitoring and preventive spraying'
        },
        {
          type: 'Market',
          severity: 'Low',
          probability: 0.1,
          impact: 'Price fluctuation',
          mitigation: 'Diversify crop portfolio'
        }
      ]
    };

    res.json(riskAssessment);
  } catch (error) {
    console.error('Error fetching risk assessment:', error);
    res.status(500).json({ error: 'Failed to fetch risk assessment' });
  }
};

// Get optimization suggestions
const getOptimizationSuggestions = async (req, res) => {
  try {
    const { fieldId } = req.query;
    const userId = req.user._id;

    // Validate field access
    const field = await Field.findOne({ fieldId, $or: [{ owner: userId }, { assignedTo: userId }] });
    if (!field) {
      return res.status(404).json({ error: 'Field not found or access denied' });
    }

    // Mock optimization suggestions
    const optimizationSuggestions = {
      irrigation: {
        current: 'Manual irrigation',
        suggested: 'Automated drip irrigation',
        potentialSavings: '30% water savings',
        investment: 25000,
        paybackPeriod: '8 months'
      },
      fertilization: {
        current: 'Broadcast application',
        suggested: 'Precision fertilization',
        potentialSavings: '20% fertilizer cost',
        investment: 15000,
        paybackPeriod: '6 months'
      },
      monitoring: {
        current: 'Manual monitoring',
        suggested: 'IoT sensor network',
        potentialSavings: '15% yield improvement',
        investment: 35000,
        paybackPeriod: '12 months'
      }
    };

    res.json(optimizationSuggestions);
  } catch (error) {
    console.error('Error fetching optimization suggestions:', error);
    res.status(500).json({ error: 'Failed to fetch optimization suggestions' });
  }
};

module.exports = {
  getSensorTrends,
  getCropPerformance,
  getWeatherCorrelation,
  getSoilHealth,
  getYieldPrediction,
  getFinancialMetrics,
  getFieldComparison,
  getSeasonalAnalysis,
  getRiskAssessment,
  getOptimizationSuggestions
}; 