import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import styles from './Header.module.css';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logoutUser } from '../../store/authThunks';

export function Header() {
  const { user, loading } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [isBurgerMenuOpen, setIsBurgerMenuOpen] = useState(false);
  const burgerContainerRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
    } catch (err) {
      console.error('Ошибка при выходе:', err);
    } finally {
      navigate('/login');
    }
  };

  // Close burger menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isBurgerMenuOpen &&
        burgerContainerRef.current &&
        !burgerContainerRef.current.contains(event.target as Node)
      ) {
        setIsBurgerMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isBurgerMenuOpen]);

  // Burger menu SVG icon
  const BurgerIcon = (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 6h18M3 12h18M3 18h18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        {/* Burger Menu */}
        <div className={styles.burgerContainer} ref={burgerContainerRef}>
          <button
            className={styles.burgerButton}
            onClick={() => setIsBurgerMenuOpen(!isBurgerMenuOpen)}
            aria-label="Открыть меню"
          >
            {BurgerIcon}
          </button>

          {isBurgerMenuOpen && (
            <div className={styles.burgerDropdown}>
              <Link
                to="/achievements"
                className={styles.burgerLink}
                onClick={() => setIsBurgerMenuOpen(false)}
              >
                🏆 Достижения
              </Link>
              <Link
                to="/favorites"
                className={styles.burgerLink}
                onClick={() => setIsBurgerMenuOpen(false)}
              >
                📚 Избранное
              </Link>
              <Link
                to="/avatar-shop"
                className={styles.burgerLink}
                onClick={() => setIsBurgerMenuOpen(false)}
              >
                🎭 Магазин
              </Link>
            </div>
          )}
        </div>

        {/* Лого/домой */}
        <Link to="/" className={styles.logo}>
          ElbrusRPG
        </Link>

        <nav className={styles.actions} aria-label="user actions">
          {loading ? (
            <span className={styles.loading}>Загрузка…</span>
          ) : user ? (
            <>
              <span className={styles.username}>Привет, {user.username}!</span>
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
              <Link to="/login" className={styles.loginBtn}>
                Войти
              </Link>
              <Link to="/register" className={styles.registerBtn}>
                Зарегистрироваться
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
