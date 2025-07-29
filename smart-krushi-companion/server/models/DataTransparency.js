const mongoose = require('mongoose');

const dataTransparencySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Data collection tracking
  dataCollection: {
    personalInfo: {
      collected: { type: Boolean, default: false },
      lastUpdated: Date,
      fields: [String], // ['name', 'email', 'phone', 'location']
      purpose: String,
      retentionPeriod: Number // in days
    },
    sensorData: {
      collected: { type: Boolean, default: false },
      lastUpdated: Date,
      fields: [String], // ['moisture', 'temperature', 'location']
      purpose: String,
      retentionPeriod: Number
    },
    locationData: {
      collected: { type: Boolean, default: false },
      lastUpdated: Date,
      precision: String, // 'exact', 'approximate', 'general'
      purpose: String,
      retentionPeriod: Number
    },
    deviceInfo: {
      collected: { type: Boolean, default: false },
      lastUpdated: Date,
      fields: [String], // ['deviceId', 'appVersion', 'osVersion']
      purpose: String,
      retentionPeriod: Number
    },
    usageData: {
      collected: { type: Boolean, default: false },
      lastUpdated: Date,
      fields: [String], // ['loginTimes', 'featureUsage', 'preferences']
      purpose: String,
      retentionPeriod: Number
    }
  },

  // Data usage tracking
  dataUsage: [{
    category: {
      type: String,
      enum: ['analytics', 'recommendations', 'notifications', 'support', 'research', 'marketing']
    },
    description: String,
    timestamp: { type: Date, default: Date.now },
    dataTypes: [String],
    purpose: String,
    legalBasis: String, // 'consent', 'legitimate_interest', 'contract', 'legal_obligation'
    automated: { type: Boolean, default: false }
  }],

  // Third-party sharing
  thirdPartySharing: [{
    recipient: String,
    purpose: String,
    dataTypes: [String],
    timestamp: { type: Date, default: Date.now },
    legalBasis: String,
    dataProtection: String, // 'encryption', 'anonymization', 'pseudonymization'
    retentionPeriod: Number,
    country: String,
    safeguards: [String]
  }],

  // User consent tracking
  consents: [{
    type: {
      type: String,
      enum: ['data_collection', 'data_processing', 'third_party_sharing', 'marketing', 'analytics']
    },
    status: {
      type: String,
      enum: ['granted', 'denied', 'withdrawn'],
      default: 'granted'
    },
    timestamp: { type: Date, default: Date.now },
    version: String,
    description: String,
    granular: {
      personalInfo: { type: Boolean, default: false },
      sensorData: { type: Boolean, default: false },
      locationData: { type: Boolean, default: false },
      deviceInfo: { type: Boolean, default: false },
      usageData: { type: Boolean, default: false }
    }
  }],

  // Data access requests
  accessRequests: [{
    type: {
      type: String,
      enum: ['access', 'portability', 'correction', 'deletion', 'objection']
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'rejected'],
      default: 'pending'
    },
    requestedAt: { type: Date, default: Date.now },
    completedAt: Date,
    description: String,
    dataProvided: [String],
    notes: String
  }],

  // Data retention policies
  retentionPolicies: {
    personalInfo: {
      retentionPeriod: { type: Number, default: 2555 }, // 7 years
      deletionTrigger: String, // 'account_deletion', 'inactivity', 'consent_withdrawal'
      anonymization: { type: Boolean, default: true }
    },
    sensorData: {
      retentionPeriod: { type: Number, default: 1095 }, // 3 years
      deletionTrigger: String,
      aggregation: { type: Boolean, default: true }
    },
    locationData: {
      retentionPeriod: { type: Number, default: 365 }, // 1 year
      deletionTrigger: String,
      anonymization: { type: Boolean, default: true }
    },
    usageData: {
      retentionPeriod: { type: Number, default: 730 }, // 2 years
      deletionTrigger: String,
      aggregation: { type: Boolean, default: true }
    }
  },

  // Privacy settings
  privacySettings: {
    dataSharing: {
      analytics: { type: Boolean, default: true },
      research: { type: Boolean, default: false },
      marketing: { type: Boolean, default: false },
      thirdParty: { type: Boolean, default: false }
    },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      alerts: { type: Boolean, default: true }
    },
    locationTracking: {
      enabled: { type: Boolean, default: true },
      precision: { type: String, enum: ['exact', 'approximate', 'general'], default: 'approximate' }
    },
    dataProcessing: {
      automated: { type: Boolean, default: true },
      profiling: { type: Boolean, default: false },
      aiRecommendations: { type: Boolean, default: true }
    }
  },

  // Audit trail
  auditTrail: [{
    action: {
      type: String,
      enum: ['consent_granted', 'consent_withdrawn', 'data_accessed', 'data_shared', 'data_deleted', 'settings_changed']
    },
    timestamp: { type: Date, default: Date.now },
    description: String,
    dataTypes: [String],
    ipAddress: String,
    userAgent: String,
    sessionId: String
  }],

  // Data quality metrics
  dataQuality: {
    accuracy: { type: Number, min: 0, max: 100, default: 95 },
    completeness: { type: Number, min: 0, max: 100, default: 90 },
    consistency: { type: Number, min: 0, max: 100, default: 92 },
    timeliness: { type: Number, min: 0, max: 100, default: 88 },
    lastAssessed: { type: Date, default: Date.now }
  },

  // Compliance tracking
  compliance: {
    gdpr: {
      compliant: { type: Boolean, default: true },
      lastAssessment: { type: Date, default: Date.now },
      issues: [String],
      remediation: [String]
    },
    dataProtection: {
      certified: { type: Boolean, default: false },
      certification: String,
      validUntil: Date,
      auditor: String
    },
    security: {
      lastAudit: Date,
      vulnerabilities: [String],
      remediation: [String],
      nextAudit: Date
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
dataTransparencySchema.index({ userId: 1, 'auditTrail.timestamp': -1 });
dataTransparencySchema.index({ 'consents.timestamp': -1 });
dataTransparencySchema.index({ 'accessRequests.status': 1, 'accessRequests.requestedAt': -1 });

// Methods for data transparency operations
dataTransparencySchema.methods.updateDataCollection = function(category, fields, purpose) {
  if (this.dataCollection[category]) {
    this.dataCollection[category].collected = true;
    this.dataCollection[category].lastUpdated = new Date();
    this.dataCollection[category].fields = fields;
    this.dataCollection[category].purpose = purpose;
  }
};

dataTransparencySchema.methods.recordDataUsage = function(category, description, dataTypes, purpose, legalBasis) {
  this.dataUsage.push({
    category,
    description,
    dataTypes,
    purpose,
    legalBasis,
    timestamp: new Date()
  });
};

dataTransparencySchema.methods.recordConsent = function(type, status, description, granular) {
  this.consents.push({
    type,
    status,
    description,
    granular,
    timestamp: new Date(),
    version: '1.0'
  });
};

dataTransparencySchema.methods.createAccessRequest = function(type, description) {
  this.accessRequests.push({
    type,
    description,
    requestedAt: new Date()
  });
};

dataTransparencySchema.methods.recordAuditTrail = function(action, description, dataTypes, req) {
  this.auditTrail.push({
    action,
    description,
    dataTypes,
    ipAddress: req?.ip,
    userAgent: req?.get('User-Agent'),
    sessionId: req?.sessionId,
    timestamp: new Date()
  });
};

// Static methods for transparency reporting
dataTransparencySchema.statics.generateTransparencyReport = async function(userId) {
  const transparency = await this.findOne({ userId });
  if (!transparency) return null;

  const report = {
    dataCollection: {
      summary: {},
      details: transparency.dataCollection
    },
    dataUsage: {
      summary: transparency.dataUsage.reduce((acc, usage) => {
        acc[usage.category] = (acc[usage.category] || 0) + 1;
        return acc;
      }, {}),
      details: transparency.dataUsage
    },
    thirdPartySharing: {
      summary: transparency.thirdPartySharing.length,
      details: transparency.thirdPartySharing
    },
    consents: {
      summary: transparency.consents.reduce((acc, consent) => {
        acc[consent.status] = (acc[consent.status] || 0) + 1;
        return acc;
      }, {}),
      details: transparency.consents
    },
    accessRequests: {
      summary: transparency.accessRequests.reduce((acc, request) => {
        acc[request.status] = (acc[request.status] || 0) + 1;
        return acc;
      }, {}),
      details: transparency.accessRequests
    },
    dataQuality: transparency.dataQuality,
    compliance: transparency.compliance,
    privacySettings: transparency.privacySettings
  };

  return report;
};

dataTransparencySchema.statics.getDataPortability = async function(userId) {
  const transparency = await this.findOne({ userId });
  if (!transparency) return null;

  // This would integrate with actual data export functionality
  return {
    personalInfo: transparency.dataCollection.personalInfo.collected,
    sensorData: transparency.dataCollection.sensorData.collected,
    locationData: transparency.dataCollection.locationData.collected,
    usageData: transparency.dataCollection.usageData.collected,
    consents: transparency.consents,
    privacySettings: transparency.privacySettings
  };
};

const DataTransparency = mongoose.model('DataTransparency', dataTransparencySchema);

module.exports = DataTransparency; 