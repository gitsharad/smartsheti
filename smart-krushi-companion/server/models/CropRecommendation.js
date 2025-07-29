const mongoose = require('mongoose');

const cropRecommendationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  fieldId: {
    type: String,
    required: true,
    index: true
  },
  cropName: {
    type: String,
    required: true,
    enum: ['Rice', 'Wheat', 'Cotton', 'Sugarcane', 'Tomato', 'Onion', 'Potato', 'Maize', 'Pulses', 'Vegetables']
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  season: {
    type: String,
    enum: ['Kharif', 'Rabi', 'Zaid'],
    required: true
  },
  plantingDate: {
    type: Date,
    required: true
  },
  expectedYield: {
    type: Number,
    required: true
  },
  yieldUnit: {
    type: String,
    default: 'tons/ha'
  },
  soilConditions: {
    ph: { type: Number, min: 0, max: 14 },
    nitrogen: { type: Number, min: 0 },
    phosphorus: { type: Number, min: 0 },
    potassium: { type: Number, min: 0 },
    organicMatter: { type: Number, min: 0, max: 100 }
  },
  weatherConditions: {
    temperature: { type: Number },
    humidity: { type: Number, min: 0, max: 100 },
    rainfall: { type: Number, min: 0 },
    windSpeed: { type: Number, min: 0 }
  },
  marketConditions: {
    currentPrice: { type: Number, min: 0 },
    priceTrend: { type: String, enum: ['increasing', 'stable', 'decreasing'] },
    demandLevel: { type: String, enum: ['high', 'medium', 'low'] }
  },
  riskFactors: [{
    factor: { type: String },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
    probability: { type: Number, min: 0, max: 100 },
    mitigation: { type: String }
  }],
  recommendations: [{
    type: { type: String, enum: ['irrigation', 'fertilizer', 'pesticide', 'harvesting', 'storage'] },
    description: { type: String },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
    timeline: { type: String },
    cost: { type: Number, min: 0 }
  }],
  aiModel: {
    version: { type: String },
    accuracy: { type: Number, min: 0, max: 100 },
    lastUpdated: { type: Date, default: Date.now }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'implemented'],
    default: 'pending'
  },
  farmerFeedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String },
    implemented: { type: Boolean, default: false },
    actualYield: { type: Number },
    feedbackDate: { type: Date }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
cropRecommendationSchema.index({ userId: 1, createdAt: -1 });
cropRecommendationSchema.index({ fieldId: 1, season: 1 });
cropRecommendationSchema.index({ cropName: 1, confidence: -1 });
cropRecommendationSchema.index({ status: 1, createdAt: -1 });

// Virtual for time since recommendation
cropRecommendationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor(diff / 60000);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
});

// Static method to get recommendations by field
cropRecommendationSchema.statics.getFieldRecommendations = async function(fieldId, season = null) {
  const query = { fieldId };
  if (season) query.season = season;
  
  return this.find(query)
    .sort({ confidence: -1, createdAt: -1 })
    .populate('userId', 'name email');
};

// Static method to get top recommendations
cropRecommendationSchema.statics.getTopRecommendations = async function(userId, limit = 5) {
  return this.find({ userId, status: 'pending' })
    .sort({ confidence: -1 })
    .limit(limit)
    .populate('userId', 'name email');
};

// Instance method to calculate ROI
cropRecommendationSchema.methods.calculateROI = function() {
  if (!this.farmerFeedback.actualYield || !this.recommendations.length) {
    return null;
  }
  
  const totalCost = this.recommendations.reduce((sum, rec) => sum + (rec.cost || 0), 0);
  const revenue = this.farmerFeedback.actualYield * (this.marketConditions.currentPrice || 0);
  const profit = revenue - totalCost;
  
  return totalCost > 0 ? (profit / totalCost) * 100 : 0;
};

// Pre-save middleware to update AI model timestamp
cropRecommendationSchema.pre('save', function(next) {
  if (this.isModified('aiModel')) {
    this.aiModel.lastUpdated = new Date();
  }
  next();
});

module.exports = mongoose.model('CropRecommendation', cropRecommendationSchema); 