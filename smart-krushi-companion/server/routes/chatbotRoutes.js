const express = require('express');
const router = express.Router();
const { askAI } = require('../controllers/chatbotController');

router.post('/', askAI);

module.exports = router; 