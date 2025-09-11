import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { 
  fetchAvatars, 
  fetchUserAvatars, 
  fetchCurrentAvatar,
  clearError 
} from '../../store/avatarSlice';
import { AvatarCard } from './AvatarCard/AvatarCard';
import { AvatarFilters } from './AvatarFilters/AvatarFilters';
import type { AvatarShopFilters } from '../../types/avatar';
import styles from './AvatarShop.module.css';

export const AvatarShop: React.FC = () => {
  const dispatch = useAppDispatch();
  const { 
    avatars, 
    userAvatars, 
    currentAvatar, 
    loading, 
    error
  } = useAppSelector((state) => state.avatar);
  
  const { user } = useAppSelector((state) => state.auth);

  const [filters, setFilters] = useState<AvatarShopFilters>({});

  useEffect(() => {
    // Загружаем данные при монтировании компонента
    dispatch(fetchAvatars(filters));
    dispatch(fetchUserAvatars());
    dispatch(fetchCurrentAvatar());
  }, [dispatch]);

  useEffect(() => {
    // Применяем фильтры
    dispatch(fetchAvatars(filters));
  }, [dispatch, filters]);

  useEffect(() => {
    // Очищаем ошибки при размонтировании
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Получаем ID купленных аватаров
  const ownedAvatarIds = new Set(userAvatars.map(ua => ua.avatarId));
  
  // Получаем ID надетого аватара
  const equippedAvatarId = currentAvatar?.id;

  // Фильтруем аватары по статусу владения
  const filteredAvatars = avatars.filter(avatar => {
    const isOwned = ownedAvatarIds.has(avatar.id);
    
    if (filters.showOwned && !isOwned) return false;
    if (filters.showLocked && isOwned) return false;
    
    return true;
  });

  const handleFiltersChange = (newFilters: AvatarShopFilters) => {
    setFilters(newFilters);
  };

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.error}>
          <h2>Ошибка загрузки магазина</h2>
          <p>{error}</p>
          <button 
            onClick={() => {
              dispatch(clearError());
              dispatch(fetchAvatars(filters));
            }}
            className={styles.retryButton}
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <AvatarFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        userScore={user?.score || 0}
      />

      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner} />
          <p>Загрузка аватаров...</p>
        </div>
      ) : (
        <>
          <div className={styles.resultsHeader}>
            <h3>Найдено аватаров: {filteredAvatars.length}</h3>
            {currentAvatar && (
              <div className={styles.currentAvatar}>
                <span>Текущий аватар: </span>
                <strong>{currentAvatar.name}</strong>
              </div>
            )}
          </div>

          {filteredAvatars.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🎭</div>
              <h3>Аватары не найдены</h3>
              <p>Попробуйте изменить фильтры поиска</p>
            </div>
          ) : (
            <div className={styles.avatarsGrid}>
              {filteredAvatars.map((avatar) => {
                const isOwned = ownedAvatarIds.has(avatar.id);
                const isEquipped = equippedAvatarId === avatar.id;
                const canAfford = (user?.score || 0) >= avatar.price;

                return (
                  <AvatarCard
                    key={avatar.id}
                    avatar={avatar}
                    isOwned={isOwned}
                    isEquipped={isEquipped}
                    canAfford={canAfford}
                  />
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
