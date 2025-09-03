import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../../components/common/Input/Input';
import { Button } from '../../components/common/Button/Button';
import { useAppDispatch } from '../../store/hooks';
import { registerUser } from '../../store/authThunks';
import { registerSchema, type RegisterFormData } from '../../utils/validation';
import { Toast } from '../../components/Toast/Toast';
import styles from './Register.module.css';

export function Register() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
    mode: 'onBlur',
    defaultValues: {
      email: '',
      username: '',
      password: '',
    },
  });

  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setLoading(true);
      const result = await dispatch(registerUser(data)).unwrap();

      if (result) {
        setToast({ type: 'success', message: 'Герой создан! Добро пожаловать в Elbrus Quest.' });
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    } catch (err: unknown) {
  const message =
    typeof err === 'string'
      ? err
      : (err as any)?.message || 'Ошибка регистрации';
  setToast({ type: 'error', message });
} finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.registerPage}>
      <div className={styles.registerCard}>
        <h1 className={styles.title}>Создание героя</h1>
        <p className={styles.subtitle}>Укажите email, имя и пароль</p>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <Input
            name="email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            register={register}
            error={errors.email?.message as string}
            required
          />

          <Input
            name="username"
            label="Имя героя"
            placeholder="Ваш никнейм"
            register={register}
            error={errors.username?.message as string}
            required
          />

          <Input
            name="password"
            label="Пароль"
            type="password"
            placeholder="Минимум 4 символа"
            register={register}
            error={errors.password?.message as string}
            required
          />

          <Button
            type="submit"
            loading={loading}
            className={styles.submitButton}
          >
            {loading ? 'Создание...' : 'Создать героя'}
          </Button>
        </form>

        <p className={styles.linkText}>
          Уже есть герой?{' '}
          <Link to="/login" className={styles.link}>
            Войти в игру
          </Link>
        </p>
      </div>

      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}
    </div>
  );
};
