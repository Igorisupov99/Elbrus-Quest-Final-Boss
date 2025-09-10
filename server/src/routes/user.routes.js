const express = require('express');
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// Все маршруты требуют авторизации
router.use(authMiddleware);

// Получить профиль пользователя
router.get('/profile', userController.getProfile);

// Обновить профиль пользователя
router.put('/profile', userController.updateProfile);

// Увеличить счетчик законченных игр
router.post('/increment-games', userController.incrementGamesCompleted);

// Получить статистику пользователя
router.get('/stats', userController.getStats);

// Получить топ игроков
router.get('/top-players', userController.getTopPlayers);

module.exports = router;