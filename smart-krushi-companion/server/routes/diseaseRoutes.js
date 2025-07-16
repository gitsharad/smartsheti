const express = require('express');
const multer = require('multer');
const path = require('path');
const diseaseController = require('../controllers/diseaseController');

const router = express.Router();

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

/**
 * @swagger
 * /api/disease/detect:
 *   post:
 *     summary: Detect plant disease from leaf image
 *     tags: [Disease Detection]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Leaf image file
 *     responses:
 *       200:
 *         description: Disease detection results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 disease:
 *                   type: string
 *                   description: Detected disease name
 *                 severity:
 *                   type: string
 *                   enum: [low, medium, high]
 *                 confidence:
 *                   type: number
 *                   description: Detection confidence score
 *                 treatment:
 *                   type: object
 *                   properties:
 *                     marathi:
 *                       type: string
 *                       description: Treatment tips in Marathi
 *                     english:
 *                       type: string
 *                       description: Treatment tips in English
 *       400:
 *         description: No image file provided
 *       500:
 *         description: Error processing image
 */
router.post('/detect', upload.single('image'), diseaseController.detectDisease);

/**
 * @swagger
 * /api/disease/history:
 *   get:
 *     summary: Get disease detection history
 *     tags: [Disease Detection]
 *     parameters:
 *       - in: query
 *         name: fieldId
 *         schema:
 *           type: string
 *         description: Optional field ID to filter history
 *     responses:
 *       200:
 *         description: Disease detection history
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   fieldId:
 *                     type: string
 *                   disease:
 *                     type: string
 *                   severity:
 *                     type: string
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *                   imageUrl:
 *                     type: string
 */
router.get('/history', diseaseController.getHistory);

module.exports = router; 