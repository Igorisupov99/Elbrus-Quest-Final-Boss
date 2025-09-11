import React from 'react';
import { Button } from '../../Button/Button';
import styles from './ConfirmCloseModal.module.css';

interface ConfirmCloseModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmCloseModal: React.FC<ConfirmCloseModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        <div className={styles.content}>
          <h3 className={styles.title}>Подтверждение закрытия</h3>
          <p className={styles.message}>
            Вы уверены что хотите закрыть вопрос? Закрытие будет засчитано как неправильный ответ и ход перейдёт следующему игроку!
          </p>
          <div className={styles.actions}>
            <Button 
              variant="secondary" 
              onClick={onCancel}
              className={styles.cancelButton}
            >
              Вернуться к вопросу
            </Button>
            <Button 
              variant="danger" 
              onClick={onConfirm}
              className={styles.confirmButton}
            >
              Закрыть
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
