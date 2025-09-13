import React, { useCallback, memo, useRef, useEffect } from 'react';
import { useAvatarActions } from '../../../hooks/useAvatarActions';
import type { Avatar } from '../../../types/avatar';
import styles from './AvatarCard.module.css';

interface StaticAvatarCardProps {
  avatar: Avatar;
  initialIsOwned: boolean;
  initialIsEquipped: boolean;
  initialCanAfford: boolean;
  userScore: number;
}

/**
 * Статичная карточка аватара
 * НЕ ререндерится вообще - управляет состоянием через refs
 */
const StaticAvatarCardComponent: React.FC<StaticAvatarCardProps> = ({
  avatar,
  initialIsOwned,
  initialIsEquipped,
  initialCanAfford,
  userScore: _userScore,
}) => {
  console.log(`🎭 StaticAvatarCard ${avatar.id} render:`, { 
    isOwned: initialIsOwned, 
    isEquipped: initialIsEquipped, 
    canAfford: initialCanAfford 
  });

  // Используем refs для хранения состояния без ререндеров
  const stateRef = useRef({
    isOwned: initialIsOwned,
    isEquipped: initialIsEquipped,
    canAfford: initialCanAfford,
    isPurchasing: false,
    isEquipping: false,
  });

  // Функция для обновления UI без ререндера
  const updateUI = useCallback(() => {
    const cardElement = document.querySelector(`[data-avatar-id="${avatar.id}"]`);
    if (!cardElement) return;

    const button = cardElement.querySelector(`.${styles.button}`) as HTMLButtonElement;
    if (!button) return;

    const { isOwned, isEquipped, isPurchasing, isEquipping, canAfford } = stateRef.current;

    if (!isOwned) {
      button.textContent = isPurchasing ? 'Покупка...' : (canAfford ? 'Купить' : 'Недостаточно очков');
      button.className = `${styles.button} ${styles.purchaseButton} ${!canAfford ? styles.disabled : ''}`;
      button.disabled = !canAfford || isPurchasing;
    } else if (isEquipped) {
      button.textContent = 'Снять';
      button.className = `${styles.button} ${styles.unequipButton}`;
      button.disabled = false;
    } else {
      button.textContent = isEquipping ? 'Надевание...' : 'Надеть';
      button.className = `${styles.button} ${styles.equipButton}`;
      button.disabled = isEquipping;
    }
  }, [avatar.id]);

  // Функция для обновления других карточек при надевании/снятии аватара
  const updateOtherCards = useCallback(() => {
    // Находим все карточки аватаров и обновляем их состояние
    const allCards = document.querySelectorAll('[data-avatar-id]');
    allCards.forEach(card => {
      const avatarId = card.getAttribute('data-avatar-id');
      if (avatarId && avatarId !== avatar.id.toString()) {
        // Сбрасываем статус "надет" для всех других карточек
        const button = card.querySelector(`.${styles.button}`) as HTMLButtonElement;
        if (button && button.textContent === 'Снять') {
          button.textContent = 'Надеть';
          button.className = `${styles.button} ${styles.equipButton}`;
          button.disabled = false;
        }
      }
    });
  }, [avatar.id]);

  // Обновляем состояние при изменении пропсов
  useEffect(() => {
    stateRef.current.isOwned = initialIsOwned;
    stateRef.current.isEquipped = initialIsEquipped;
    stateRef.current.canAfford = initialCanAfford;
    updateUI();
  }, [initialIsOwned, initialIsEquipped, initialCanAfford, updateUI]);

  const { handlePurchase, handleEquip, handleUnequip } = useAvatarActions();

  const handlePurchaseClick = useCallback(async () => {
    const { isOwned, canAfford, isPurchasing } = stateRef.current;
    if (!isOwned && canAfford && !isPurchasing) {
      stateRef.current.isPurchasing = true;
      updateUI();
      
      try {
        await handlePurchase(avatar.id);
        stateRef.current.isOwned = true;
        stateRef.current.canAfford = false;
        stateRef.current.isPurchasing = false;
        updateUI();
      } catch (error) {
        console.error('Ошибка покупки аватара:', error);
        stateRef.current.isPurchasing = false;
        updateUI();
      }
    }
  }, [handlePurchase, avatar.id, updateUI]);

  const handleEquipClick = useCallback(async () => {
    const { isOwned, isEquipped, isEquipping } = stateRef.current;
    if (isOwned && !isEquipped && !isEquipping) {
      stateRef.current.isEquipping = true;
      updateUI();
      
      try {
        await handleEquip(avatar.id);
        stateRef.current.isEquipped = true;
        stateRef.current.isEquipping = false;
        updateUI();
        
        // Обновляем все другие карточки, чтобы снять с них статус "надет"
        updateOtherCards();
      } catch (error) {
        console.error('Ошибка надевания аватара:', error);
        stateRef.current.isEquipping = false;
        updateUI();
      }
    }
  }, [handleEquip, avatar.id, updateUI]);

  const handleUnequipClick = useCallback(async () => {
    const { isEquipped } = stateRef.current;
    if (isEquipped) {
      try {
        await handleUnequip();
        stateRef.current.isEquipped = false;
        updateUI();
      } catch (error) {
        console.error('Ошибка снятия аватара:', error);
      }
    }
  }, [handleUnequip, updateUI]);

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
    <div className={`${styles.card} ${getRarityClass(avatar.rarity)}`} data-avatar-id={avatar.id}>
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
          {!initialIsOwned ? (
            <button
              onClick={handlePurchaseClick}
              disabled={!initialCanAfford}
              className={`${styles.button} ${styles.purchaseButton} ${
                !initialCanAfford ? styles.disabled : ''
              }`}
            >
              {initialCanAfford ? 'Купить' : 'Недостаточно очков'}
            </button>
          ) : initialIsEquipped ? (
            <button
              onClick={handleUnequipClick}
              className={`${styles.button} ${styles.unequipButton}`}
            >
              Снять
            </button>
          ) : (
            <button
              onClick={handleEquipClick}
              className={`${styles.button} ${styles.equipButton}`}
            >
              Надеть
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Мемоизируем карточку - она НЕ будет ререндериться
export const StaticAvatarCard = memo(StaticAvatarCardComponent, () => true);
