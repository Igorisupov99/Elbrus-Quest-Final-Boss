const express = require('express');
const router = express.Router();
const achievementController = require('../controllers/achievement.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Получить все достижения пользователя
router.get('/user', authMiddleware, achievementController.getUserAchievements);

// Получить все доступные достижения
router.get('/all', achievementController.getAllAchievements);

module.exports = router;
