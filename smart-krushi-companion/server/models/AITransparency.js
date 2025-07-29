const mongoose = require('mongoose');

const aiTransparencySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  fieldId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Field',
    index: true
  },

  // AI decision tracking
  decisions: [{
    type: {
      type: String,
      enum: ['crop_recommendation', 'disease_detection', 'irrigation_schedule', 'fertilizer_recommendation', 'yield_prediction', 'weather_analysis']
    },
    timestamp: { type: Date, default: Date.now },
    input: {
      sensorData: Object,
      weatherData: Object,
      soilData: Object,
      historicalData: Object,
      userPreferences: Object
    },
    output: {
      recommendation: String,
      confidence: { type: Number, min: 0, max: 100 },
      alternatives: [{
        option: String,
        confidence: Number,
        reasoning: String
      }],
      riskFactors: [{
        factor: String,
        impact: { type: String, enum: ['low', 'medium', 'high'] },
        description: String
      }]
    },
    explanation: {
      factors: [{
        name: String,
        weight: Number,
        description: String,
        impact: String
      }],
      reasoning: String,
      assumptions: [String],
      limitations: [String],
      dataSources: [String]
    },
    model: {
      name: String,
      version: String,
      accuracy: Number,
      lastUpdated: Date,
      trainingData: {
        size: Number,
        sources: [String],
        lastUpdated: Date
      }
    },
    userFeedback: {
      helpful: Boolean,
      implemented: Boolean,
      outcome: String,
      feedbackDate: Date
    }
  }],

  // Model performance tracking
  modelPerformance: [{
    modelName: String,
    version: String,
    metrics: {
      accuracy: Number,
      precision: Number,
      recall: Number,
      f1Score: Number,
      confusionMatrix: Object
    },
    evaluationDate: Date,
    testDataSize: Number,
    performanceNotes: String
  }],

  // Bias detection and mitigation
  biasAnalysis: [{
    timestamp: Date,
    modelName: String,
    biasType: {
      type: String,
      enum: ['demographic', 'geographic', 'temporal', 'data_quality', 'algorithmic']
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    },
    description: String,
    affectedGroups: [String],
    mitigationStrategy: String,
    status: {
      type: String,
      enum: ['detected', 'mitigating', 'resolved', 'monitoring']
    }
  }],

  // Data quality for AI
  dataQuality: {
    sensorData: {
      completeness: { type: Number, min: 0, max: 100 },
      accuracy: { type: Number, min: 0, max: 100 },
      timeliness: { type: Number, min: 0, max: 100 },
      consistency: { type: Number, min: 0, max: 100 },
      lastAssessed: Date
    },
    weatherData: {
      completeness: { type: Number, min: 0, max: 100 },
      accuracy: { type: Number, min: 0, max: 100 },
      timeliness: { type: Number, min: 0, max: 100 },
      consistency: { type: Number, min: 0, max: 100 },
      lastAssessed: Date
    },
    soilData: {
      completeness: { type: Number, min: 0, max: 100 },
      accuracy: { type: Number, min: 0, max: 100 },
      timeliness: { type: Number, min: 0, max: 100 },
      consistency: { type: Number, min: 0, max: 100 },
      lastAssessed: Date
    }
  },

  // Explainability features
  explainability: {
    featureImportance: [{
      feature: String,
      importance: Number,
      description: String,
      category: String
    }],
    decisionPaths: [{
      path: [String],
      confidence: Number,
      reasoning: String
    }],
    counterfactuals: [{
      originalInput: Object,
      modifiedInput: Object,
      originalOutput: String,
      modifiedOutput: String,
      explanation: String
    }]
  },

  // User understanding and trust
  userTrust: {
    overallTrust: { type: Number, min: 1, max: 5 },
    transparencyRating: { type: Number, min: 1, max: 5 },
    accuracyRating: { type: Number, min: 1, max: 5 },
    helpfulnessRating: { type: Number, min: 1, max: 5 },
    lastUpdated: Date,
    feedbackHistory: [{
      decisionId: mongoose.Schema.Types.ObjectId,
      trustLevel: Number,
      comments: String,
      timestamp: Date
    }]
  },

  // Compliance and auditing
  compliance: {
    explainability: {
      compliant: { type: Boolean, default: true },
      methods: [String], // ['feature_importance', 'decision_paths', 'counterfactuals']
      documentation: String
    },
    fairness: {
      compliant: { type: Boolean, default: true },
      metrics: [String], // ['demographic_parity', 'equalized_odds', 'individual_fairness']
      assessment: String
    },
    privacy: {
      compliant: { type: Boolean, default: true },
      methods: [String], // ['differential_privacy', 'federated_learning', 'data_minimization']
      assessment: String
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
aiTransparencySchema.index({ userId: 1, 'decisions.timestamp': -1 });
aiTransparencySchema.index({ fieldId: 1, 'decisions.type': 1 });
aiTransparencySchema.index({ 'decisions.type': 1, 'decisions.timestamp': -1 });

// Methods for AI transparency operations
aiTransparencySchema.methods.recordDecision = function(decisionData) {
  this.decisions.push({
    ...decisionData,
    timestamp: new Date()
  });
};

aiTransparencySchema.methods.updateModelPerformance = function(performanceData) {
  this.modelPerformance.push({
    ...performanceData,
    evaluationDate: new Date()
  });
};

aiTransparencySchema.methods.recordBiasAnalysis = function(biasData) {
  this.biasAnalysis.push({
    ...biasData,
    timestamp: new Date()
  });
};

aiTransparencySchema.methods.updateUserTrust = function(trustData) {
  this.userTrust = {
    ...this.userTrust,
    ...trustData,
    lastUpdated: new Date()
  };
};

// Static methods for AI transparency reporting
aiTransparencySchema.statics.generateAITransparencyReport = async function(userId, fieldId = null) {
  const query = { userId };
  if (fieldId) query.fieldId = fieldId;
  
  const transparency = await this.findOne(query);
  if (!transparency) return null;

  const report = {
    decisionSummary: {
      total: transparency.decisions.length,
      byType: transparency.decisions.reduce((acc, decision) => {
        acc[decision.type] = (acc[decision.type] || 0) + 1;
        return acc;
      }, {}),
      averageConfidence: transparency.decisions.reduce((sum, decision) => 
        sum + decision.output.confidence, 0) / transparency.decisions.length
    },
    modelPerformance: transparency.modelPerformance,
    biasAnalysis: transparency.biasAnalysis,
    dataQuality: transparency.dataQuality,
    userTrust: transparency.userTrust,
    compliance: transparency.compliance,
    recentDecisions: transparency.decisions
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10)
  };

  return report;
};

aiTransparencySchema.statics.getDecisionExplanation = async function(decisionId) {
  const transparency = await this.findOne({
    'decisions._id': decisionId
  });
  
  if (!transparency) return null;
  
  const decision = transparency.decisions.id(decisionId);
  if (!decision) return null;

  return {
    decision: decision,
    explanation: decision.explanation,
    model: decision.model,
    userFeedback: decision.userFeedback
  };
};

aiTransparencySchema.statics.getModelAccuracy = async function(modelName) {
  const transparency = await this.findOne({
    'modelPerformance.modelName': modelName
  });
  
  if (!transparency) return null;
  
  const modelPerf = transparency.modelPerformance
    .filter(perf => perf.modelName === modelName)
    .sort((a, b) => b.evaluationDate - a.evaluationDate)[0];
  
  return modelPerf?.metrics || null;
};

aiTransparencySchema.statics.getBiasReport = async function() {
  const biasReports = await this.aggregate([
    { $unwind: '$biasAnalysis' },
    {
      $group: {
        _id: '$biasAnalysis.biasType',
        count: { $sum: 1 },
        severity: { $push: '$biasAnalysis.severity' },
        status: { $push: '$biasAnalysis.status' }
      }
    }
  ]);

  return biasReports;
};

const AITransparency = mongoose.model('AITransparency', aiTransparencySchema);

module.exports = AITransparency; 