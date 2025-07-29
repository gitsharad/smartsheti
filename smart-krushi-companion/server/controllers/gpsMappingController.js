const FieldLocation = require('../models/FieldLocation');
const Field = require('../models/Field');
const { logger } = require('../utils/logger');

// Get all field locations for a user
const getUserFieldLocations = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, district, state } = req.query;

    const query = { userId };
    if (status) query.status = status;
    if (district) query['metadata.district'] = district;
    if (state) query['metadata.state'] = state;

    const fieldLocations = await FieldLocation.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      fieldLocations,
      count: fieldLocations.length
    });
  } catch (error) {
    logger.error('Error getting user field locations:', error);
    res.status(500).json({
      error: 'Failed to get field locations',
      message: {
        english: 'Unable to load field locations',
        marathi: 'फील्ड स्थाने लोड करण्यात अयशस्वी'
      }
    });
  }
};

// Create new field location
const createFieldLocation = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      fieldId,
      name,
      coordinates,
      boundaries,
      area,
      elevation,
      soilType,
      irrigationType,
      accessPoints,
      landmarks,
      metadata
    } = req.body;

    // Validate required fields
    if (!fieldId || !name || !coordinates) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: {
          english: 'Field ID, name, and coordinates are required',
          marathi: 'फील्ड ID, नाव आणि निर्देशांक आवश्यक आहेत'
        }
      });
    }

    // Check if field location already exists
    const existingLocation = await FieldLocation.findOne({ fieldId });
    if (existingLocation) {
      return res.status(400).json({
        error: 'Field location already exists',
        message: {
          english: 'A location for this field already exists',
          marathi: 'या फील्डसाठी स्थान आधीपासून अस्तित्वात आहे'
        }
      });
    }

    // Create field location
    const fieldLocation = new FieldLocation({
      fieldId,
      userId,
      name,
      location: {
        type: 'Point',
        coordinates: coordinates
      },
      boundaries: boundaries ? {
        type: 'Polygon',
        coordinates: boundaries
      } : undefined,
      area,
      elevation,
      soilType,
      irrigationType,
      accessPoints,
      landmarks,
      metadata,
      lastSurvey: {
        date: new Date(),
        surveyor: userId,
        method: 'gps_device',
        accuracy: 95
      }
    });

    await fieldLocation.save();

    res.status(201).json({
      success: true,
      message: {
        english: 'Field location created successfully',
        marathi: 'फील्ड स्थान यशस्वीरित्या तयार केले'
      },
      fieldLocation
    });
  } catch (error) {
    logger.error('Error creating field location:', error);
    res.status(500).json({
      error: 'Failed to create field location',
      message: {
        english: 'Unable to create field location',
        marathi: 'फील्ड स्थान तयार करण्यात अयशस्वी'
      }
    });
  }
};

// Update field location
const updateFieldLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const updateData = req.body;

    const fieldLocation = await FieldLocation.findOne({ _id: id, userId });
    if (!fieldLocation) {
      return res.status(404).json({
        error: 'Field location not found',
        message: {
          english: 'Field location not found',
          marathi: 'फील्ड स्थान सापडले नाही'
        }
      });
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (key !== 'fieldId' && key !== 'userId') {
        fieldLocation[key] = updateData[key];
      }
    });

    // Update last survey info
    fieldLocation.lastSurvey = {
      date: new Date(),
      surveyor: userId,
      method: updateData.surveyMethod || 'gps_device',
      accuracy: updateData.accuracy || 95
    };

    await fieldLocation.save();

    res.json({
      success: true,
      message: {
        english: 'Field location updated successfully',
        marathi: 'फील्ड स्थान यशस्वीरित्या अद्ययावत केले'
      },
      fieldLocation
    });
  } catch (error) {
    logger.error('Error updating field location:', error);
    res.status(500).json({
      error: 'Failed to update field location',
      message: {
        english: 'Unable to update field location',
        marathi: 'फील्ड स्थान अद्ययावत करण्यात अयशस्वी'
      }
    });
  }
};

// Get field location by ID
const getFieldLocationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const fieldLocation = await FieldLocation.findOne({ _id: id, userId })
      .populate('userId', 'name email');

    if (!fieldLocation) {
      return res.status(404).json({
        error: 'Field location not found',
        message: {
          english: 'Field location not found',
          marathi: 'फील्ड स्थान सापडले नाही'
        }
      });
    }

    res.json({
      success: true,
      fieldLocation
    });
  } catch (error) {
    logger.error('Error getting field location by ID:', error);
    res.status(500).json({
      error: 'Failed to get field location',
      message: {
        english: 'Unable to load field location',
        marathi: 'फील्ड स्थान लोड करण्यात अयशस्वी'
      }
    });
  }
};

// Find fields within radius (for mobile app)
const findFieldsWithinRadius = async (req, res) => {
  try {
    const { latitude, longitude, radius = 10 } = req.query; // radius in km
    const userId = req.user._id;

    if (!latitude || !longitude) {
      return res.status(400).json({
        error: 'Missing coordinates',
        message: {
          english: 'Latitude and longitude are required',
          marathi: 'अक्षांश आणि रेखांश आवश्यक आहेत'
        }
      });
    }

    const center = [parseFloat(longitude), parseFloat(latitude)];
    const radiusKm = parseFloat(radius);

    const fieldLocations = await FieldLocation.findFieldsWithinRadius(center, radiusKm, userId);

    res.json({
      success: true,
      fieldLocations,
      count: fieldLocations.length,
      searchParams: {
        center,
        radius: radiusKm,
        unit: 'kilometers'
      }
    });
  } catch (error) {
    logger.error('Error finding fields within radius:', error);
    res.status(500).json({
      error: 'Failed to find fields',
      message: {
        english: 'Unable to search for fields',
        marathi: 'फील्ड शोधण्यात अयशस्वी'
      }
    });
  }
};

// Get fields by district (for admin/coordinator)
const getFieldsByDistrict = async (req, res) => {
  try {
    const { district, state } = req.query;

    if (!district) {
      return res.status(400).json({
        error: 'District is required',
        message: {
          english: 'District name is required',
          marathi: 'जिल्ह्याचे नाव आवश्यक आहे'
        }
      });
    }

    const fieldLocations = await FieldLocation.findFieldsByDistrict(district, state);

    res.json({
      success: true,
      fieldLocations,
      count: fieldLocations.length,
      searchParams: {
        district,
        state: state || 'any'
      }
    });
  } catch (error) {
    logger.error('Error getting fields by district:', error);
    res.status(500).json({
      error: 'Failed to get fields by district',
      message: {
        english: 'Unable to get fields by district',
        marathi: 'जिल्ह्यानुसार फील्ड मिळवण्यात अयशस्वी'
      }
    });
  }
};

// Get field statistics
const getFieldStatistics = async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await FieldLocation.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalFields: { $sum: 1 },
          totalArea: { $sum: '$area.value' },
          avgElevation: { $avg: '$elevation.value' },
          soilTypes: { $addToSet: '$soilType' },
          irrigationTypes: { $addToSet: '$irrigationType' }
        }
      }
    ]);

    const districtStats = await FieldLocation.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: '$metadata.district',
          count: { $sum: 1 },
          totalArea: { $sum: '$area.value' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const statusStats = await FieldLocation.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      stats: {
        overview: stats[0] || {
          totalFields: 0,
          totalArea: 0,
          avgElevation: 0,
          soilTypes: [],
          irrigationTypes: []
        },
        byDistrict: districtStats,
        byStatus: statusStats
      }
    });
  } catch (error) {
    logger.error('Error getting field statistics:', error);
    res.status(500).json({
      error: 'Failed to get field statistics',
      message: {
        english: 'Unable to load field statistics',
        marathi: 'फील्ड आकडेवारी लोड करण्यात अयशस्वी'
      }
    });
  }
};

// Mobile-specific: Get nearby weather stations
const getNearbyWeatherStations = async (req, res) => {
  try {
    const { latitude, longitude, radius = 50 } = req.query; // radius in km

    if (!latitude || !longitude) {
      return res.status(400).json({
        error: 'Missing coordinates',
        message: {
          english: 'Latitude and longitude are required',
          marathi: 'अक्षांश आणि रेखांश आवश्यक आहेत'
        }
      });
    }

    const center = [parseFloat(longitude), parseFloat(latitude)];
    const radiusKm = parseFloat(radius);

    // Find fields with weather stations within radius
    const fieldsWithStations = await FieldLocation.find({
      'weatherStation.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: center
          },
          $maxDistance: radiusKm * 1000
        }
      }
    }).select('weatherStation metadata');

    // Mock weather station data (in real app, this would come from weather API)
    const weatherStations = fieldsWithStations.map(field => ({
      stationId: field.weatherStation.stationId || `WS_${field._id}`,
      coordinates: field.weatherStation.coordinates,
      distance: field.weatherStation.distance,
      location: field.metadata.village || field.metadata.nearestTown,
      currentWeather: {
        temperature: 25 + Math.random() * 10,
        humidity: 60 + Math.random() * 20,
        rainfall: Math.random() * 50,
        windSpeed: Math.random() * 15,
        lastUpdated: new Date()
      }
    }));

    res.json({
      success: true,
      weatherStations,
      count: weatherStations.length,
      searchParams: {
        center,
        radius: radiusKm,
        unit: 'kilometers'
      }
    });
  } catch (error) {
    logger.error('Error getting nearby weather stations:', error);
    res.status(500).json({
      error: 'Failed to get weather stations',
      message: {
        english: 'Unable to get weather stations',
        marathi: 'हवामान केंद्रे मिळवण्यात अयशस्वी'
      }
    });
  }
};

// Mobile-specific: Get field boundaries for mapping
const getFieldBoundaries = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const userId = req.user._id;

    const fieldLocation = await FieldLocation.findOne({ fieldId, userId })
      .select('boundaries location area metadata name');

    if (!fieldLocation) {
      return res.status(404).json({
        error: 'Field not found',
        message: {
          english: 'Field not found',
          marathi: 'फील्ड सापडले नाही'
        }
      });
    }

    res.json({
      success: true,
      fieldBoundaries: {
        fieldId,
        name: fieldLocation.name,
        center: fieldLocation.location.coordinates,
        boundaries: fieldLocation.boundaries,
        area: fieldLocation.area,
        metadata: fieldLocation.metadata
      }
    });
  } catch (error) {
    logger.error('Error getting field boundaries:', error);
    res.status(500).json({
      error: 'Failed to get field boundaries',
      message: {
        english: 'Unable to get field boundaries',
        marathi: 'फील्ड सीमा मिळवण्यात अयशस्वी'
      }
    });
  }
};

// Mobile-specific: Update field location from mobile GPS
const updateLocationFromMobile = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const userId = req.user._id;
    const { coordinates, accuracy, surveyMethod = 'mobile_gps' } = req.body;

    if (!coordinates) {
      return res.status(400).json({
        error: 'Coordinates required',
        message: {
          english: 'GPS coordinates are required',
          marathi: 'GPS निर्देशांक आवश्यक आहेत'
        }
      });
    }

    const fieldLocation = await FieldLocation.findOne({ fieldId, userId });
    if (!fieldLocation) {
      return res.status(404).json({
        error: 'Field not found',
        message: {
          english: 'Field not found',
          marathi: 'फील्ड सापडले नाही'
        }
      });
    }

    // Update location
    fieldLocation.location.coordinates = coordinates;
    fieldLocation.lastSurvey = {
      date: new Date(),
      surveyor: userId,
      method: surveyMethod,
      accuracy: accuracy || 85
    };

    await fieldLocation.save();

    res.json({
      success: true,
      message: {
        english: 'Field location updated from mobile',
        marathi: 'मोबाईलमधून फील्ड स्थान अद्ययावत केले'
      },
      fieldLocation: {
        fieldId: fieldLocation.fieldId,
        coordinates: fieldLocation.location.coordinates,
        lastUpdated: fieldLocation.lastSurvey.date
      }
    });
  } catch (error) {
    logger.error('Error updating location from mobile:', error);
    res.status(500).json({
      error: 'Failed to update location',
      message: {
        english: 'Unable to update field location',
        marathi: 'फील्ड स्थान अद्ययावत करण्यात अयशस्वी'
      }
    });
  }
};

module.exports = {
  getUserFieldLocations,
  createFieldLocation,
  updateFieldLocation,
  getFieldLocationById,
  findFieldsWithinRadius,
  getFieldsByDistrict,
  getFieldStatistics,
  getNearbyWeatherStations,
  getFieldBoundaries,
  updateLocationFromMobile
}; 