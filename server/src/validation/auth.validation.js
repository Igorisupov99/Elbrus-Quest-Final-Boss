const { body } = require('express-validator');

// Регистрация
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Имя пользователя должно содержать от 3 до 20 символов')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Имя пользователя может содержать только латинские буквы, цифры и символ "_"'),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Пароль должен содержать минимум 8 символов')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Пароль должен содержать заглавную и строчную буквы, цифру и спецсимвол'),
];

// Логин
const loginValidation = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Имя пользователя обязательно'),

  body('password')
    .notEmpty()
    .withMessage('Пароль обязателен'),
];

module.exports = { registerValidation, loginValidation };
