import { useState } from 'react';
import styles from './UserActionsModal.module.css';
import { UserProfileModal } from '../UserProfileModal';

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
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  if (!isOpen) return null;

  const handleGoToProfile = () => {
    setIsProfileModalOpen(true);
    // Не закрываем текущую модалку, чтобы можно было вернуться
  };

  const handleAddFriend = () => {
    // Просто вызываем переданную функцию из родительского компонента
    onAddFriend?.();
    onClose();
  };

  const handleProfileModalClose = () => {
    setIsProfileModalOpen(false);
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
          <button className={styles.actionButton} onClick={handleAddFriend}>
            👥 Добавить в друзья
          </button>
        </div>

        <button className={styles.cancelButton} onClick={onClose}>
          Закрыть
        </button>
      </div>

      {/* Модальное окно профиля пользователя */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={handleProfileModalClose}
        username={username}
        onAddFriend={handleAddFriend}
      />
    </div>
  );
}
