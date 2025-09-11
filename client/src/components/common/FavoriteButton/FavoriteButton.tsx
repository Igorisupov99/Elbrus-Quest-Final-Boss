import React, { useState, useEffect } from 'react';
import { favoriteApi } from '../../../api/favorites/favoriteApi';
import type { FavoriteButtonState } from '../../../types/favorite';
import styles from './FavoriteButton.module.css';

interface FavoriteButtonProps {
  questionId: number;
  className?: string;
  showText?: boolean;
  size?: 'small' | 'medium' | 'large';
  onToggle?: (isFavorite: boolean) => void;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  questionId,
  className = '',
  showText = false,
  size = 'medium',
  onToggle
}) => {
  const [state, setState] = useState<FavoriteButtonState>({
    isFavorite: false,
    loading: false,
    error: null
  });

  // Проверяем статус избранного при загрузке
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        const response = await favoriteApi.checkIfFavorite(questionId);
        setState(prev => ({ 
          ...prev, 
          isFavorite: response.isFavorite, 
          loading: false 
        }));
      } catch (error: any) {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: error.message || 'Ошибка при проверке избранного' 
        }));
      }
    };

    if (questionId) {
      checkFavoriteStatus();
    }
  }, [questionId]);

  // Слушаем socket события для синхронизации состояния избранного
  useEffect(() => {
    const handleFavoriteSync = (event: any) => {
      const { questionId: syncQuestionId, isFavorite, userId } = event.detail;
      
      // Обновляем состояние только для текущего вопроса
      if (syncQuestionId === questionId) {
        setState(prev => ({ 
          ...prev, 
          isFavorite, 
          loading: false 
        }));
      }
    };

    window.addEventListener('favorite:sync', handleFavoriteSync);
    
    return () => {
      window.removeEventListener('favorite:sync', handleFavoriteSync);
    };
  }, [questionId]);

  const handleToggle = async () => {
    if (state.loading) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await favoriteApi.toggleFavorite(questionId);
      
      setState(prev => ({ 
        ...prev, 
        isFavorite: result.isFavorite, 
        loading: false 
      }));

      // Вызываем callback если он передан
      onToggle?.(result.isFavorite);

      // Показываем уведомление
      window.dispatchEvent(new CustomEvent('favorite:toggled', {
        detail: {
          questionId,
          isFavorite: result.isFavorite,
          message: result.message
        }
      }));

      // Отправляем socket событие для синхронизации с другими игроками (если доступно)
      try {
        window.dispatchEvent(new CustomEvent('socket:favoriteToggle', {
          detail: {
            questionId,
            isFavorite: result.isFavorite
          }
        }));
      } catch (error) {
        // Игнорируем ошибки socket событий
        console.log('Socket событие недоступно для избранного');
      }
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Ошибка при изменении избранного' 
      }));
    }
  };

  const buttonClasses = [
    styles.favoriteButton,
    styles[size],
    state.isFavorite ? styles.favorited : styles.notFavorited,
    state.loading ? styles.loading : '',
    className
  ].filter(Boolean).join(' ');

  const icon = state.isFavorite ? '❤️' : '🤍';
  const text = state.isFavorite ? 'Удалить из избранного' : 'Добавить в избранное';

  return (
    <button
      type="button"
      className={buttonClasses}
      onClick={handleToggle}
      disabled={state.loading}
      title={text}
      aria-label={text}
    >
      <span className={styles.icon}>
        {state.loading ? '⏳' : icon}
      </span>
      {showText && (
        <span className={styles.text}>
          {state.loading ? 'Обработка...' : (state.isFavorite ? 'В избранном' : 'В избранное')}
        </span>
      )}
      {state.error && (
        <span className={styles.error} title={state.error}>
          ⚠️
        </span>
      )}
    </button>
  );
};
