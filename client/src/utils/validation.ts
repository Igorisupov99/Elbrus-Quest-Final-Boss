import * as yup from 'yup';
import type { AnyObjectSchema } from 'yup';

/* ===== Регистрация ===== */
export const registerSchema: AnyObjectSchema = yup.object({
  username: yup
    .string()
    .required('Имя героя обязательно')
    .min(3, 'Минимум 3 символа')
    .max(20, 'Максимум 20 символов')
    .matches(/^[a-zA-Z0-9_]+$/, 'Можно использовать только буквы, цифры и _'),

  password: yup
    .string()
    .required('Пароль обязателен')
    .min(8, 'Пароль должен содержать минимум 8 символов')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      'Пароль должен содержать заглавную, строчную букву, цифру и спецсимвол'
    ),
});

export type RegisterFormData = yup.InferType<typeof registerSchema>;

/* ===== Авторизация ===== */
export const loginSchema: AnyObjectSchema = yup.object({
  username: yup
    .string()
    .required('Введите имя героя'),

  password: yup
    .string()
    .required('Введите пароль'),
});

export type LoginFormData = yup.InferType<typeof loginSchema>;
