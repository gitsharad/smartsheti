const express = require('express');
const landController = require('../controllers/landController');

const router = express.Router();

// POST /api/land/report - Generate land health report
router.post('/report', landController.generateReport);

// POST /api/land/download-pdf - Download text report
router.post('/download-pdf', landController.downloadPDF);

module.exports = router; 