import { useEffect } from 'react';
import styles from './PhaseTransitionModal.module.css';

interface PhaseTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  phaseNumber: number;
  rewardPoints: number;
  isGameComplete?: boolean;
}

export default function PhaseTransitionModal({
  isOpen,
  onClose,
  phaseNumber,
  rewardPoints,
  isGameComplete = false,
}: PhaseTransitionModalProps) {
  // Автоматически закрываем модалку через 3 или 7 секунд
  useEffect(() => {
    if (isOpen) {
      const delay = isGameComplete ? 7000 : 3000;
      const timer = setTimeout(() => {
        onClose();
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose, isGameComplete]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.iconContainer}>
          <span className={styles.icon}>{isGameComplete ? '🏆' : '🎉'}</span>
        </div>

        <h2 className={styles.title}>Поздравляем!</h2>
        
        <div className={styles.messageContainer}>
          <p className={styles.message}>
            {isGameComplete ? 'Вы прошли игру!' : 'Экзамен успешно сдан!'}
          </p>
          {!isGameComplete && (
            <p className={styles.phaseMessage}>
              Вы переходите на следующую фазу
            </p>
          )}
          <p className={styles.rewardMessage}>
            Каждый игрок получил <span className={styles.rewardPoints}>+{rewardPoints} очков</span>
          </p>
        </div>

        <div className={styles.countdown}>
          Модалка закроется через <span className={styles.timer}>{isGameComplete ? '7' : '3'}</span> секунды
        </div>
      </div>
    </div>
  );
}
