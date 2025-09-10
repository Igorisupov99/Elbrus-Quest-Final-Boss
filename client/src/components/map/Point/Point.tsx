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
  onClick?: (id: string) => void;
}

export const Point = memo(function Point({
  id,
  title,
  top,
  left,
  status = 'available',
  onClick,
}: PointProps) {
  const isExam = id === "exam" || id === "exam2";

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

  return (
    <button
      type="button"
      className={`${styles.poi} ${styles[status]}`}
      style={{ top: `${top}%`, left: `${left}%` }}
      onClick={() => {
        if (status === 'available') onClick?.(id);
      }}
      data-point-id={id}
      aria-label={title}
      disabled={status === 'locked' || status === 'completed'}
    >
      {isExam && starIconSrc ? (
        <div className={styles.marker}>
          <img src={starIconSrc} alt={title} className={styles.starIcon} />
        </div>
      ) : (
        <span className={styles.marker} />
      )}
      
      {/* <span className={styles.badge}>{title}</span> */}
    </button>
  );
});