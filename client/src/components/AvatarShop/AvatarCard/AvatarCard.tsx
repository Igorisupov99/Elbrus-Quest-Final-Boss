import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { purchaseAvatar, equipAvatar, unequipAvatar, fetchUserAvatars } from '../../../store/avatarSlice';
import { updateUserScore } from '../../../store/authSlice';
import type { Avatar } from '../../../types/avatar';
import styles from './AvatarCard.module.css';

interface AvatarCardProps {
  avatar: Avatar;
  isOwned: boolean;
  isEquipped: boolean;
  canAfford: boolean;
}

export const AvatarCard: React.FC<AvatarCardProps> = ({
  avatar,
  isOwned,
  isEquipped,
  canAfford,
}) => {
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.avatar);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isEquipping, setIsEquipping] = useState(false);

  const handlePurchase = async () => {
    if (!isOwned && canAfford && !isPurchasing) {
      setIsPurchasing(true);
      try {
        const result = await dispatch(purchaseAvatar({ avatarId: avatar.id })).unwrap();
        // Обновляем очки пользователя в auth state
        dispatch(updateUserScore(result.score));
        // Обновляем список пользовательских аватаров
        dispatch(fetchUserAvatars());
      } catch (error) {
        console.error('Ошибка покупки аватара:', error);
      } finally {
        setIsPurchasing(false);
      }
    }
  };

  const handleEquip = async () => {
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
  };

  const handleUnequip = async () => {
    if (isEquipped) {
      try {
        await dispatch(unequipAvatar()).unwrap();
      } catch (error) {
        console.error('Ошибка снятия аватара:', error);
      }
    }
  };

  const getRarityClass = (rarity: string) => {
    return styles[`rarity-${rarity}`];
  };

  const getRarityLabel = (rarity: string) => {
    const labels = {
      common: 'Обычный',
      rare: 'Редкий',
      epic: 'Эпический',
      legendary: 'Легендарный',
    };
    return labels[rarity as keyof typeof labels] || rarity;
  };

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
              disabled={loading}
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
