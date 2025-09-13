import React, { useState, useEffect } from 'react';
import styles from './ReconnectWaitingModal.module.css';

interface ReconnectWaitingModalProps {
  isOpen: boolean;
  activePlayerName: string;
  timeLeft: number;
  onTimeUp?: () => void;
}

export const ReconnectWaitingModal: React.FC<ReconnectWaitingModalProps> = ({
  isOpen,
  activePlayerName,
  timeLeft,
  onTimeUp: _onTimeUp,
}) => {
  const [displayTime, setDisplayTime] = useState(timeLeft);

  useEffect(() => {
    setDisplayTime(timeLeft);
  }, [timeLeft]);

  // Убираем локальный таймер - теперь время обновляется с сервера
  // useEffect(() => {
  //   if (!isOpen || displayTime <= 0) return;

  //   const timer = setInterval(() => {
  //     setDisplayTime(prev => {
  //       if (prev <= 1) {
  //         onTimeUp?.();
  //         return 0;
  //       }
  //       return prev - 1;
  //     });
  //   }, 1000);

  //   return () => clearInterval(timer);
  // }, [isOpen, displayTime, onTimeUp]);

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        <div className={styles.content}>
          <div className={styles.icon}>⏳</div>
          <h3 className={styles.title}>Ожидание переподключения</h3>
          <p className={styles.message}>
            <strong>{activePlayerName}</strong> отключился от игры.
            <br />
            Ожидаем его возвращения...
          </p>
          
          <div className={styles.timerSection}>
            <div className={styles.timer}>
              <div className={styles.timerCircle}>
                <span className={styles.timerText}>{displayTime}</span>
              </div>
            </div>
            <p className={styles.timerLabel}>
              {displayTime > 0 
                ? `Осталось ${displayTime} сек. до передачи хода`
                : 'Время истекло, ход передается следующему игроку'
              }
            </p>
          </div>

          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ width: `${((30 - displayTime) / 30) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
