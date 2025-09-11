import React from 'react';
import { Button } from '../../Button/Button';
import styles from './ConfirmCloseExamModal.module.css';

interface ConfirmCloseExamModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmCloseExamModal: React.FC<ConfirmCloseExamModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        <div className={styles.content}>
          <h3 className={styles.title}>⚠️ Провал экзамена</h3>
          <p className={styles.message}>
            Вы уверены что хотите закрыть экзамен? Экзамен будет провален, 
            фаза начнётся заново и все точки текущей фазы станут доступными для повторного прохождения!
          </p>
          <div className={styles.actions}>
            <Button 
              variant="secondary" 
              onClick={onCancel}
              className={styles.cancelButton}
            >
              Вернуться к экзамену
            </Button>
            <Button 
              variant="danger" 
              onClick={onConfirm}
              className={styles.confirmButton}
            >
              Провалить экзамен
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
