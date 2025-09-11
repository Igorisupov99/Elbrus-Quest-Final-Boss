import styles from './AchievementCard.module.css';
import type { Achievement } from '../../../types/achievement';
import { ACHIEVEMENT_CATEGORIES, ACHIEVEMENT_RARITIES } from '../../../types/achievement';

interface AchievementCardProps {
  achievement: Achievement;
  earnedDate?: string;
  className?: string;
  onClick?: (achievement: Achievement) => void;
}

export function AchievementCard({ achievement, earnedDate, className = '', onClick }: AchievementCardProps) {
  const isEarned = achievement.earned || !!earnedDate;
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleClick = () => {
    if (onClick) {
      onClick(achievement);
    }
  };

  return (
    <div 
      className={`${styles.achievementCard} ${isEarned ? styles.earned : styles.notEarned} ${className}`}
      onClick={handleClick}
    >
      {isEarned && <div className={styles.checkmark}>✓</div>}
      
      <div className={styles.header}>
        <div className={styles.icon}>
          {achievement.icon || '🏆'}
        </div>
        <div className={styles.titleContainer}>
          <h3 className={styles.title}>{achievement.title}</h3>
          <p className={styles.points}>+{achievement.points} очков</p>
        </div>
      </div>

      <div className={styles.footer}>
        <span className={styles.category}>
          {ACHIEVEMENT_CATEGORIES[achievement.category]}
        </span>
        <span className={`${styles.rarity} ${styles[achievement.rarity]}`}>
          {ACHIEVEMENT_RARITIES[achievement.rarity]}
        </span>
      </div>

      {isEarned && (earnedDate || achievement.earned_at) && (
        <div className={styles.earnedDate}>
          Получено: {formatDate(earnedDate || achievement.earned_at!)}
        </div>
      )}
    </div>
  );
}
