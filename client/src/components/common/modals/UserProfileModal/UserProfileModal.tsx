import { useEffect, useState } from 'react';
import styles from './UserProfileModal.module.css';
import api from '../../../../api/axios';

interface User {
  id: number;
  username: string;
  email?: string;
  role?: string;
  score?: number;
  image_url?: string;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  onAddFriend?: () => void;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export default function UserProfileModal({
  isOpen,
  onClose,
  username,
  onAddFriend,
}: UserProfileModalProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !username) return;

    const loadUserProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        // Получаем данные профиля пользователя через API
        const response = await api.get<ApiResponse<User>>(
          `/api/auth/user/${username}`,
          {
            withCredentials: true,
          }
        );

        if (!response.data.success) {
          throw new Error(
            response.data.message || 'Ошибка при загрузке профиля'
          );
        }

        setUser(response.data.data);
      } catch (err) {
        setError('Ошибка при загрузке профиля пользователя');
        console.error('Error loading user profile:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [isOpen, username]);

  const handleAddFriend = () => {
    // Просто вызываем переданную функцию из родительского компонента
    onAddFriend?.();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          ×
        </button>

        <h2 className={styles.modalHeader}>Профиль пользователя</h2>

        {loading && <div className={styles.loading}>Загрузка профиля...</div>}

        {error && <div className={styles.error}>{error}</div>}

        {user && !loading && !error && (
          <div className={styles.profileContainer}>
            <img
              src={
                user.image_url || '/ChatGPT Image Sep 17, 2025, 09_40_09 PM.png'
              }
              alt="Аватар"
              className={styles.avatar}
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  '/ChatGPT Image Sep 17, 2025, 09_40_09 PM.png';
              }}
            />

            <div className={styles.userInfo}>
              <h3>{user.username}</h3>
              {user.email && (
                <p>
                  <strong>Email:</strong> {user.email}
                </p>
              )}
              <p>
                <strong>Роль:</strong> {user.role || 'Пользователь'}
              </p>
              <p>
                <strong>Очки:</strong> {user.score ?? 0}
              </p>
            </div>
          </div>
        )}

        <div className={styles.modalActions}>
          <button className={styles.actionButton} onClick={handleAddFriend}>
            👥 Добавить в друзья
          </button>
          <button className={styles.cancelButton} onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
