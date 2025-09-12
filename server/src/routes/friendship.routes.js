const express = require('express');
const friendshipController = require('../controllers/friendship.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// Все маршруты требуют авторизации
router.use(authMiddleware);

// Отправить запрос на дружбу
router.post('/send-request', friendshipController.sendFriendRequest);

// Принять запрос на дружбу
router.put('/accept/:friendship_id', friendshipController.acceptFriendRequest);

// Отклонить запрос на дружбу
router.delete('/reject/:friendship_id', friendshipController.rejectFriendRequest);

// Удалить из друзей
router.delete('/remove/:friend_id', friendshipController.removeFriend);

// Заблокировать пользователя
router.post('/block', friendshipController.blockUser);

// Получить список друзей
router.get('/friends', friendshipController.getFriends);

// Получить входящие запросы на дружбу
router.get('/incoming-requests', friendshipController.getIncomingRequests);

// Получить исходящие запросы на дружбу
router.get('/outgoing-requests', friendshipController.getOutgoingRequests);

// Поиск пользователей для добавления в друзья
router.get('/search', friendshipController.searchUsers);

// Проверить статус дружбы с пользователем
router.get('/status/:friend_id', friendshipController.checkFriendshipStatus);

module.exports = router;
