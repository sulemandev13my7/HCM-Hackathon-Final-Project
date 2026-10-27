const express = require('express');
const router = express.Router();
const { chat, smartLeave, summarize } = require('../ai/aiService');
const { protect } = require('../middleware/auth');
const aiLimiter = require('../middleware/aiRateLimit');

router.post('/chat', protect, aiLimiter, chat);
router.post('/smart-leave', protect, aiLimiter, smartLeave);
router.post('/summarize', protect, aiLimiter, summarize);

module.exports = router;
