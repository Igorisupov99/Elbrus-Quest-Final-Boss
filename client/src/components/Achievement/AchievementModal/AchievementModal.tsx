import { useEffect } from 'react';
import styles from './AchievementModal.module.css';
import type { Achievement } from '../../../types/achievement';
import { ACHIEVEMENT_CATEGORIES, ACHIEVEMENT_RARITIES } from '../../../types/achievement';

interface AchievementModalProps {
  achievement: Achievement | null;
  isOpen: boolean;
  onClose: () => void;
  earnedDate?: string;
}

export function AchievementModal({ achievement, isOpen, onClose, earnedDate }: AchievementModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !achievement) {
    return null;
  }

  const isEarned = achievement.earned || !!earnedDate;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          ✕
        </button>

        <div className={`${styles.content} ${isEarned ? styles.earned : styles.notEarned}`}>
          {isEarned && <div className={styles.checkmark}>✓</div>}
          
          <div className={styles.header}>
            <div className={styles.icon}>
              {achievement.icon || '🏆'}
            </div>
            <div className={styles.titleContainer}>
              <h2 className={styles.title}>{achievement.title}</h2>
              <p className={styles.points}>+{achievement.points} очков</p>
            </div>
          </div>

          <div className={styles.descriptionSection}>
            <h3 className={styles.sectionTitle}>Описание</h3>
            <p className={styles.description}>
              {achievement.description}
            </p>
          </div>

          <div className={styles.details}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Категория:</span>
              <span className={styles.detailValue}>
                {ACHIEVEMENT_CATEGORIES[achievement.category]}
              </span>
            </div>
            
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Редкость:</span>
              <span className={`${styles.rarity} ${styles[achievement.rarity]}`}>
                {ACHIEVEMENT_RARITIES[achievement.rarity]}
              </span>
            </div>

            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Очки:</span>
              <span className={styles.detailValue}>
                {achievement.points} бонусных очков
              </span>
            </div>

            {isEarned && (earnedDate || achievement.earned_at) && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Получено:</span>
                <span className={styles.detailValue}>
                  {formatDate(earnedDate || achievement.earned_at!)}
                </span>
              </div>
            )}
          </div>

          <div className={styles.footer}>
            <button className={styles.closeModalButton} onClick={onClose}>
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
