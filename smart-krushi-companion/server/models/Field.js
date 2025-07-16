const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  // Basic field information
  name: {
    type: String,
    required: [true, 'Field name is required'],
    trim: true
  },
  fieldId: {
    type: String,
    required: [true, 'Field ID is required'],
    unique: true,
    trim: true
  },
  
  // Ownership and management
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['manager', 'worker', 'viewer'],
      default: 'viewer'
    },
    assignedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Location and physical details
  location: {
    coordinates: {
      lat: {
        type: Number,
        required: true
      },
      lng: {
        type: Number,
        required: true
      }
    },
    address: {
      state: String,
      district: String,
      village: String,
      pincode: String,
      fullAddress: String
    },
    area: {
      value: {
        type: Number,
        required: true
      },
      unit: {
        type: String,
        enum: ['acres', 'hectares', 'sq_meters'],
        default: 'acres'
      }
    }
  },
  
  // Soil and environmental information
  soilInfo: {
    type: {
      type: String,
      enum: ['black', 'red', 'laterite', 'alluvial', 'mountain', 'desert', 'other']
    },
    ph: Number,
    organicMatter: Number,
    nitrogen: Number,
    phosphorus: Number,
    potassium: Number,
    lastTested: Date
  },
  
  // Current crop information
  currentCrop: {
    name: String,
    variety: String,
    plantedDate: Date,
    expectedHarvest: Date,
    status: {
      type: String,
      enum: ['planning', 'prepared', 'planted', 'growing', 'flowering', 'fruiting', 'harvested', 'fallow'],
      default: 'planning'
    },
    yield: {
      expected: Number,
      actual: Number,
      unit: {
        type: String,
        enum: ['kg', 'quintal', 'ton'],
        default: 'kg'
      }
    }
  },
  
  // Sensor configuration
  sensors: [{
    sensorId: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['moisture', 'temperature', 'humidity', 'ph', 'nitrogen', 'weather'],
      required: true
    },
    location: {
      lat: Number,
      lng: Number
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'maintenance', 'offline'],
      default: 'active'
    },
    lastReading: {
      value: Number,
      timestamp: Date
    },
    installationDate: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Irrigation system
  irrigation: {
    type: {
      type: String,
      enum: ['drip', 'sprinkler', 'flood', 'manual', 'none', 'canal'],
      default: 'manual'
    },
    automation: {
      type: Boolean,
      default: false
    },
    schedule: {
      frequency: String,
      duration: Number,
      timeSlots: [String]
    }
  },
  
  // Field status and activity
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'harvested'],
    default: 'active'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Historical data
  cropHistory: [{
    crop: String,
    variety: String,
    season: String,
    plantedDate: Date,
    harvestedDate: Date,
    yield: Number,
    yieldUnit: String,
    notes: String
  }],
  
  // Financial information
  financial: {
    investment: {
      seeds: Number,
      fertilizers: Number,
      pesticides: Number,
      labor: Number,
      irrigation: Number,
      other: Number
    },
    revenue: {
      expected: Number,
      actual: Number
    },
    profit: Number
  },
  
  // Notes and documentation
  notes: [{
    content: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['general', 'alert', 'recommendation', 'maintenance'],
      default: 'general'
    }
  }],
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for performance
fieldSchema.index({ owner: 1 });
fieldSchema.index({ 'assignedTo.user': 1 });
fieldSchema.index({ fieldId: 1 });
fieldSchema.index({ 'location.coordinates': '2dsphere' });
fieldSchema.index({ status: 1, isVerified: 1 });
fieldSchema.index({ 'currentCrop.status': 1 });

// Virtual for total area in acres
fieldSchema.virtual('areaInAcres').get(function() {
  if (this.location.area.unit === 'acres') {
    return this.location.area.value;
  } else if (this.location.area.unit === 'hectares') {
    return this.location.area.value * 2.471; // Convert hectares to acres
  } else if (this.location.area.unit === 'sq_meters') {
    return this.location.area.value * 0.000247; // Convert sq meters to acres
  }
  return this.location.area.value;
});

// Method to check if user can access this field
fieldSchema.methods.canUserAccess = function(userId, userRole) {
  // Admin can access all fields
  if (userRole === 'admin') return true;
  
  // Owner can access their own fields
  if (this.owner.toString() === userId.toString()) return true;
  
  // Check if user is assigned to this field
  const assignment = this.assignedTo.find(a => a.user.toString() === userId.toString());
  return !!assignment;
};

// Method to get field summary
fieldSchema.methods.getSummary = function() {
  return {
    id: this._id,
    fieldId: this.fieldId,
    name: this.name,
    area: this.areaInAcres,
    location: this.location.address,
    currentCrop: this.currentCrop,
    status: this.status,
    sensorCount: this.sensors.filter(s => s.status === 'active').length,
    lastActivity: this.updatedAt
  };
};

// Pre-save middleware to update lastUpdatedBy
fieldSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastUpdatedBy = this.owner; // This will be updated by the controller
  }
  next();
});

const Field = mongoose.model('Field', fieldSchema);

module.exports = Field; 