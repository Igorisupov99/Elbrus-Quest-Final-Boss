import React, { useState, useCallback } from 'react';
import { useAppDispatch } from '../../../store/hooks';
import { purchaseAvatar, equipAvatar, unequipAvatar } from '../../../store/avatarSlice';
import type { Avatar } from '../../../types/avatar';
import styles from './AvatarCard.module.css';

interface AvatarCardProps {
  avatar: Avatar;
  isOwned: boolean;
  isEquipped: boolean;
  canAfford: boolean;
}

export const AvatarCardComponent: React.FC<AvatarCardProps> = ({ 
  avatar, 
  isOwned, 
  isEquipped, 
  canAfford 
}) => {
  // console.log(`🎭 AvatarCard ${avatar.id} render:`, { isOwned, isEquipped, canAfford });
  
  const dispatch = useAppDispatch();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isEquipping, setIsEquipping] = useState(false);

  const handlePurchase = useCallback(async () => {
    if (!isOwned && canAfford && !isPurchasing) {
      setIsPurchasing(true);
      try {
        await dispatch(purchaseAvatar({ avatarId: avatar.id })).unwrap();
        // Состояние обновляется автоматически в Redux slice
      } catch (error) {
        console.error('Ошибка покупки аватара:', error);
      } finally {
        setIsPurchasing(false);
      }
    }
  }, [dispatch, avatar.id, isOwned, canAfford, isPurchasing]);

  const handleEquip = useCallback(async () => {
    if (isOwned && !isEquipped && !isEquipping) {
      setIsEquipping(true);
      try {
        await dispatch(equipAvatar({ avatarId: avatar.id })).unwrap();
      } catch (error) {
        console.error('Ошибка надевания аватара:', error);
      } finally {
        setIsEquipping(false);
      }
    }
  }, [dispatch, avatar.id, isOwned, isEquipped, isEquipping]);

  const handleUnequip = useCallback(async () => {
    if (isEquipped) {
      try {
        await dispatch(unequipAvatar()).unwrap();
      } catch (error) {
        console.error('Ошибка снятия аватара:', error);
      }
    }
  }, [dispatch, isEquipped]);

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
              onClick={handlePurchase}
              disabled={!canAfford || isPurchasing}
              className={`${styles.button} ${styles.purchaseButton} ${
                !canAfford ? styles.disabled : ''
              }`}
            >
              {isPurchasing ? 'Покупка...' : canAfford ? 'Купить' : 'Недостаточно очков'}
            </button>
          ) : isEquipped ? (
            <button
              onClick={handleUnequip}
              disabled={isEquipping}
              className={`${styles.button} ${styles.unequipButton}`}
            >
              Снять
            </button>
          ) : (
            <button
              onClick={handleEquip}
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

// AvatarCard теперь экспортируется как обычный компонент
// Мемоизация происходит в AvatarCardWrapper
