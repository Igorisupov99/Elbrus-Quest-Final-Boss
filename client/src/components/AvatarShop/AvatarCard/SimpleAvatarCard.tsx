import React, { useState, useCallback } from 'react';
import { useAppDispatch } from '../../../store/hooks';
import { purchaseAvatar, equipAvatar, unequipAvatar } from '../../../store/avatarSlice';
import { updateUserScore } from '../../../store/authSlice';
import type { Avatar } from '../../../types/avatar';
import styles from './AvatarCard.module.css';

interface SimpleAvatarCardProps {
  avatar: Avatar;
  isOwned: boolean;
  isEquipped: boolean;
  canAfford: boolean;
  userScore: number;
}

/**
 * Простая карточка аватара без сложных оптимизаций
 */
export const SimpleAvatarCard: React.FC<SimpleAvatarCardProps> = ({ 
  avatar, 
  isOwned, 
  isEquipped, 
  canAfford,
  userScore
}) => {
  const dispatch = useAppDispatch();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isEquipping, setIsEquipping] = useState(false);

  const handlePurchase = useCallback(async () => {
    if (!isOwned && canAfford && !isPurchasing) {
      setIsPurchasing(true);
      try {
        const result = await dispatch(purchaseAvatar({ avatarId: avatar.id })).unwrap();
        // Обновляем очки пользователя локально
        dispatch(updateUserScore(result.score));
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

  const getRarityClass = (rarity: string) => {
    return styles[`rarity-${rarity}`];
  };

  const getRarityLabel = (rarity: string) => {
    const rarityLabels: Record<string, string> = {
      common: 'Обычный',
      rare: 'Редкий',
      epic: 'Эпический',
      legendary: 'Легендарный'
    };
    return rarityLabels[rarity] || rarity;
  };

  const renderButton = () => {
    if (isPurchasing) {
      return (
        <button className={styles.button} disabled>
          Покупка...
        </button>
      );
    }

    if (isEquipping) {
      return (
        <button className={styles.button} disabled>
          Надевание...
        </button>
      );
    }

    if (!isOwned) {
      return (
        <button 
          className={`${styles.button} ${styles.purchaseButton}`}
          onClick={handlePurchase}
          disabled={!canAfford}
        >
          {canAfford ? `Купить за ${avatar.price}` : `Недостаточно очков (${avatar.price})`}
        </button>
      );
    }

    if (isEquipped) {
      return (
        <button 
          className={`${styles.button} ${styles.unequipButton}`}
          onClick={handleUnequip}
        >
          Снять
        </button>
      );
    }

    return (
      <button 
        className={`${styles.button} ${styles.equipButton}`}
        onClick={handleEquip}
      >
        Надеть
      </button>
    );
  };

  return (
    <div className={`${styles.card} ${getRarityClass(avatar.rarity)}`}>
      <div className={styles.imageContainer}>
        <img 
          src={avatar.imageUrl} 
          alt={avatar.name}
          className={styles.avatarImage}
        />
        {isEquipped && (
          <div className={styles.equippedBadge}>
            ✓ Надет
          </div>
        )}
        {isOwned && !isEquipped && (
          <div className={styles.ownedBadge}>
            ✓ Куплен
          </div>
        )}
      </div>
      
      <div className={styles.content}>
        <h3 className={styles.name}>{avatar.name}</h3>
        <p className={styles.description}>{avatar.description}</p>
        
        <div className={styles.rarity}>
          <span className={`${styles.rarityLabel} ${getRarityClass(avatar.rarity)}`}>
            {getRarityLabel(avatar.rarity)}
          </span>
        </div>
        
        <div className={styles.price}>
          <span className={styles.priceLabel}>Цена:</span>
          <span className={styles.priceValue}>{avatar.price} очков</span>
        </div>
        
        <div className={styles.userScore}>
          <span className={styles.scoreLabel}>Ваши очки:</span>
          <span className={styles.scoreValue}>{userScore}</span>
        </div>
      </div>
      
      <div className={styles.actions}>
        {renderButton()}
      </div>
    </div>
  );
};
