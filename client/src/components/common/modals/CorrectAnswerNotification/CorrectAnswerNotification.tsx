import { useEffect, useState } from 'react';
import styles from './CorrectAnswerNotification.module.css';

interface CorrectAnswerNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  points?: number;
}

export default function CorrectAnswerNotification({
  isOpen,
  onClose,
  points = 10,
}: CorrectAnswerNotificationProps) {
  const [countdown, setCountdown] = useState(2);

  // Автоматически закрываем уведомление через 2 секунды
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);

      // Обратный отсчет
      const countdownTimer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownTimer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearTimeout(timer);
        clearInterval(countdownTimer);
      };
    } else {
      setCountdown(2); // Сбрасываем счетчик при закрытии
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.iconContainer}>
          <span className={styles.icon}>✅</span>
        </div>

        <h2 className={styles.title}>Отлично!</h2>
        
        <div className={styles.messageContainer}>
          <p className={styles.message}>
            Правильный ответ!
          </p>
          <p className={styles.pointsMessage}>
            Вы получили <span className={styles.points}>+{points} очков</span>
          </p>
        </div>

        <div className={styles.countdown}>
          Уведомление закроется через <span className={styles.timer}>{countdown}</span> секунд{countdown === 1 ? 'у' : countdown < 5 ? 'ы' : ''}
        </div>
      </div>
    </div>
  );
}
