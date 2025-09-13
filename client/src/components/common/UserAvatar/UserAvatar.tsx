import React from 'react';
import { useUserAvatar } from '../../../hooks/useUserAvatar';
import styles from './UserAvatar.module.css';

interface UserAvatarProps {
  userId: number;
  fallbackImageUrl?: string;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  showLoading?: boolean;
  alt?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/**
 * Компонент для отображения аватара пользователя
 * Автоматически загружает аватар пользователя по ID
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({
  userId,
  fallbackImageUrl = "/default-avatar.svg",
  className = "",
  size = "medium",
  showLoading = true,
  alt = "Аватар пользователя",
  onClick,
  style
}) => {
  const { avatar, loading, error } = useUserAvatar(userId);

  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return styles.small;
      case 'large':
        return styles.large;
      default:
        return styles.medium;
    }
  };

  const getImageUrl = () => {
    if (avatar?.imageUrl) {
      return avatar.imageUrl;
    }
    return fallbackImageUrl;
  };

  if (loading && showLoading) {
    return (
      <div 
        className={`${styles.avatar} ${getSizeClass()} ${styles.loading} ${className}`}
        onClick={onClick}
        style={style}
      >
        <div className={styles.loadingSpinner} />
      </div>
    );
  }

  if (error) {
    console.warn('Ошибка загрузки аватара пользователя:', error);
  }

  return (
    <img
      src={getImageUrl()}
      alt={alt}
      className={`${styles.avatar} ${getSizeClass()} ${className}`}
      onClick={onClick}
      style={style}
      onError={(e) => {
        // Если аватар не загрузился, показываем fallback
        if (e.currentTarget.src !== fallbackImageUrl) {
          e.currentTarget.src = fallbackImageUrl;
        }
      }}
    />
  );
};
