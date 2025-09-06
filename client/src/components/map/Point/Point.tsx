import { memo } from 'react';
import styles from './Point.module.css';

export type POIStatus = 'available' | 'locked' | 'completed';

interface PointProps {
  id: string ;
  title: string;
  top: number;
  left: number;
  status?: POIStatus;
  onClick?: (id: string ) => void;
}

export const Point = memo(function Point({
  id,
  title,
  top,
  left,
  status = 'available',
  onClick,
}: PointProps) {
  return (
    <button
      type="button"
      className={`${styles.poi} ${styles[status]}`}
      style={{ top: `${top}%`, left: `${left}%` }}
      onClick={() => onClick?.(id)}
      data-point-id={id}
      aria-label={title}
      disabled={status === 'locked'}
    >
      
      <span className={styles.marker} />
      {status === 'locked' && (
        <span className={styles.lockIcon}>🔒</span>
      )}
      {/* <span className={styles.badge}>{title}</span> */}
    </button>
  );
});
