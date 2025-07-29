const express = require('express');
const router = express.Router();
const gpsMappingController = require('../controllers/gpsMappingController');
const { auth } = require('../middleware/auth');

// Apply authentication to all routes
router.use(auth);

// Desktop endpoints
router.get('/', gpsMappingController.getUserFieldLocations);
router.post('/', gpsMappingController.createFieldLocation);
router.get('/statistics', gpsMappingController.getFieldStatistics);
router.get('/district', gpsMappingController.getFieldsByDistrict);

// Field-specific endpoints
router.get('/:id', gpsMappingController.getFieldLocationById);
router.put('/:id', gpsMappingController.updateFieldLocation);

// Mobile-specific endpoints
router.get('/mobile/nearby', gpsMappingController.findFieldsWithinRadius);
router.get('/mobile/weather-stations', gpsMappingController.getNearbyWeatherStations);
router.get('/mobile/boundaries/:fieldId', gpsMappingController.getFieldBoundaries);
router.put('/mobile/location/:fieldId', gpsMappingController.updateLocationFromMobile);

module.exports = router; 