import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './FavoriteQuestionModal.module.css';
import type { FavoriteQuestion } from '../../types/favorite';

interface FavoriteQuestionModalProps {
  question: FavoriteQuestion | null;
  isOpen: boolean;
  onClose: () => void;
}

export function FavoriteQuestionModal({ question, isOpen, onClose }: FavoriteQuestionModalProps) {
  const navigate = useNavigate();

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

  if (!isOpen || !question) {
    return null;
  }

  const handleGoToFavorites = () => {
    onClose();
    navigate('/favorites');
  };

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

        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.badges}>
              <span className={styles.topicBadge}>
                {question.question.topic.title}
              </span>
              <span className={styles.phaseBadge}>
                Фаза {question.question.topic.phaseId}
              </span>
            </div>
          </div>

          <div className={styles.questionSection}>
            <h3 className={styles.sectionTitle}>Вопрос</h3>
            <p className={styles.questionText}>
              {question.question.text}
            </p>
          </div>

          <div className={styles.details}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Тип вопроса:</span>
              <span className={styles.detailValue}>
                {question.question.questionType}
              </span>
            </div>

            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Добавлено в избранное:</span>
              <span className={styles.detailValue}>
                {formatDate(question.createdAt)}
              </span>
            </div>
          </div>

          <div className={styles.footer}>
            <button 
              className={styles.favoriteButton} 
              onClick={handleGoToFavorites}
            >
              📝 Перейти в избранное
            </button>
            <button className={styles.closeModalButton} onClick={onClose}>
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
