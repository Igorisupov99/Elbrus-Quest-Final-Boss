import { useState } from 'react';
import styles from './AchievementGroup.module.css';
import { AchievementCard } from '../AchievementCard/AchievementCard';
import type { Achievement } from '../../../types/achievement';
import { ACHIEVEMENT_CATEGORIES } from '../../../types/achievement';

interface AchievementGroupProps {
  category: string;
  achievements: Achievement[];
  onAchievementClick: (achievement: Achievement) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

export function AchievementGroup({ 
  category, 
  achievements, 
  onAchievementClick, 
  isExpanded, 
  onToggle 
}: AchievementGroupProps) {
  const categoryLabel = ACHIEVEMENT_CATEGORIES[category as keyof typeof ACHIEVEMENT_CATEGORIES];
  const earnedCount = achievements.filter(achievement => achievement.earned).length;
  const totalCount = achievements.length;

  return (
    <div className={styles.group}>
      <button 
        className={`${styles.groupHeader} ${isExpanded ? styles.expanded : ''}`}
        onClick={onToggle}
      >
        <div className={styles.groupInfo}>
          <h3 className={styles.groupTitle}>{categoryLabel}</h3>
          <span className={styles.groupStats}>
            {earnedCount}/{totalCount} получено
          </span>
        </div>
        <div className={styles.groupIcon}>
          <span className={`${styles.arrow} ${isExpanded ? styles.arrowDown : styles.arrowRight}`}>
            ▶
          </span>
        </div>
      </button>
      
      <div className={`${styles.groupContent} ${isExpanded ? styles.expanded : ''}`}>
        <div className={styles.achievementsGrid}>
          {achievements.map((achievement) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              onClick={onAchievementClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
