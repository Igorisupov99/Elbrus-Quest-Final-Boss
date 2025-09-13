import React, { useEffect, useState, useMemo, useCallback, memo, useRef } from 'react';
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

const AvatarShopComponent: React.FC = () => {
  console.log('🚀 AvatarShop render');
  
  const dispatch = useAppDispatch();
  const loading = useAppSelector((state) => state.avatar.loading);
  const error = useAppSelector((state) => state.avatar.error);

  const [filters, setFilters] = useState<AvatarShopFilters>({});

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

  // Мемоизируем только серверные фильтры для предотвращения лишних запросов
  const serverFilters = useMemo(() => ({
    category: filters.category,
    rarity: filters.rarity,
    searchQuery: filters.searchQuery
  }), [
    filters.category,
    filters.rarity,
    filters.searchQuery
  ]);

  // Флаг для отслеживания, нужно ли применить фильтры
  const [shouldApplyFilters, setShouldApplyFilters] = useState(false);

  useEffect(() => {
    // Применяем фильтры только если они действительно изменились и нужно их применить
    if (shouldApplyFilters) {
      dispatch(fetchAvatars(serverFilters));
      setShouldApplyFilters(false);
    }
  }, [dispatch, serverFilters, shouldApplyFilters]);

  useEffect(() => {
    // Очищаем ошибки при размонтировании
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Используем мемоизированные селекторы
  const userScore = useAppSelector(selectUserScore);
  
  // Получаем базовые данные из Redux
  const avatars = useAppSelector((state) => state.avatar.avatars);
  const userAvatars = useAppSelector((state) => state.avatar.userAvatars);
  const currentAvatar = useAppSelector((state) => state.avatar.currentAvatar);
  
  // Используем useRef для хранения данных без ререндеров
  const avatarCardsDataRef = useRef<any[]>([]);
  const filteredCardsDataRef = useRef<any[]>([]);
  const isDataInitialized = useRef(false);
  
  // Вычисляем данные при изменении аватаров или фильтров
  useEffect(() => {
    if (avatars.length > 0) {
      console.log('🔄 Computing avatar cards data');
      const ownedAvatarIds = new Set(userAvatars.map(ua => ua.avatarId));
      const equippedAvatarId = currentAvatar?.id;
      
      avatarCardsDataRef.current = avatars.map(avatar => ({
        avatar,
        isOwned: ownedAvatarIds.has(avatar.id),
        isEquipped: equippedAvatarId === avatar.id,
        canAfford: userScore >= avatar.price,
      }));
      
      // Применяем фильтры
      console.log('🔍 Applying local filters');
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

  // Не мемоизируем список карточек - полагаемся на мемоизацию самих компонентов

  const handleFiltersChange = useCallback((filtersUpdater: (prev: AvatarShopFilters) => AvatarShopFilters) => {
    setFilters(prevFilters => {
      const newFilters = filtersUpdater(prevFilters);
      // Проверяем, изменились ли серверные фильтры
      const hasServerFilterChanges = 
        newFilters.category !== prevFilters.category ||
        newFilters.rarity !== prevFilters.rarity ||
        newFilters.searchQuery !== prevFilters.searchQuery;
      
      if (hasServerFilterChanges) {
        setShouldApplyFilters(true); // Устанавливаем флаг для применения фильтров
      }
      
      return newFilters;
    });
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
              dispatch(fetchAvatars(serverFilters));
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
            currentAvatar={currentAvatar} 
          />

          {filteredAvatarCardsData.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🎭</div>
              <h3>Аватары не найдены</h3>
              <p>Попробуйте изменить фильтры поиска</p>
            </div>
          ) : (
            <AvatarGrid avatarCardsData={filteredAvatarCardsData} userScore={userScore} />
          )}
        </>
      )}
    </div>
  );
};

// Мемоизируем компонент для предотвращения ненужных ререндеров
export const AvatarShop = memo(AvatarShopComponent);
