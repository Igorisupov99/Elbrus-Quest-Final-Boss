import React, { useCallback } from 'react';
import type { AvatarShopFilters, AvatarRarity } from '../../../types/avatar';
import styles from './AvatarFilters.module.css';

interface AvatarFiltersProps {
  filters: AvatarShopFilters;
  onFiltersChange: (
    filters: (prev: AvatarShopFilters) => AvatarShopFilters
  ) => void;
  userScore: number;
}

const AvatarFiltersComponent: React.FC<AvatarFiltersProps> = ({
  filters,
  onFiltersChange,
  userScore,
}) => {
  const rarities: { value: AvatarRarity; label: string; color: string }[] = [
    { value: 'common', label: 'Обычный', color: '#9ca3af' },
    { value: 'rare', label: 'Редкий', color: '#3b82f6' },
    { value: 'epic', label: 'Эпический', color: '#8b5cf6' },
    { value: 'legendary', label: 'Легендарный', color: '#f59e0b' },
  ];

  const handleRarityChange = useCallback(
    (rarity: AvatarRarity | undefined) => {
      onFiltersChange((prev) => ({ ...prev, rarity }));
    },
    [onFiltersChange]
  );

  const handleShowOwnedChange = useCallback(
    (showOwned: boolean) => {
      onFiltersChange((prev) => ({ ...prev, showOwned }));
    },
    [onFiltersChange]
  );

  const handleShowLockedChange = useCallback(
    (showLocked: boolean) => {
      onFiltersChange((prev) => ({ ...prev, showLocked }));
    },
    [onFiltersChange]
  );

  const handleSearchChange = useCallback(
    (searchQuery: string) => {
      onFiltersChange((prev) => ({
        ...prev,
        searchQuery: searchQuery || undefined,
      }));
    },
    [onFiltersChange]
  );

  const clearFilters = useCallback(() => {
    onFiltersChange(() => ({}));
  }, [onFiltersChange]);

  return (
    <div className={styles.filtersContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>Магазин аватаров</h2>
        <div className={styles.coins}>
          <span className={styles.coinsIcon}>⭐</span>
          <span className={styles.coinsAmount}>{userScore}</span>
        </div>
      </div>

      <div className={styles.filters}>
        {/* Поиск */}
        <div className={styles.filterGroup}>
          <label className={styles.label}>Поиск</label>
          <input
            type="text"
            placeholder="Поиск аватаров..."
            value={filters.searchQuery || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* Редкость */}
        <div className={styles.filterGroup}>
          <label className={styles.label}>Редкость</label>
          <div className={styles.buttonGroup}>
            <button
              onClick={() => handleRarityChange(undefined)}
              className={`${styles.filterButton} ${
                !filters.rarity ? styles.active : ''
              }`}
            >
              Все
            </button>
            {rarities.map((rarity) => (
              <button
                key={rarity.value}
                onClick={() => handleRarityChange(rarity.value)}
                className={`${styles.filterButton} ${
                  filters.rarity === rarity.value ? styles.active : ''
                }`}
                style={{ borderColor: rarity.color }}
              >
                <span
                  className={styles.rarityDot}
                  style={{ backgroundColor: rarity.color }}
                />
                {rarity.label}
              </button>
            ))}
          </div>
        </div>

        {/* Дополнительные фильтры */}
        <div className={styles.filterGroup}>
          <label className={styles.label}>Показать</label>
          <div className={styles.checkboxGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={filters.showOwned || false}
                onChange={(e) => handleShowOwnedChange(e.target.checked)}
                className={styles.checkbox}
              />
              <span className={styles.checkboxText}>Купленные</span>
            </label>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={filters.showLocked || false}
                onChange={(e) => handleShowLockedChange(e.target.checked)}
                className={styles.checkbox}
              />
              <span className={styles.checkboxText}>Можно приобрести</span>
            </label>
          </div>
        </div>

        {/* Сброс фильтров */}
        <button onClick={clearFilters} className={styles.clearButton}>
          Сбросить фильтры
        </button>
      </div>
    </div>
  );
};

// Экспортируем компонент без мемоизации для стабильности
export const AvatarFilters = AvatarFiltersComponent;
