import { useEffect } from 'react';
import styles from './ExamFailureModal.module.css';

interface ExamFailureModalProps {
  isOpen: boolean;
  onClose: () => void;
  correctAnswers: number;
  totalQuestions: number;
  successRate: number;
  phaseId: number;
}

export default function ExamFailureModal({
  isOpen,
  onClose,
  correctAnswers,
  totalQuestions,
  successRate,
  phaseId,
}: ExamFailureModalProps) {
  // Автоматически закрываем модалку через 5 секунд
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.iconContainer}>
          <span className={styles.icon}>❌</span>
        </div>

        <h2 className={styles.title}>Экзамен провален!</h2>
        
        <div className={styles.messageContainer}>
          <p className={styles.message}>
            К сожалению, экзамен не сдан
          </p>
          <p className={styles.statsMessage}>
            Правильных ответов: <span className={styles.statsNumber}>{correctAnswers}</span> из <span className={styles.statsNumber}>{totalQuestions}</span>
          </p>
          <p className={styles.percentageMessage}>
            Результат: <span className={styles.percentageNumber}>{(successRate * 100).toFixed(1)}%</span>
          </p>
          <p className={styles.phaseMessage}>
            <span className={styles.phaseNumber}>Фаза {phaseId}</span> сброшена для повторного прохождения
          </p>
        </div>

        <div className={styles.countdown}>
          Модалка закроется через <span className={styles.timer}>5</span> секунд
        </div>
      </div>
    </div>
  );
}
