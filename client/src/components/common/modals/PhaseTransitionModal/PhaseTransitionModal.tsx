import { useEffect } from 'react';
import styles from './PhaseTransitionModal.module.css';

interface PhaseTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  phaseNumber: number;
  rewardPoints: number;
}

export default function PhaseTransitionModal({
  isOpen,
  onClose,
  phaseNumber,
  rewardPoints,
}: PhaseTransitionModalProps) {
  // Автоматически закрываем модалку через 3 секунды
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.iconContainer}>
          <span className={styles.icon}>🎉</span>
        </div>

        <h2 className={styles.title}>Поздравляем!</h2>
        
        <div className={styles.messageContainer}>
          <p className={styles.message}>
            Экзамен успешно сдан!
          </p>
          <p className={styles.phaseMessage}>
            Вы переходите на фазу {phaseNumber}
          </p>
          <p className={styles.rewardMessage}>
            Каждый игрок получил <span className={styles.rewardPoints}>+{rewardPoints} очков</span>
          </p>
        </div>

        <div className={styles.countdown}>
          Модалка закроется через <span className={styles.timer}>3</span> секунды
        </div>
      </div>
    </div>
  );
}
