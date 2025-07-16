const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Protect all admin routes
router.use(auth);

// Overview stats for admin dashboard
router.get('/overview', adminController.getOverviewStats);
router.get('/coordinators', adminController.getCoordinators);
router.patch('/coordinator/:id/deactivate', adminController.deactivateCoordinator);
router.put('/coordinator/:id', adminController.editCoordinator);
router.get('/farmers', adminController.getFarmers);
router.get('/farmers/export', adminController.exportFarmers);
router.post('/farmers/import', upload.single('file'), adminController.importFarmers);
router.patch('/farmer/:id/assign-coordinator', adminController.assignCoordinatorToFarmer);
router.patch('/farmer/:id/deactivate', adminController.deactivateFarmer);
router.put('/farmer/:id', adminController.editFarmer);
router.get('/fields', adminController.getFields);
router.put('/fields/:id/location', adminController.updateFieldLocation);
router.get('/alerts', adminController.getAlerts);
router.patch('/alerts/:id/acknowledge', adminController.acknowledgeAlert);
router.patch('/alerts/:id/assign', adminController.assignAlert);
router.get('/fields/:id', adminController.getFieldById);
router.get('/fields/:id/sensor-data', adminController.getFieldSensorData);

module.exports = router; 