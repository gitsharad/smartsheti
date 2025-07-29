const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const { logger } = require('../utils/logger');

// Import models
const DataTransparency = require('../models/DataTransparency');
const AITransparency = require('../models/AITransparency');
const TrustIndicators = require('../models/TrustIndicators');

// Get trust dashboard data
router.get('/dashboard', auth, async (req, res) => {
  try {
    const trustDashboard = await TrustIndicators.getTrustDashboard();
    
    res.json({
      success: true,
      data: trustDashboard,
      message: {
        english: 'Trust dashboard data retrieved successfully',
        marathi: 'ट्रस्ट डॅशबोर्ड डेटा यशस्वीरित्या मिळवला'
      }
    });
  } catch (error) {
    logger.error('Error fetching trust dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trust dashboard',
      message: {
        english: 'Failed to fetch trust dashboard data',
        marathi: 'ट्रस्ट डॅशबोर्ड डेटा मिळवण्यात अयशस्वी'
      }
    });
  }
});

// Get data transparency report for user
router.get('/transparency/report', auth, async (req, res) => {
  try {
    const transparencyReport = await DataTransparency.generateTransparencyReport(req.user._id);
    
    if (!transparencyReport) {
      return res.status(404).json({
        success: false,
        error: 'Transparency report not found',
        message: {
          english: 'No transparency data found for this user',
          marathi: 'या वापरकर्त्यासाठी पारदर्शकता डेटा सापडला नाही'
        }
      });
    }
    
    res.json({
      success: true,
      data: transparencyReport,
      message: {
        english: 'Transparency report retrieved successfully',
        marathi: 'पारदर्शकता अहवाल यशस्वीरित्या मिळवला'
      }
    });
  } catch (error) {
    logger.error('Error fetching transparency report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transparency report',
      message: {
        english: 'Failed to fetch transparency report',
        marathi: 'पारदर्शकता अहवाल मिळवण्यात अयशस्वी'
      }
    });
  }
});

// Get AI transparency report
router.get('/ai-transparency/report', auth, async (req, res) => {
  try {
    const { fieldId } = req.query;
    const aiTransparencyReport = await AITransparency.generateAITransparencyReport(
      req.user._id, 
      fieldId
    );
    
    if (!aiTransparencyReport) {
      return res.status(404).json({
        success: false,
        error: 'AI transparency report not found',
        message: {
          english: 'No AI transparency data found',
          marathi: 'AI पारदर्शकता डेटा सापडला नाही'
        }
      });
    }
    
    res.json({
      success: true,
      data: aiTransparencyReport,
      message: {
        english: 'AI transparency report retrieved successfully',
        marathi: 'AI पारदर्शकता अहवाल यशस्वीरित्या मिळवला'
      }
    });
  } catch (error) {
    logger.error('Error fetching AI transparency report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch AI transparency report',
      message: {
        english: 'Failed to fetch AI transparency report',
        marathi: 'AI पारदर्शकता अहवाल मिळवण्यात अयशस्वी'
      }
    });
  }
});

// Get specific AI decision explanation
router.get('/ai-transparency/decision/:decisionId', auth, async (req, res) => {
  try {
    const { decisionId } = req.params;
    const decisionExplanation = await AITransparency.getDecisionExplanation(decisionId);
    
    if (!decisionExplanation) {
      return res.status(404).json({
        success: false,
        error: 'Decision explanation not found',
        message: {
          english: 'No explanation found for this decision',
          marathi: 'या निर्णयासाठी कोणताही स्पष्टीकरण सापडला नाही'
        }
      });
    }
    
    res.json({
      success: true,
      data: decisionExplanation,
      message: {
        english: 'Decision explanation retrieved successfully',
        marathi: 'निर्णय स्पष्टीकरण यशस्वीरित्या मिळवला'
      }
    });
  } catch (error) {
    logger.error('Error fetching decision explanation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch decision explanation',
      message: {
        english: 'Failed to fetch decision explanation',
        marathi: 'निर्णय स्पष्टीकरण मिळवण्यात अयशस्वी'
      }
    });
  }
});

// Get data portability information
router.get('/data-portability', auth, async (req, res) => {
  try {
    const dataPortability = await DataTransparency.getDataPortability(req.user._id);
    
    if (!dataPortability) {
      return res.status(404).json({
        success: false,
        error: 'Data portability information not found',
        message: {
          english: 'No data portability information found',
          marathi: 'डेटा पोर्टेबिलिटी माहिती सापडली नाही'
        }
      });
    }
    
    res.json({
      success: true,
      data: dataPortability,
      message: {
        english: 'Data portability information retrieved successfully',
        marathi: 'डेटा पोर्टेबिलिटी माहिती यशस्वीरित्या मिळवली'
      }
    });
  } catch (error) {
    logger.error('Error fetching data portability:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch data portability',
      message: {
        english: 'Failed to fetch data portability information',
        marathi: 'डेटा पोर्टेबिलिटी माहिती मिळवण्यात अयशस्वी'
      }
    });
  }
});

// Create data access request
router.post('/data-access-request', auth, async (req, res) => {
  try {
    const { type, description } = req.body;
    
    let transparency = await DataTransparency.findOne({ userId: req.user._id });
    
    if (!transparency) {
      transparency = new DataTransparency({ userId: req.user._id });
    }
    
    transparency.createAccessRequest(type, description);
    await transparency.save();
    
    res.json({
      success: true,
      message: {
        english: 'Data access request created successfully',
        marathi: 'डेटा प्रवेश विनंती यशस्वीरित्या तयार केली'
      }
    });
  } catch (error) {
    logger.error('Error creating data access request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create data access request',
      message: {
        english: 'Failed to create data access request',
        marathi: 'डेटा प्रवेश विनंती तयार करण्यात अयशस्वी'
      }
    });
  }
});

// Update privacy settings
router.put('/privacy-settings', auth, async (req, res) => {
  try {
    const { privacySettings } = req.body;
    
    let transparency = await DataTransparency.findOne({ userId: req.user._id });
    
    if (!transparency) {
      transparency = new DataTransparency({ userId: req.user._id });
    }
    
    transparency.privacySettings = {
      ...transparency.privacySettings,
      ...privacySettings
    };
    
    transparency.recordAuditTrail('settings_changed', 'Privacy settings updated', ['privacy_settings'], req);
    await transparency.save();
    
    res.json({
      success: true,
      message: {
        english: 'Privacy settings updated successfully',
        marathi: 'गोपनीयता सेटिंग्ज यशस्वीरित्या अद्ययावत केल्या'
      }
    });
  } catch (error) {
    logger.error('Error updating privacy settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update privacy settings',
      message: {
        english: 'Failed to update privacy settings',
        marathi: 'गोपनीयता सेटिंग्ज अद्ययावत करण्यात अयशस्वी'
      }
    });
  }
});

// Get certification status
router.get('/certifications', async (req, res) => {
  try {
    const certifications = await TrustIndicators.getCertificationStatus();
    
    res.json({
      success: true,
      data: certifications,
      message: {
        english: 'Certification status retrieved successfully',
        marathi: 'प्रमाणपत्र स्थिती यशस्वीरित्या मिळवली'
      }
    });
  } catch (error) {
    logger.error('Error fetching certification status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch certification status',
      message: {
        english: 'Failed to fetch certification status',
        marathi: 'प्रमाणपत्र स्थिती मिळवण्यात अयशस्वी'
      }
    });
  }
});

// Get security score
router.get('/security-score', async (req, res) => {
  try {
    const securityScore = await TrustIndicators.getSecurityScore();
    
    res.json({
      success: true,
      data: { securityScore },
      message: {
        english: 'Security score retrieved successfully',
        marathi: 'सुरक्षा स्कोअर यशस्वीरित्या मिळवला'
      }
    });
  } catch (error) {
    logger.error('Error fetching security score:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch security score',
      message: {
        english: 'Failed to fetch security score',
        marathi: 'सुरक्षा स्कोअर मिळवण्यात अयशस्वी'
      }
    });
  }
});

// Get bias report
router.get('/bias-report', auth, authorize('admin', 'coordinator'), async (req, res) => {
  try {
    const biasReport = await AITransparency.getBiasReport();
    
    res.json({
      success: true,
      data: biasReport,
      message: {
        english: 'Bias report retrieved successfully',
        marathi: 'पक्षपात अहवाल यशस्वीरित्या मिळवला'
      }
    });
  } catch (error) {
    logger.error('Error fetching bias report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bias report',
      message: {
        english: 'Failed to fetch bias report',
        marathi: 'पक्षपात अहवाल मिळवण्यात अयशस्वी'
      }
    });
  }
});

// Record AI decision (for internal use)
router.post('/record-ai-decision', auth, async (req, res) => {
  try {
    const { fieldId, decisionData } = req.body;
    
    let aiTransparency = await AITransparency.findOne({ 
      userId: req.user._id, 
      fieldId: fieldId 
    });
    
    if (!aiTransparency) {
      aiTransparency = new AITransparency({ 
        userId: req.user._id, 
        fieldId: fieldId 
      });
    }
    
    aiTransparency.recordDecision(decisionData);
    await aiTransparency.save();
    
    res.json({
      success: true,
      message: {
        english: 'AI decision recorded successfully',
        marathi: 'AI निर्णय यशस्वीरित्या नोंदवला'
      }
    });
  } catch (error) {
    logger.error('Error recording AI decision:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record AI decision',
      message: {
        english: 'Failed to record AI decision',
        marathi: 'AI निर्णय नोंदवण्यात अयशस्वी'
      }
    });
  }
});

// Update user trust rating
router.post('/update-trust-rating', auth, async (req, res) => {
  try {
    const { trustData } = req.body;
    
    let aiTransparency = await AITransparency.findOne({ userId: req.user._id });
    
    if (!aiTransparency) {
      aiTransparency = new AITransparency({ userId: req.user._id });
    }
    
    aiTransparency.updateUserTrust(trustData);
    await aiTransparency.save();
    
    res.json({
      success: true,
      message: {
        english: 'Trust rating updated successfully',
        marathi: 'ट्रस्ट रेटिंग यशस्वीरित्या अद्ययावत केली'
      }
    });
  } catch (error) {
    logger.error('Error updating trust rating:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update trust rating',
      message: {
        english: 'Failed to update trust rating',
        marathi: 'ट्रस्ट रेटिंग अद्ययावत करण्यात अयशस्वी'
      }
    });
  }
});

module.exports = router; 