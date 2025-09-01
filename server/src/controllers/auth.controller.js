const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../../db/models');
const generateToken = require('../../utils/generateToken');

class AuthController {
  async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { username, password } = req.body;

      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Пользователь с таким именем уже существует'
        });
      }

      const password_hash = await bcrypt.hash(password, 10);

      const user = await User.create({
        username,
        password_hash,
        score: 0,
        isActive: true,
      });

      const { accessToken, refreshToken } = generateToken(user.id);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(201).json({
        success: true,
        message: 'Регистрация успешна',
        data: {
          user: {
            id: user.id,
            username: user.username,
            score: user.score,
            isActive: user.isActive,
          },
          accessToken,
        },
      });
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка сервера',
      });
    }
  }

  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { username, password } = req.body;

      const user = await User.findOne({ where: { username } });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Неверные учетные данные',
        });
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Неверные учетные данные',
        });
      }

      const { accessToken, refreshToken } = generateToken(user.id);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        success: true,
        message: 'Вход выполнен успешно',
        data: {
          user: {
            id: user.id,
            username: user.username,
            score: user.score,
            isActive: user.isActive,
          },
          accessToken,
        },
      });
    } catch (error) {
      console.error('Ошибка входа:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка сервера',
      });
    }
  }

  async refreshToken(req, res) {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token отсутствует',
        });
      }

      const { userId } = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const { accessToken } = generateToken(userId);

      res.json({
        success: true,
        data: { accessToken },
      });
    } catch (error) {
      res.clearCookie('refreshToken');
      res.status(403).json({
        success: false,
        message: 'Невалидный refresh token',
      });
    }
  }

  async logout(req, res) {
    try {
      res.clearCookie('refreshToken', {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
      });

      res.json({
        success: true,
        message: 'Выход выполнен успешно',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Ошибка сервера',
      });
    }
  }

  async getProfile(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password_hash'] },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Пользователь не найден',
        });
      }

      res.setHeader('Cache-Control', 'no-store');
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Ошибка сервера',
      });
    }
  }
}

module.exports = new AuthController();
