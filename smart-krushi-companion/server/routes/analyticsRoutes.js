const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { auth } = require('../middleware/auth');

// Apply authentication to all routes
router.use(auth);

// Analytics endpoints
router.get('/sensor-trends', analyticsController.getSensorTrends);
router.get('/crop-performance', analyticsController.getCropPerformance);
router.get('/weather-correlation', analyticsController.getWeatherCorrelation);
router.get('/soil-health', analyticsController.getSoilHealth);
router.get('/yield-prediction', analyticsController.getYieldPrediction);
router.get('/financial-metrics', analyticsController.getFinancialMetrics);
router.get('/field-comparison', analyticsController.getFieldComparison);
router.get('/seasonal-analysis', analyticsController.getSeasonalAnalysis);
router.get('/risk-assessment', analyticsController.getRiskAssessment);
router.get('/optimization-suggestions', analyticsController.getOptimizationSuggestions);

module.exports = router; 