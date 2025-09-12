const express = require('express');
const favoriteController = require('../controllers/favorite.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// Все роуты требуют аутентификации
router.use(authMiddleware);

// POST /api/favorites - Добавить вопрос в избранное
router.post('/', favoriteController.addToFavorites);

// DELETE /api/favorites/:questionId - Удалить вопрос из избранного
router.delete('/:questionId', favoriteController.removeFromFavorites);

// GET /api/favorites - Получить все избранные вопросы пользователя
router.get('/', favoriteController.getUserFavorites);

// GET /api/favorites/user/:userId - Получить публичные избранные вопросы конкретного пользователя
router.get('/user/:userId', favoriteController.getUserFavoritesById);

// GET /api/favorites/:questionId/check - Проверить, находится ли вопрос в избранном
router.get('/:questionId/check', favoriteController.checkIfFavorite);

module.exports = router;
