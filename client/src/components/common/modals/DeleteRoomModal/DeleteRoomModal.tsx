import React from 'react';
import styles from './DeleteRoomModal.module.css';

interface DeleteRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  roomName: string;
}

export default function DeleteRoomModal({
  isOpen,
  onClose,
  onConfirm,
  roomName,
}: DeleteRoomModalProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <button className={styles.closeBtn} onClick={onClose}>
          ×
        </button>

        <div className={styles.iconContainer}>
          <span className={styles.icon}>🗑️</span>
        </div>

        <h3 className={styles.title}>Удалить комнату</h3>
        <p className={styles.message}>
          Вы уверены, что хотите удалить комнату <strong>"{roomName}"</strong>?
        </p>
        <p className={styles.warning}>Это действие нельзя отменить.</p>

        <div className={styles.buttonGroup}>
          <button onClick={onClose} className={styles.cancelButton}>
            Отмена
          </button>
          <button onClick={onConfirm} className={styles.deleteButton}>
            Удалить
          </button>
        </div>
      </div>
    </div>
  );
}
