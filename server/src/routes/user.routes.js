const express = require('express');
const userRouter = express.Router();
const {User} = require('../../db/models')

/// Ручка для получения информации об авторизованном пользователе
userRouter.get('/profile', async (req, res) => {
    try {
      const user = await User.findByPk(req.userId, {
        attributes: ['username(login)', 'email', 'image_url'],
      });
      if (!user)
        return res.status(404).json({ message: 'Пользователь не найден' });
      res.json(user);
    } catch (error) {
      console.error('profile:', error);
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  });


  module.exports = userRouter;