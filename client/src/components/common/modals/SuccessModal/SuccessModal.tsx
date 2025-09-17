import React from 'react';
import styles from './SuccessModal.module.css';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'info' | 'warning';
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'success'
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'info':
        return 'ℹ️';
      case 'warning':
        return '⚠️';
      default:
        return '✅';
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Закрыть модальное окно">
          ×
        </button>
        
        <div className={styles.modalHeader}>
          <div className={styles.iconContainer}>
            <span className={styles.icon}>{getIcon()}</span>
          </div>
          <h2 className={styles.title}>{title}</h2>
        </div>
        
        <div className={styles.modalBody}>
          <p className={styles.message}>{message}</p>
        </div>
        
        <div className={styles.modalActions}>
          <button 
            className={styles.confirmButton} 
            onClick={onClose}
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;