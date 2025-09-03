const { body } = require('express-validator');

// Регистрация
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Имя пользователя должно содержать от 3 до 20 символов')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Имя пользователя может содержать только латинские буквы, цифры и символ "_"'),

  body('email')
    .trim()
    .isEmail()
    .withMessage('Некорректный email')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 4 })
    .withMessage('Пароль должен содержать минимум 4 символа')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
    .withMessage('Пароль должен содержать заглавную, строчную буквы и цифру'),
];

// Логин
const loginValidation = [
  body('username').trim().notEmpty().withMessage('Имя пользователя обязательно'),
  body('password').notEmpty().withMessage('Пароль обязателен'),
];

module.exports = { registerValidation, loginValidation };
