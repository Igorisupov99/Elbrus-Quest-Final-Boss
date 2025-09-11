import { Link, useNavigate } from 'react-router-dom';
import styles from './Header.module.css';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logoutUser } from '../../store/authThunks';


export function Header() {
  const { user, loading } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap(); 
    } catch (err) {
      console.error('Ошибка при выходе:', err);
    } finally {
      navigate('/login');
    }
  };
  

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        {/* Лого/домой */}
        <Link to="/" className={styles.logo}>ElbrusRPG</Link>

        <nav className={styles.actions} aria-label="user actions">
          {loading ? (
            <span className={styles.loading}>Загрузка…</span>
          ) : user ? (
            <>
              <span className={styles.username}>Привет, {user.username}!</span>
              <Link to="/achievements" className={styles.profileLink}>
                🏆 Достижения
              </Link>
              <Link to="/favorites" className={styles.profileLink}>
                📚 Избранное
              </Link>
              <Link to="/avatar-shop" className={styles.profileLink}>
                🎭 Магазин
              </Link>
              <Link to="/profile" className={styles.profileLink}>
                Профиль
              </Link>
              <button
                onClick={handleLogout}
                className={styles.logoutBtn}
                type="button"
              >
                Выйти
              </button>
            </>
          ) : (
            <div className={styles.authLinks}>
              <Link to="/login" className={styles.loginBtn}>Войти</Link>
              <Link to="/register" className={styles.registerBtn}>Зарегистрироваться</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
