import React, { useEffect, useState, useCallback, memo, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { 
  fetchAvatars, 
  fetchUserAvatars, 
  fetchCurrentAvatar,
  clearError 
} from '../../store/avatarSlice';
import { 
  selectUserScore 
} from '../../store/avatarSelectors';
import { AvatarGrid } from './AvatarGrid';
import { ResultsHeader } from './ResultsHeader';
import { AvatarFilters } from './AvatarFilters/AvatarFilters';
import type { AvatarShopFilters } from '../../types/avatar';
import styles from './AvatarShop.module.css';

/**
 * Статичный компонент магазина аватаров
 * НЕ ререндерится при изменениях состояния
 */
const StaticAvatarShopComponent: React.FC = () => {
  console.log('🚀 StaticAvatarShop render');
  
  const dispatch = useAppDispatch();
  const loading = useAppSelector((state) => state.avatar.loading);
  const error = useAppSelector((state) => state.avatar.error);
  const userScore = useAppSelector(selectUserScore);

  const [filters, setFilters] = useState<AvatarShopFilters>({});

  // Используем useRef для хранения данных без ререндеров
  const avatarCardsDataRef = useRef<any[]>([]);
  const filteredCardsDataRef = useRef<any[]>([]);
  const isDataInitialized = useRef(false);

  useEffect(() => {
    // Загружаем данные при монтировании компонента
    const loadData = async () => {
      await Promise.all([
        dispatch(fetchAvatars({})), // Загружаем все аватары без фильтров
        dispatch(fetchUserAvatars()),
        dispatch(fetchCurrentAvatar())
      ]);
    };
    loadData();
  }, [dispatch]);

  // Используем useRef для хранения всех данных без ререндеров
  const avatarsRef = useRef<any[]>([]);
  const userAvatarsRef = useRef<any[]>([]);
  const currentAvatarRef = useRef<any>(null);
  const userScoreRef = useRef<number>(0);
  
  // Получаем данные из Redux только для инициализации
  const avatars = useAppSelector((state) => state.avatar.avatars);
  const userAvatars = useAppSelector((state) => state.avatar.userAvatars);
  const currentAvatar = useAppSelector((state) => state.avatar.currentAvatar);
  
  // Обновляем refs при изменении данных
  useEffect(() => {
    avatarsRef.current = avatars;
    userAvatarsRef.current = userAvatars;
    currentAvatarRef.current = currentAvatar;
    userScoreRef.current = userScore;
  }, [avatars, userAvatars, currentAvatar, userScore]);
  
  // Вычисляем данные только один раз при монтировании
  useEffect(() => {
    if (!isDataInitialized.current && avatars.length > 0) {
      console.log('🔄 Computing avatar cards data (one time only)');
      
      const ownedAvatarIds = new Set(userAvatars.map((ua: any) => ua.avatarId));
      const equippedAvatarId = currentAvatar?.id;
      
      avatarCardsDataRef.current = avatars.map((avatar: any) => ({
        avatar,
        isOwned: ownedAvatarIds.has(avatar.id),
        isEquipped: equippedAvatarId === avatar.id,
        canAfford: userScore >= avatar.price,
      }));
      
      // Применяем фильтры
      console.log('🔍 Applying local filters (one time only)');
      filteredCardsDataRef.current = avatarCardsDataRef.current.filter(({ isOwned }) => {
        if (filters.showOwned && !isOwned) return false;
        if (filters.showLocked && isOwned) return false;
        return true;
      });
      
      isDataInitialized.current = true;
    }
  }, [avatars, userAvatars, currentAvatar?.id, userScore, filters.showOwned, filters.showLocked]);

  // Используем стабильные данные
  const filteredAvatarCardsData = filteredCardsDataRef.current;

  const handleFiltersChange = useCallback((filtersUpdater: (prev: AvatarShopFilters) => AvatarShopFilters) => {
    setFilters(prevFilters => {
      const newFilters = filtersUpdater(prevFilters);
      // Проверяем, изменились ли серверные фильтры
      const hasServerFilterChanges = 
        newFilters.category !== prevFilters.category ||
        newFilters.rarity !== prevFilters.rarity ||
        newFilters.searchQuery !== prevFilters.searchQuery;
      
      if (hasServerFilterChanges) {
        // Применяем серверные фильтры
        dispatch(fetchAvatars({
          category: newFilters.category,
          rarity: newFilters.rarity,
          searchQuery: newFilters.searchQuery
        }));
      }
      
      return newFilters;
    });
  }, [dispatch]);

  useEffect(() => {
    // Очищаем ошибки при размонтировании
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

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
          <ResultsHeader 
            count={filteredAvatarCardsData.length} 
            currentAvatar={currentAvatarRef.current} 
          />

          {filteredAvatarCardsData.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🎭</div>
              <h3>Аватары не найдены</h3>
              <p>Попробуйте изменить фильтры поиска</p>
            </div>
          ) : (
            <AvatarGrid avatarCardsData={filteredAvatarCardsData} userScore={userScoreRef.current} />
          )}
        </>
      )}
    </div>
  );
};

// Мемоизируем компонент - он НЕ будет ререндериться
export const StaticAvatarShop = memo(StaticAvatarShopComponent, () => true);
