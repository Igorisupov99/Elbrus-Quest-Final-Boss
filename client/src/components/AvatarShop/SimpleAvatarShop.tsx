import React, { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { 
  fetchAvatars, 
  fetchUserAvatars, 
  fetchCurrentAvatar,
  clearError 
} from '../../store/avatarSlice';
import { updateUserScore } from '../../store/authSlice';
import { 
  selectUserScore,
  selectAllAvatarCardsData
} from '../../store/avatarSelectors';
import { SimpleAvatarCard } from './AvatarCard/SimpleAvatarCard';
import { AvatarFilters } from './AvatarFilters/AvatarFilters';
import type { AvatarShopFilters } from '../../types/avatar';
import styles from './AvatarShop.module.css';

/**
 * Упрощенный компонент магазина аватаров
 */
const SimpleAvatarShopComponent: React.FC = () => {
  console.log('🚀 SimpleAvatarShop render');
  
  const dispatch = useAppDispatch();
  const loading = useAppSelector((state) => state.avatar.loading);
  const error = useAppSelector((state) => state.avatar.error);
  
  // Получаем данные напрямую из Redux без селектора
  const avatars = useAppSelector((state) => state.avatar.avatars);
  const userAvatars = useAppSelector((state) => state.avatar.userAvatars);
  const currentAvatar = useAppSelector((state) => state.avatar.currentAvatar);
  const userScore = useAppSelector((state) => state.auth.user?.score || 0);
  
  // Вычисляем данные карточек локально с мемоизацией
  const avatarCardsData = useMemo(() => {
    return avatars.map(avatar => {
      const isOwned = userAvatars.some(ua => ua.avatarId === avatar.id);
      const isEquipped = currentAvatar?.id === avatar.id;
      const canAfford = userScore >= avatar.price;
      
      return {
        avatar,
        isOwned,
        isEquipped,
        canAfford,
      };
    });
  }, [avatars, userAvatars, currentAvatar, userScore]);

  const [filters, setFilters] = useState<AvatarShopFilters>({});

  useEffect(() => {
    // Загружаем данные при монтировании компонента
    const loadData = async () => {
      try {
        await Promise.all([
          dispatch(fetchAvatars({})),
          dispatch(fetchUserAvatars()),
          dispatch(fetchCurrentAvatar())
        ]);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      }
    };
    loadData();
  }, [dispatch]);

  useEffect(() => {
    // Очищаем ошибки при размонтировании
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Применяем локальные фильтры с мемоизацией
  const filteredAvatarCardsData = useMemo(() => {
    return avatarCardsData.filter(({ avatar, isOwned }) => {
      // Фильтр по категории
      if (filters.category && avatar.category !== filters.category) {
        return false;
      }
      
      // Фильтр по редкости
      if (filters.rarity && avatar.rarity !== filters.rarity) {
        return false;
      }
      
      // Фильтр по поиску
      if (filters.searchQuery) {
        const searchLower = filters.searchQuery.toLowerCase();
        if (!avatar.name.toLowerCase().includes(searchLower) && 
            !avatar.description?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      // Фильтр по владению
      if (filters.showOwned && !isOwned) return false;
      if (filters.showLocked && isOwned) return false;
      
      return true;
    });
  }, [avatarCardsData, filters]);

  const handleFiltersChange = useCallback((newFilters: AvatarShopFilters) => {
    setFilters(newFilters);
  }, []);

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.error}>
          <h2>Ошибка загрузки магазина</h2>
          <p>{error}</p>
          <button 
            onClick={() => {
              dispatch(clearError());
              dispatch(fetchAvatars({}));
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
        userScore={userScore}
      />

      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner} />
          <p>Загрузка аватаров...</p>
        </div>
      ) : (
        <>
          <div className={styles.resultsHeader}>
            <h2>Доступные аватары</h2>
            <p>Найдено: {filteredAvatarCardsData.length} аватаров</p>
            {avatarCardsData.find(card => card.isEquipped) && (
              <p>Текущий аватар: {avatarCardsData.find(card => card.isEquipped)?.avatar.name}</p>
            )}
          </div>

          {filteredAvatarCardsData.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🎭</div>
              <h3>Аватары не найдены</h3>
              <p>Попробуйте изменить фильтры поиска</p>
            </div>
          ) : (
            <div className={styles.avatarGrid}>
              {filteredAvatarCardsData.map(({ avatar, isOwned, isEquipped, canAfford }) => (
                <SimpleAvatarCard
                  key={avatar.id}
                  avatar={avatar}
                  isOwned={isOwned}
                  isEquipped={isEquipped}
                  canAfford={canAfford}
                  userScore={userScore}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Экспортируем компонент без мемоизации для избежания циклов
export const SimpleAvatarShop = SimpleAvatarShopComponent;