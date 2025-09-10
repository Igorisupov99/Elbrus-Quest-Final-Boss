import { useState, useEffect } from 'react';
import styles from './AchievementNotification.module.css';
import type { Achievement } from '../../../types/achievement';

interface AchievementNotificationProps {
  achievements: Achievement[];
  onClose: () => void;
  autoCloseDelay?: number;
}

export function AchievementNotification({ 
  achievements, 
  onClose, 
  autoCloseDelay = 5000 
}: AchievementNotificationProps) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [autoCloseDelay]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300); // Время анимации
  };

  return (
    <div className={`${styles.notification} ${isClosing ? styles.slideOut : ''}`}>
      <div className={styles.sparkles}>✨</div>
      
      <button className={styles.closeButton} onClick={handleClose}>
        ×
      </button>

      <div className={styles.header}>
        <div className={styles.trophy}>🏆</div>
        <h3 className={styles.title}>
          Достижение{achievements.length > 1 ? 'я' : ''} получен{achievements.length > 1 ? 'ы' : 'о'}!
        </h3>
      </div>

      {achievements.map((achievement) => (
        <div key={achievement.id} className={styles.achievementItem}>
          <div className={styles.achievementIcon}>
            {achievement.icon || '🏆'}
          </div>
          <div className={styles.achievementText}>
            <h4 className={styles.achievementName}>{achievement.title}</h4>
            <p className={styles.achievementPoints}>+{achievement.points} очков</p>
          </div>
        </div>
      ))}
    </div>
  );
}
