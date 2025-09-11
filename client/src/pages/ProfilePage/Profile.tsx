import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import axios from "axios";
import api from "../../api/axios";
import styles from "./Profile.module.css";

interface User {
  id: number;
  username: string;
  email: string;
  role?: string;
  score?: number;
  image_url?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Для модального окна настроек
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Для управления формой настроек
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    currentPassword: "",
    newPassword: "",
  });

  // Загрузка данных профиля
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get<ApiResponse<User>>("/api/auth/profile", {
          withCredentials: true,
        });

        if (!response.data.success) {
          throw new Error(response.data.message || "Ошибка при загрузке профиля");
        }

        setUser(response.data.data);

        // Инициализируем форму
        setFormData((f) => ({
          ...f,
          username: response.data.data.username,
          email: response.data.data.email,
        }));
      } catch (err) {
        let errorMessage = "Ошибка";
        if (axios.isAxiosError(err)) {
          errorMessage =
            err.response?.data?.message || err.message || "Ошибка";
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, []);

  // Обработчик открытия/закрытия модалки
  const openSettings = () => {
    setError(null); // очищаем ошибки при открытии модального окна
    setIsSettingsOpen(true);
  };
  const closeSettings = () => {
    setError(null); // очищаем ошибки при закрытии модального окна
    setIsSettingsOpen(false);
  };

  // Обработчик изменения полей формы
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Обработчик отправки формы
  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      // Отправляем данные на сервер для обновления профиля
      const response = await api.put<ApiResponse<User>>('/api/auth/update-profile', {
        username: formData.username,
        email: formData.email,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword || undefined, // отправляем только если есть новый пароль
      }, {
        withCredentials: true
      });

      if (!response.data.success) {
        throw new Error(response.data.message || "Ошибка при обновлении профиля");
      }

      // Обновляем локальное состояние пользователя с данными с сервера
      setUser(response.data.data);

      // Очищаем пароли из формы после успешного обновления
      setFormData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        username: response.data.data.username,
        email: response.data.data.email,
      }));

      closeSettings();
      
      // Можно добавить уведомление об успешном обновлении
      alert("Профиль успешно обновлен!");
      
    } catch (err) {
      let errorMessage = "Ошибка при обновлении профиля";
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || err.message || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Обработчик удаления аккаунта
  const handleDelete = async () => {
    if (!window.confirm("Вы уверены, что хотите удалить аккаунт? Это действие нельзя отменить.")) {
      return;
    }
    try {
      setLoading(true);
      setError(null);
      // вызов API для удаления аккаунта
      await api.delete("/api/auth/delete-account", { withCredentials: true });
      // например, редирект на страницу входа или главную
      window.location.href = "/register";
    } catch (err) {
      let errorMessage = "Ошибка удаления аккаунта";
      if (axios.isAxiosError(err)) {
        errorMessage =
          err.response?.data?.message || err.message || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className={styles.loading}>Загрузка профиля...</div>;
  if (error) return <div className={styles.error}>Ошибка: {error}</div>;
  if (!user) return <div className={styles.notFound}>Пользователь не найден</div>;

  return (
<section className={styles.profileSection}>
  <h1 className={styles.header}>Профиль</h1>

  <div className={styles.mainContainer}>
    {/* Левый блок (2/3 ширины) */}
    <div className={styles.leftBlock}>
      
      {/* Блок 1.1 - Основная информация */}
      <div className={styles.profileInfoBlock}>
        <div className={styles.avatarSection}>
          <img
            src={user.image_url || "/default-avatar.png"}
            alt="Аватар"
            className={styles.avatar}
          />
          <button className={styles.editButton} onClick={openSettings}>
            Редактировать
          </button>
        </div>
        <div className={styles.basicInfo}>
          <h2 className={styles.username}>{user.username}</h2>
          <p className={styles.friendsCount}>Друзей: 0</p>
        </div>
      </div>

      {/* Блок 1.2 - Статистика */}
      <div className={styles.statisticsBlock}>
        <h3 className={styles.blockTitle}>Статистика</h3>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{user.score ?? 0}</div>
            <div className={styles.statLabel}>Очки</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>0</div>
            <div className={styles.statLabel}>Игры</div>
          </div>
        </div>
      </div>

      {/* Блок достижений */}
      <div className={styles.achievementsBlock}>
        <h3 className={styles.blockTitle}>Достижения</h3>
        <div className={styles.achievementsList}>
          <div className={styles.emptyMessage}>У вас пока нет достижений</div>
        </div>
      </div>
    </div>

    {/* Правый блок (1/3 ширины) */}
    <div className={styles.rightBlock}>
      
      {/* Секция друзей */}
      <div className={styles.friendsSection}>
        <h3 className={styles.blockTitle}>Друзья</h3>
        <div className={styles.friendsList}>
          <div className={styles.emptyMessage}>У вас еще нет друзей</div>
        </div>
      </div>

      {/* Секция избранных вопросов */}
      <div className={styles.favoriteQuestionsSection}>
        <h3 className={styles.blockTitle}>Избранные вопросы</h3>
        <div className={styles.questionsList}>
          <div className={styles.emptyMessage}>У вас нет избранных вопросов</div>
        </div>
      </div>
    </div>
  </div>

      {/* Модальное окно */}
      {isSettingsOpen && (
        <div className={styles.modalOverlay} onClick={closeSettings}>
          <div
            className={styles.modalContent}
            onClick={e => e.stopPropagation()} // чтобы клик по содержимому не закрывал модал
          >
            <button className={styles.closeBtn} onClick={closeSettings} aria-label="Закрыть модальное окно">
              &times;
            </button>
            <h2 className={styles.modalHeader}>Настройки профиля</h2>

            {error && (
              <div className={styles.error} style={{ marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSave}>
              <div className={styles.formGroup}>
                <label htmlFor="username">Логин</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="currentPassword">Текущий пароль *</label>
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  required
                  placeholder="Введите текущий пароль для подтверждения изменений"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="newPassword">Новый пароль (оставьте пустым, если не хотите менять)</label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Введите новый пароль или оставьте пустым"
                />
              </div>

              <div className={styles.modalActions}>
                <button type="submit" className={`${styles.button} ${styles.saveBtn}`}>
                  Сохранить изменения
                </button>
                <button
                  type="button"
                  className={`${styles.button} ${styles.deleteBtn}`}
                  onClick={handleDelete}
                >
                  Удалить аккаунт
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}