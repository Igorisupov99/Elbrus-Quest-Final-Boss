import React, { useState, useCallback, memo } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { purchaseAvatar, equipAvatar, unequipAvatar } from '../../store/avatarSlice';
import type { Avatar } from '../../types/avatar';
import styles from './AvatarCard.module.css';

interface AvatarCardProps {
  avatar: Avatar;
  isOwned: boolean;
  isEquipped: boolean;
  canAfford: boolean;
  userScore: number;
}

const AvatarCardComponent: React.FC<AvatarCardProps> = ({ 
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
        await dispatch(purchaseAvatar({ avatarId: avatar.id })).unwrap();
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
    const rarityLabels: Record<string, string> = {
      common: 'Обычный',
      rare: 'Редкий',
      epic: 'Эпический',
      legendary: 'Легендарный'
    };
    return rarityLabels[rarity] || rarity;
  }, []);

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
    <div className={`${styles.card} ${getRarityClass(avatar.rarity)}`} style={{ backgroundColor: 'transparent' }}>
      <div className={styles.imageContainer} style={{ backgroundColor: 'transparent' }}>
        <img 
          src={avatar.imageUrl} 
          alt={avatar.name}
          className={styles.avatarImage}
          style={{ backgroundColor: 'transparent' }}
        />
        {isEquipped && (
          <div className={styles.equippedBadge} style={{ backgroundColor: 'transparent' }}>
            ✓ Надет
          </div>
        )}
        {isOwned && !isEquipped && (
          <div className={styles.ownedBadge} style={{ backgroundColor: 'transparent' }}>
            ✓ Куплен
          </div>
        )}
      </div>
      
      <div className={styles.content} style={{ backgroundColor: 'transparent' }}>
        <h3 className={styles.name} style={{ backgroundColor: 'transparent' }}>{avatar.name}</h3>
        <p className={styles.description} style={{ backgroundColor: 'transparent' }}>{avatar.description}</p>
        
        <div className={styles.rarity} style={{ backgroundColor: 'transparent' }}>
          <span className={`${styles.rarityLabel} ${getRarityClass(avatar.rarity)}`} style={{ backgroundColor: 'transparent' }}>
            {getRarityLabel(avatar.rarity)}
          </span>
        </div>
        
        <div className={styles.price} style={{ backgroundColor: 'transparent' }}>
          <span className={styles.priceLabel} style={{ backgroundColor: 'transparent' }}>Цена:</span>
          <span className={styles.priceValue} style={{ backgroundColor: 'transparent' }}>{avatar.price} очков</span>
        </div>
        
        <div className={styles.userScore} style={{ backgroundColor: 'transparent' }}>
          <span className={styles.scoreLabel} style={{ backgroundColor: 'transparent' }}>Ваши очки:</span>
          <span className={styles.scoreValue} style={{ backgroundColor: 'transparent' }}>{userScore}</span>
        </div>
      </div>
      
      <div className={styles.actions} style={{ backgroundColor: 'transparent' }}>
        {renderButton()}
      </div>
    </div>
  );
};

// Мемоизируем компонент для предотвращения лишних перерендеров
export const AvatarCard = memo(AvatarCardComponent, (prevProps, nextProps) => {
  // Перерендерим только если изменились релевантные свойства
  return (
    prevProps.avatar.id === nextProps.avatar.id &&
    prevProps.isOwned === nextProps.isOwned &&
    prevProps.isEquipped === nextProps.isEquipped &&
    prevProps.canAfford === nextProps.canAfford &&
    prevProps.userScore === nextProps.userScore
  );
});
