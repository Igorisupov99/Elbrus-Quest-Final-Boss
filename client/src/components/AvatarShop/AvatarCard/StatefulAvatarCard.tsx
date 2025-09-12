import React, { useState, useCallback, memo, useEffect } from 'react';
import { useAvatarActions } from '../../../hooks/useAvatarActions';
import type { Avatar } from '../../../types/avatar';
import styles from './AvatarCard.module.css';

interface StatefulAvatarCardProps {
  avatar: Avatar;
  initialIsOwned: boolean;
  initialIsEquipped: boolean;
  initialCanAfford: boolean;
  userScore: number;
}

/**
 * Карточка аватара с локальным состоянием
 * Не ререндерится при изменениях других карточек
 */
const StatefulAvatarCardComponent: React.FC<StatefulAvatarCardProps> = ({
  avatar,
  initialIsOwned,
  initialIsEquipped,
  initialCanAfford,
  userScore: _userScore,
}) => {
  console.log(`🎭 StatefulAvatarCard ${avatar.id} render:`, { 
    isOwned: initialIsOwned, 
    isEquipped: initialIsEquipped, 
    canAfford: initialCanAfford 
  });

  // Локальное состояние карточки
  const [isOwned, setIsOwned] = useState(initialIsOwned);
  const [isEquipped, setIsEquipped] = useState(initialIsEquipped);
  const [canAfford, setCanAfford] = useState(initialCanAfford);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isEquipping, setIsEquipping] = useState(false);

  const { handlePurchase, handleEquip, handleUnequip } = useAvatarActions();

  // Обновляем локальное состояние при изменении пропсов
  useEffect(() => {
    setIsOwned(initialIsOwned);
    setIsEquipped(initialIsEquipped);
    setCanAfford(initialCanAfford);
  }, [initialIsOwned, initialIsEquipped, initialCanAfford]);

  const handlePurchaseClick = useCallback(async () => {
    if (!isOwned && canAfford && !isPurchasing) {
      setIsPurchasing(true);
      try {
        await handlePurchase(avatar.id);
        // Обновляем локальное состояние
        setIsOwned(true);
        setCanAfford(false); // Предполагаем, что очков стало меньше
      } catch (error) {
        console.error('Ошибка покупки аватара:', error);
      } finally {
        setIsPurchasing(false);
      }
    }
  }, [isOwned, canAfford, isPurchasing, handlePurchase, avatar.id]);

  const handleEquipClick = useCallback(async () => {
    if (isOwned && !isEquipped && !isEquipping) {
      setIsEquipping(true);
      try {
        await handleEquip(avatar.id);
        // Обновляем локальное состояние
        setIsEquipped(true);
      } catch (error) {
        console.error('Ошибка надевания аватара:', error);
      } finally {
        setIsEquipping(false);
      }
    }
  }, [isOwned, isEquipped, isEquipping, handleEquip, avatar.id]);

  const handleUnequipClick = useCallback(async () => {
    if (isEquipped) {
      try {
        await handleUnequip();
        // Обновляем локальное состояние
        setIsEquipped(false);
      } catch (error) {
        console.error('Ошибка снятия аватара:', error);
      }
    }
  }, [isEquipped, handleUnequip]);

  const getRarityClass = useCallback((rarity: string) => {
    return styles[`rarity-${rarity}`];
  }, []);

  const getRarityLabel = useCallback((rarity: string) => {
    const labels = {
      common: 'Обычный',
      rare: 'Редкий',
      epic: 'Эпический',
      legendary: 'Легендарный',
    };
    return labels[rarity as keyof typeof labels] || rarity;
  }, []);

  return (
    <div className={`${styles.card} ${getRarityClass(avatar.rarity)}`}>
      <div className={styles.imageContainer}>
        <img 
          src={avatar.imageUrl} 
          alt={avatar.name}
          className={styles.avatarImage}
        />
        <div className={styles.rarityBadge}>
          {getRarityLabel(avatar.rarity)}
        </div>
      </div>
      
      <div className={styles.content}>
        <h3 className={styles.name}>{avatar.name}</h3>
        {avatar.description && (
          <p className={styles.description}>{avatar.description}</p>
        )}
        
        <div className={styles.priceContainer}>
          <span className={styles.price}>⭐ {avatar.price}</span>
        </div>

        <div className={styles.actions}>
          {!isOwned ? (
            <button
              onClick={handlePurchaseClick}
              disabled={!canAfford || isPurchasing}
              className={`${styles.button} ${styles.purchaseButton} ${
                !canAfford ? styles.disabled : ''
              }`}
            >
              {isPurchasing ? 'Покупка...' : canAfford ? 'Купить' : 'Недостаточно очков'}
            </button>
          ) : isEquipped ? (
            <button
              onClick={handleUnequipClick}
              disabled={isEquipping}
              className={`${styles.button} ${styles.unequipButton}`}
            >
              Снять
            </button>
          ) : (
            <button
              onClick={handleEquipClick}
              disabled={isEquipping}
              className={`${styles.button} ${styles.equipButton}`}
            >
              {isEquipping ? 'Надевание...' : 'Надеть'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Мемоизируем карточку - она перерендерится только при изменении аватара
export const StatefulAvatarCard = memo(StatefulAvatarCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.avatar.id === nextProps.avatar.id &&
    prevProps.avatar.name === nextProps.avatar.name &&
    prevProps.avatar.price === nextProps.avatar.price &&
    prevProps.avatar.rarity === nextProps.avatar.rarity &&
    prevProps.avatar.imageUrl === nextProps.avatar.imageUrl &&
    prevProps.avatar.description === nextProps.avatar.description &&
    prevProps.initialIsOwned === nextProps.initialIsOwned &&
    prevProps.initialIsEquipped === nextProps.initialIsEquipped &&
    prevProps.initialCanAfford === nextProps.initialCanAfford &&
    prevProps.userScore === nextProps.userScore
  );
});
