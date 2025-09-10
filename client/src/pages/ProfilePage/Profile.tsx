import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
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
  const openSettings = () => setIsSettingsOpen(true);
  const closeSettings = () => setIsSettingsOpen(false);

  // Обработчик изменения полей формы
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Обработчик отправки формы
  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    // Здесь отправьте данные на сервер для обновления профиля
    // Например:
    // api.post('/api/auth/update-profile', {...formData, withCredentials:true})

    // Для демонстрации – просто закрываем модалку и обновляем user локально
    setUser((u) =>
      u
        ? {
            ...u,
            username: formData.username,
            email: formData.email,
          }
        : u
    );

    closeSettings();
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

  <div className={styles.profileContainer}>
    <img
      src={user.image_url || "/default-avatar.png"}
      alt="Аватар"
      className={styles.avatar}
    />

    <div className={styles.userInfo}>
      <h2>{user.username}</h2>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Роль:</strong> {user.role || "Пользователь"}</p>
      <p><strong>Очки:</strong> {user.score ?? 0}</p>
    </div>
  </div>

  <button className={styles.settingsButton} onClick={openSettings}>
    Настройки профиля
  </button>

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
                <label htmlFor="currentPassword">Текущий пароль</label>
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="newPassword">Новый пароль</label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleChange}
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