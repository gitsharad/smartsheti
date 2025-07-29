const express = require('express');
const router = express.Router();
const aiRecommendationController = require('../controllers/aiRecommendationController');
const { auth } = require('../middleware/auth');

// Apply authentication to all routes
router.use(auth);

// AI Recommendation endpoints
router.get('/', aiRecommendationController.getUserRecommendations);
router.post('/generate', aiRecommendationController.generateRecommendation);
router.put('/:id/status', aiRecommendationController.updateRecommendationStatus);
router.post('/:id/feedback', aiRecommendationController.addFarmerFeedback);
router.get('/stats', aiRecommendationController.getRecommendationStats);

module.exports = router; 