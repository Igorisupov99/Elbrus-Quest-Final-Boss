import React from 'react';
import styles from './CloseConfirmModal.module.css';

interface CloseConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const CloseConfirmModal: React.FC<CloseConfirmModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        <div className={styles.content}>
          <div className={styles.icon}>⚠️</div>
          <h3 className={styles.title}>Подтверждение закрытия</h3>
          <p className={styles.message}>
            Вы уверены, что хотите закрыть вопрос?
            <br />
            <strong>Вы не сможете открыть его снова!</strong>
          </p>
          
          <div className={styles.buttons}>
            <button 
              className={`${styles.button} ${styles.cancelButton}`}
              onClick={onCancel}
            >
              Отмена
            </button>
            <button 
              className={`${styles.button} ${styles.confirmButton}`}
              onClick={onConfirm}
            >
              Закрыть вопрос
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
