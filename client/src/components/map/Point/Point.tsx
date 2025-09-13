import { memo } from 'react';
import styles from './Point.module.css';

import StarGray from '../../../svg/StarGray.svg';
import StarYellow from '../../../svg/StarYellow.svg';
import StarGreen from '../../../svg/StarGreen.svg';

export type POIStatus = 'available' | 'locked' | 'completed';

interface PointProps {
  id: string;
  title: string;
  top: number;
  left: number;
  status?: POIStatus;
  isActive?: boolean;
  onClick?: (id: string) => void;
}

export const Point = memo(function Point({
  id,
  title,
  top,
  left,
  status = 'available',
  isActive = false,
  onClick,
}: PointProps) {
  const isExam = id === "exam" || id === "exam2";
  
  // Временное логирование для отладки активного экзамена
  if (isExam) {
    const className = `${styles.poi} ${styles[status]} ${isActive ? styles.active : ''}`;
    console.log(`🔍 [POINT] Экзамен ${id}:`, { isActive, status, className });
  }

  const getStarIcon = () => {
    switch (status) {
      case 'available':
        return StarYellow;
      case 'completed':
        return StarGreen;
      case 'locked':
      default:
        return StarGray;
    }
  };

  const starIconSrc = isExam ? getStarIcon() : null;

  // Убираем инлайн стили - используем CSS селекторы с data-атрибутами

  const className = `${styles.poi} ${styles[status]} ${isActive ? styles.active : ''}`;
  
  // Отладочное логирование убрано

  return (
    <button
      type="button"
      className={className}
      style={{ top: `${top}%`, left: `${left}%` }}
      onClick={() => {
        if (status === 'available') onClick?.(id);
      }}
      data-point-id={id}
      data-active={isActive ? 'true' : 'false'}
      aria-label={title}
      disabled={status === 'locked' || status === 'completed'}
    >
      {isExam && starIconSrc ? (
        <div className={styles.marker}>
          <img 
            src={starIconSrc} 
            alt={title} 
            className={styles.starIcon}
            style={isActive ? {
              filter: 'drop-shadow(0 0 10px rgba(135, 206, 235, 0.9)) brightness(1.15)',
              transform: 'scale(1.08)'
            } : {}}
          />
        </div>
      ) : (
        <span 
          className={styles.marker}
          style={isActive ? {
            background: 'radial-gradient(circle at 30% 30%, #e0f6ff, #87ceeb 65%, #4682b4)',
            borderColor: '#4682b4',
            borderWidth: '3px',
            boxShadow: '0 0 0 1px #e0f6ff inset, 0 0 12px rgba(135, 206, 235, 0.8), 0 2px 6px rgba(0,0,0,0.35)',
            transform: 'scale(1.1)'
          } : {}}
        />
      )}
      
      {/* <span className={styles.badge}>{title}</span> */}
    </button>
  );
});