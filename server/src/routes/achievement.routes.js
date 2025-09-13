const express = require('express');
const router = express.Router();
const achievementController = require('../controllers/achievement.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Получить все достижения пользователя
router.get('/user', authMiddleware, achievementController.getUserAchievements);

// Получить все достижения конкретного пользователя
router.get('/user/:userId', authMiddleware, achievementController.getUserAchievementsById);

// Получить все доступные достижения
router.get('/all', authMiddleware, achievementController.getAllAchievements);

module.exports = router;
