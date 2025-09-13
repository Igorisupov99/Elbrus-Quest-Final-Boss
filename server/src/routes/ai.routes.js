const express = require('express');
const aiController = require('../controllers/ai.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/chat', authMiddleware, aiController.chatResponse);
router.post('/generate-question', authMiddleware, aiController.generateQuestion);
router.post('/check-answer', authMiddleware, aiController.checkAnswer);
router.delete('/clear-history', authMiddleware, aiController.clearHistory);
router.get('/history', authMiddleware, aiController.getHistory);
router.get('/token-usage', authMiddleware, aiController.getTokenUsage);

module.exports = router;
