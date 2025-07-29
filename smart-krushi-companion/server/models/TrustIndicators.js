const mongoose = require('mongoose');

const trustIndicatorsSchema = new mongoose.Schema({
  // System-wide trust indicators
  systemMetrics: {
    uptime: {
      current: { type: Number, min: 0, max: 100, default: 99.9 },
      last24h: { type: Number, min: 0, max: 100 },
      last7d: { type: Number, min: 0, max: 100 },
      last30d: { type: Number, min: 0, max: 100 },
      lastUpdated: { type: Date, default: Date.now }
    },
    responseTime: {
      average: { type: Number, default: 200 }, // milliseconds
      p95: { type: Number, default: 500 },
      p99: { type: Number, default: 1000 },
      lastUpdated: { type: Date, default: Date.now }
    },
    dataAccuracy: {
      sensorData: { type: Number, min: 0, max: 100, default: 98 },
      aiPredictions: { type: Number, min: 0, max: 100, default: 92 },
      weatherData: { type: Number, min: 0, max: 100, default: 95 },
      lastUpdated: { type: Date, default: Date.now }
    },
    userSatisfaction: {
      overall: { type: Number, min: 1, max: 5, default: 4.5 },
      support: { type: Number, min: 1, max: 5, default: 4.3 },
      accuracy: { type: Number, min: 1, max: 5, default: 4.4 },
      easeOfUse: { type: Number, min: 1, max: 5, default: 4.2 },
      lastUpdated: { type: Date, default: Date.now }
    },
    securityIncidents: {
      total: { type: Number, default: 0 },
      last30d: { type: Number, default: 0 },
      severity: {
        low: { type: Number, default: 0 },
        medium: { type: Number, default: 0 },
        high: { type: Number, default: 0 },
        critical: { type: Number, default: 0 }
      },
      lastIncident: Date
    }
  },

  // Certifications and compliance
  certifications: [{
    name: {
      type: String,
      enum: ['ISO_27001', 'SOC_2_TYPE_II', 'GDPR_COMPLIANT', 'ISO_9001', 'ISO_14001', 'CUSTOM_DATA_PROTECTION', 'AGRI_TECH_CERTIFIED']
    },
    status: {
      type: String,
      enum: ['certified', 'in_progress', 'expired', 'suspended'],
      default: 'certified'
    },
    issuedDate: Date,
    expiryDate: Date,
    certifyingBody: String,
    certificateNumber: String,
    scope: String,
    auditReport: String, // URL to audit report
    nextAudit: Date,
    notes: String
  }],

  // Security audit results
  securityAudits: [{
    type: {
      type: String,
      enum: ['penetration_test', 'vulnerability_assessment', 'code_review', 'infrastructure_audit', 'compliance_audit']
    },
    conductedBy: String,
    conductedDate: Date,
    score: { type: Number, min: 0, max: 100 },
    grade: { type: String, enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'] },
    findings: [{
      severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
      description: String,
      remediation: String,
      status: { type: String, enum: ['open', 'in_progress', 'resolved', 'verified'] },
      dueDate: Date,
      resolvedDate: Date
    }],
    report: String, // URL to audit report
    nextAudit: Date
  }],

  // Privacy impact assessments
  privacyAssessments: [{
    assessmentDate: Date,
    assessor: String,
    scope: String,
    riskLevel: { type: String, enum: ['low', 'medium', 'high'] },
    findings: [{
      risk: String,
      impact: String,
      mitigation: String,
      status: { type: String, enum: ['identified', 'mitigating', 'resolved'] }
    }],
    recommendations: [String],
    nextAssessment: Date
  }],

  // Third-party validations
  thirdPartyValidations: [{
    validator: String,
    validationType: {
      type: String,
      enum: ['university_research', 'government_endorsement', 'industry_certification', 'expert_review', 'user_testimonial']
    },
    validationDate: Date,
    description: String,
    outcome: String,
    evidence: String, // URL to validation evidence
    validUntil: Date
  }],

  // User testimonials and reviews
  userTestimonials: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: { type: Number, min: 1, max: 5 },
    review: String,
    category: {
      type: String,
      enum: ['overall', 'accuracy', 'support', 'ease_of_use', 'value', 'trust']
    },
    verified: { type: Boolean, default: false },
    helpful: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now },
    location: String,
    farmingType: String
  }],

  // Performance benchmarks
  benchmarks: [{
    category: {
      type: String,
      enum: ['data_accuracy', 'response_time', 'uptime', 'user_satisfaction', 'security', 'privacy']
    },
    metric: String,
    value: Number,
    unit: String,
    benchmark: Number, // Industry standard
    percentile: Number, // Where we rank
    lastUpdated: { type: Date, default: Date.now }
  }],

  // Trust badges and achievements
  trustBadges: [{
    name: String,
    category: {
      type: String,
      enum: ['security', 'privacy', 'performance', 'compliance', 'user_satisfaction', 'innovation']
    },
    earnedDate: Date,
    validUntil: Date,
    criteria: [String],
    evidence: String,
    displayOrder: Number
  }],

  // Social impact metrics
  socialImpact: {
    farmersServed: { type: Number, default: 0 },
    yieldImprovement: { type: Number, default: 0 }, // percentage
    costSavings: { type: Number, default: 0 }, // in currency
    waterSaved: { type: Number, default: 0 }, // in liters
    carbonReduction: { type: Number, default: 0 }, // in kg CO2
    lastUpdated: { type: Date, default: Date.now }
  },

  // Transparency commitments
  transparencyCommitments: [{
    commitment: String,
    status: { type: String, enum: ['committed', 'in_progress', 'achieved', 'monitoring'] },
    targetDate: Date,
    achievedDate: Date,
    evidence: String,
    nextReview: Date
  }]
}, {
  timestamps: true
});

// Indexes for performance
trustIndicatorsSchema.index({ 'certifications.status': 1, 'certifications.expiryDate': 1 });
trustIndicatorsSchema.index({ 'securityAudits.conductedDate': -1 });
trustIndicatorsSchema.index({ 'userTestimonials.timestamp': -1 });

// Methods for trust indicator operations
trustIndicatorsSchema.methods.updateSystemMetrics = function(metrics) {
  this.systemMetrics = {
    ...this.systemMetrics,
    ...metrics,
    lastUpdated: new Date()
  };
};

trustIndicatorsSchema.methods.addCertification = function(certification) {
  this.certifications.push({
    ...certification,
    issuedDate: certification.issuedDate || new Date()
  });
};

trustIndicatorsSchema.methods.addSecurityAudit = function(audit) {
  this.securityAudits.push({
    ...audit,
    conductedDate: audit.conductedDate || new Date()
  });
};

trustIndicatorsSchema.methods.addUserTestimonial = function(testimonial) {
  this.userTestimonials.push({
    ...testimonial,
    timestamp: new Date()
  });
};

trustIndicatorsSchema.methods.updateBenchmark = function(category, metric, value, unit, benchmark) {
  const existingBenchmark = this.benchmarks.find(b => b.category === category && b.metric === metric);
  
  if (existingBenchmark) {
    existingBenchmark.value = value;
    existingBenchmark.unit = unit;
    existingBenchmark.benchmark = benchmark;
    existingBenchmark.percentile = (value / benchmark) * 100;
    existingBenchmark.lastUpdated = new Date();
  } else {
    this.benchmarks.push({
      category,
      metric,
      value,
      unit,
      benchmark,
      percentile: (value / benchmark) * 100,
      lastUpdated: new Date()
    });
  }
};

// Static methods for trust reporting
trustIndicatorsSchema.statics.getTrustDashboard = async function() {
  const indicators = await this.findOne();
  if (!indicators) return null;

  const dashboard = {
    systemHealth: {
      uptime: indicators.systemMetrics.uptime.current,
      responseTime: indicators.systemMetrics.responseTime.average,
      dataAccuracy: indicators.systemMetrics.dataAccuracy.sensorData,
      userSatisfaction: indicators.systemMetrics.userSatisfaction.overall
    },
    security: {
      incidents: indicators.systemMetrics.securityIncidents.total,
      lastIncident: indicators.systemMetrics.securityIncidents.lastIncident,
      certifications: indicators.certifications.filter(c => c.status === 'certified').length
    },
    compliance: {
      gdpr: indicators.certifications.some(c => c.name === 'GDPR_COMPLIANT' && c.status === 'certified'),
      iso27001: indicators.certifications.some(c => c.name === 'ISO_27001' && c.status === 'certified'),
      soc2: indicators.certifications.some(c => c.name === 'SOC_2_TYPE_II' && c.status === 'certified')
    },
    userTrust: {
      averageRating: indicators.userTestimonials.reduce((sum, t) => sum + t.rating, 0) / indicators.userTestimonials.length,
      totalReviews: indicators.userTestimonials.length,
      verifiedReviews: indicators.userTestimonials.filter(t => t.verified).length
    },
    socialImpact: indicators.socialImpact,
    recentAudits: indicators.securityAudits
      .sort((a, b) => b.conductedDate - a.conductedDate)
      .slice(0, 3)
  };

  return dashboard;
};

trustIndicatorsSchema.statics.getCertificationStatus = async function() {
  const indicators = await this.findOne();
  if (!indicators) return [];

  return indicators.certifications.map(cert => ({
    name: cert.name,
    status: cert.status,
    issuedDate: cert.issuedDate,
    expiryDate: cert.expiryDate,
    daysUntilExpiry: cert.expiryDate ? Math.ceil((cert.expiryDate - new Date()) / (1000 * 60 * 60 * 24)) : null
  }));
};

trustIndicatorsSchema.statics.getSecurityScore = async function() {
  const indicators = await this.findOne();
  if (!indicators) return null;

  const recentAudits = indicators.securityAudits
    .filter(audit => audit.conductedDate > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))
    .sort((a, b) => b.conductedDate - a.conductedDate);

  if (recentAudits.length === 0) return null;

  const latestAudit = recentAudits[0];
  const openFindings = latestAudit.findings.filter(f => f.status === 'open' || f.status === 'in_progress');
  
  let score = latestAudit.score;
  
  // Penalize for open critical/high findings
  score -= openFindings.filter(f => f.severity === 'critical').length * 20;
  score -= openFindings.filter(f => f.severity === 'high').length * 10;
  
  return Math.max(0, Math.min(100, score));
};

const TrustIndicators = mongoose.model('TrustIndicators', trustIndicatorsSchema);

module.exports = TrustIndicators; 