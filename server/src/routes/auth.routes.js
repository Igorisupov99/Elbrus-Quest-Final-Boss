const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { registerValidation, loginValidation } = require('../validation/auth.validation');

router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/profile', authMiddleware, authController.getProfile);
router.get('/user/id/:userId', authMiddleware, authController.getUserProfileById);
router.get('/user/:username', authMiddleware, authController.getUserProfileByUsername);
router.delete('/delete-account', authMiddleware, authController.deleteProfile);
router.put('/update-profile', authMiddleware, authController.updateProfile);


module.exports = router;