const mongoose = require('mongoose');

const fieldLocationSchema = new mongoose.Schema({
  fieldId: {
    type: String,
    required: true,
    unique: true,
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
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      validate: {
        validator: function(coords) {
          return coords.length === 2 && 
                 coords[0] >= -180 && coords[0] <= 180 && // longitude
                 coords[1] >= -90 && coords[1] <= 90;     // latitude
        },
        message: 'Invalid coordinates. Longitude must be between -180 and 180, latitude between -90 and 90.'
      }
    }
  },
  boundaries: {
    type: {
      type: String,
      enum: ['Polygon'],
      default: 'Polygon'
    },
    coordinates: [[[Number]]] // Array of coordinate arrays for polygon
  },
  area: {
    value: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      enum: ['acres', 'hectares', 'sq_meters'],
      default: 'acres'
    }
  },
  elevation: {
    value: {
      type: Number,
      min: 0
    },
    unit: {
      type: String,
      enum: ['meters', 'feet'],
      default: 'meters'
    }
  },
  soilType: {
    type: String,
    enum: ['clay', 'loam', 'sandy', 'silt', 'peaty', 'chalky', 'unknown'],
    default: 'unknown'
  },
  irrigationType: {
    type: String,
    enum: ['drip', 'sprinkler', 'flood', 'pivot', 'none', 'unknown'],
    default: 'unknown'
  },
  accessPoints: [{
    name: String,
    coordinates: [Number], // [longitude, latitude]
    type: {
      type: String,
      enum: ['road', 'path', 'gate', 'water_source'],
      default: 'road'
    },
    description: String
  }],
  landmarks: [{
    name: String,
    coordinates: [Number], // [longitude, latitude]
    type: {
      type: String,
      enum: ['tree', 'building', 'water_body', 'hill', 'other'],
      default: 'other'
    },
    description: String
  }],
  weatherStation: {
    coordinates: [Number], // [longitude, latitude]
    distance: Number, // distance from field center in meters
    stationId: String
  },
  lastSurvey: {
    date: Date,
    surveyor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    method: {
      type: String,
      enum: ['gps_device', 'satellite', 'manual', 'drone'],
      default: 'gps_device'
    },
    accuracy: {
      type: Number,
      min: 0,
      max: 100,
      default: 95
    }
  },
  metadata: {
    village: String,
    taluka: String,
    district: String,
    state: String,
    pincode: String,
    nearestTown: String,
    distanceFromTown: Number // in kilometers
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'fallow', 'sold'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Geospatial indexes for efficient location queries
fieldLocationSchema.index({ location: '2dsphere' });
fieldLocationSchema.index({ boundaries: '2dsphere' });
fieldLocationSchema.index({ userId: 1, status: 1 });
fieldLocationSchema.index({ 'metadata.district': 1, 'metadata.state': 1 });

// Virtual for formatted address
fieldLocationSchema.virtual('formattedAddress').get(function() {
  const parts = [];
  if (this.metadata.village) parts.push(this.metadata.village);
  if (this.metadata.taluka) parts.push(this.metadata.taluka);
  if (this.metadata.district) parts.push(this.metadata.district);
  if (this.metadata.state) parts.push(this.metadata.state);
  return parts.join(', ');
});

// Virtual for area in different units
fieldLocationSchema.virtual('areaInHectares').get(function() {
  if (this.area.unit === 'hectares') return this.area.value;
  if (this.area.unit === 'acres') return this.area.value * 0.404686;
  if (this.area.unit === 'sq_meters') return this.area.value / 10000;
  return this.area.value;
});

// Static method to find fields within radius
fieldLocationSchema.statics.findFieldsWithinRadius = async function(center, radiusKm, userId = null) {
  const query = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: center
        },
        $maxDistance: radiusKm * 1000 // Convert km to meters
      }
    }
  };
  
  if (userId) {
    query.userId = userId;
  }
  
  return this.find(query).populate('userId', 'name email');
};

// Static method to find fields by district
fieldLocationSchema.statics.findFieldsByDistrict = async function(district, state = null) {
  const query = { 'metadata.district': district };
  if (state) query['metadata.state'] = state;
  
  return this.find(query).populate('userId', 'name email');
};

// Instance method to calculate distance from another point
fieldLocationSchema.methods.distanceFrom = function(coordinates) {
  const R = 6371; // Earth's radius in kilometers
  const lat1 = this.location.coordinates[1];
  const lon1 = this.location.coordinates[0];
  const lat2 = coordinates[1];
  const lon2 = coordinates[0];
  
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Instance method to get weather data for this location
fieldLocationSchema.methods.getWeatherData = async function() {
  // This would integrate with a weather API
  // For now, return mock data
  return {
    temperature: 25 + Math.random() * 10,
    humidity: 60 + Math.random() * 20,
    rainfall: Math.random() * 50,
    windSpeed: Math.random() * 15,
    forecast: 'sunny'
  };
};

// Pre-save middleware to validate coordinates
fieldLocationSchema.pre('save', function(next) {
  if (this.location && this.location.coordinates) {
    const [lon, lat] = this.location.coordinates;
    if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
      return next(new Error('Invalid coordinates'));
    }
  }
  next();
});

module.exports = mongoose.model('FieldLocation', fieldLocationSchema); 