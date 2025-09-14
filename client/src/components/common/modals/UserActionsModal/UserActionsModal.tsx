import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './UserActionsModal.module.css';
import { getUserByUsername, checkFriendshipStatus } from '../../../../api/friendship/friendshipApi';

interface UserActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  onGoToProfile?: () => void;
  onAddFriend?: () => void;
}

export default function UserActionsModal({
  isOpen,
  onClose,
  username,
  //onGoToProfile,
  onAddFriend,
}: UserActionsModalProps) {
  const navigate = useNavigate();
  const [friendshipStatus, setFriendshipStatus] = useState<'none' | 'pending' | 'accepted' | 'blocked' | 'loading'>('loading');
  const [userToNavigate, setUserToNavigate] = useState<{ id: number; username: string } | null>(null);

  // Проверяем статус дружбы при открытии модального окна
  useEffect(() => {
    if (isOpen && username) {
      checkUserFriendshipStatus();
    }
  }, [isOpen, username]);

  const checkUserFriendshipStatus = async () => {
    try {
      setFriendshipStatus('loading');
      
      // Сначала получаем пользователя по username
      const userResponse = await getUserByUsername(username);
      
      if (userResponse.success && userResponse.data) {
        // Сохраняем данные пользователя для навигации
        setUserToNavigate({
          id: userResponse.data.id,
          username: userResponse.data.username
        });
        
        // Затем проверяем статус дружбы
        const statusResponse = await checkFriendshipStatus(userResponse.data.id);
        
        if (statusResponse.success && statusResponse.data) {
          setFriendshipStatus(statusResponse.data.status);
        } else {
          setFriendshipStatus('none');
        }
      } else {
        setFriendshipStatus('none');
        setUserToNavigate(null);
      }
    } catch (error) {
      console.error('Ошибка при проверке статуса дружбы:', error);
      setFriendshipStatus('none');
      setUserToNavigate(null);
    }
  };

  if (!isOpen) return null;

  const handleGoToProfile = () => {
    // Переходим на страницу профиля пользователя
    if (userToNavigate?.id) {
      onClose(); // Закрываем модальное окно
      navigate(`/user/${userToNavigate.id}`);
    }
  };

  const handleAddFriend = () => {
    // Просто вызываем переданную функцию из родительского компонента
    onAddFriend?.();
    onClose();
  };

  const renderFriendshipButton = () => {
    switch (friendshipStatus) {
      case 'loading':
        return (
          <button className={styles.actionButton} disabled>
            ⏳ Загрузка...
          </button>
        );
      case 'accepted':
        return (
          <button className={styles.actionButton} disabled>
            ✅ {username} у вас в друзьях
          </button>
        );
      case 'pending':
        return (
          <button className={styles.actionButton} disabled>
            ⏳ Запрос отправлен
          </button>
        );
      case 'blocked':
        return (
          <button className={styles.actionButton} disabled>
            🚫 Пользователь заблокирован
          </button>
        );
      case 'none':
      default:
        return (
          <button className={styles.actionButton} onClick={handleAddFriend}>
            👥 Добавить в друзья
          </button>
        );
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          ×
        </button>

        <div className={styles.iconContainer}>
          <span className={styles.icon}>👤</span>
        </div>

        <h3 className={styles.title}>{username}</h3>
        <p className={styles.message}>Выберите действие:</p>

        <div className={styles.actionButtons}>
          <button className={styles.actionButton} onClick={handleGoToProfile}>
            👤 Перейти в профиль
          </button>
          {renderFriendshipButton()}
        </div>

        <button className={styles.cancelButton} onClick={onClose}>
          Закрыть
        </button>
      </div>

    </div>
  );
}
