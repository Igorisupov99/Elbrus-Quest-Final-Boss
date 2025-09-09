import styles from './SuccessModal.module.css';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: 'edit' | 'delete';
}

export default function SuccessModal({
  isOpen,
  onClose,
  title,
  message,
  type,
}: SuccessModalProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'edit':
        return '✏️';
      case 'delete':
        return '🗑️';
      default:
        return '✅';
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          ×
        </button>

        <div className={styles.iconContainer}>
          <span className={styles.icon}>{getIcon()}</span>
        </div>

        <h3 className={styles.title}>{title}</h3>
        <p className={styles.message}>{message}</p>

        <button className={styles.okButton} onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
}
