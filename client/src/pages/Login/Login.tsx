import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../../components/common/Input/Input';
import { Button } from '../../components/common/Button/Button';
import { loginSchema, type LoginFormData } from '../../utils/validation';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { loginUser } from '../../store/authThunks';
import { Toast } from '../../components/Toast/Toast';
import styles from './Login.module.css';

export function Login() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { loading, user } = useAppSelector((state) => state.auth);
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    const result = await dispatch(
      loginUser({ username: data.username, password: data.password })
    );
    if (loginUser.fulfilled.match(result)) {
      setToast({
        type: 'success',
        message: 'Добро пожаловать в Elbrus Quest!',
      });
    } else {
      setToast({
        type: 'error',
        message: (result.payload as string) || 'Ошибка входа',
      });
    }
  };

  useEffect(() => {
    if (user) {
      setTimeout(() => {
        navigate('/');
      }, 3000);
    }
  }, [user, navigate]);

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <h1 className={styles.title}>QuestCode</h1>
        <p className={styles.subtitle}>Начать испытание</p>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <Input
            name="username"
            label="Имя героя"
            placeholder="Введите имя"
            register={register}
            error={errors.username?.message as string}
            required
          />

          <Input
            name="password"
            label="Пароль"
            type="password"
            placeholder="Введите пароль"
            register={register}
            error={errors.password?.message as string}
            required
          />

          <Button
            type="submit"
            loading={loading}
            className={styles.submitButton}
          >
            {loading ? 'Вход...' : 'Начать приключение'}
          </Button>
        </form>

        <div className={styles.links}>
          <p>
            Нет аккаунта? <Link to="/register">Присоединиться к команде</Link>
          </p>
        </div>
      </div>

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
