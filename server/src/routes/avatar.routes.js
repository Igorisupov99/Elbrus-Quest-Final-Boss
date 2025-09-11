const express = require('express');
const router = express.Router();
const avatarController = require('../controllers/avatar.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Получить все аватары с фильтрацией
router.get('/', authMiddleware, avatarController.getAvatars);

// Получить аватары пользователя
router.get('/user', authMiddleware, avatarController.getUserAvatars);

// Купить аватар
router.post('/purchase', authMiddleware, avatarController.purchaseAvatar);

// Надеть аватар
router.post('/equip', authMiddleware, avatarController.equipAvatar);

// Снять аватар
router.post('/unequip', authMiddleware, avatarController.unequipAvatar);

// Получить текущий аватар пользователя
router.get('/current', authMiddleware, avatarController.getCurrentAvatar);

module.exports = router;
