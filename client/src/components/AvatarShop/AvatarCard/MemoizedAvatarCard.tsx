import React, { memo } from 'react';
import { AvatarCardComponent } from './AvatarCard';
import type { Avatar } from '../../../types/avatar';

interface MemoizedAvatarCardProps {
  avatar: Avatar;
  isOwned: boolean;
  isEquipped: boolean;
  canAfford: boolean;
}

/**
 * Мемоизированная карточка аватара
 * Перерендерится только при изменении данных аватара или его статуса
 */
const MemoizedAvatarCardComponent: React.FC<MemoizedAvatarCardProps> = ({ 
  avatar, 
  isOwned, 
  isEquipped, 
  canAfford 
}) => {
  console.log(`🎭 MemoizedAvatarCard ${avatar.id} render:`, { isOwned, isEquipped, canAfford });
  
  return (
    <AvatarCardComponent 
      avatar={avatar}
      isOwned={isOwned}
      isEquipped={isEquipped}
      canAfford={canAfford}
    />
  );
};

// Строгая мемоизация - компонент перерендерится только при изменении данных
export const MemoizedAvatarCard = memo(MemoizedAvatarCardComponent, (prevProps, nextProps) => {
  const avatarChanged = 
    prevProps.avatar.id !== nextProps.avatar.id ||
    prevProps.avatar.name !== nextProps.avatar.name ||
    prevProps.avatar.price !== nextProps.avatar.price ||
    prevProps.avatar.rarity !== nextProps.avatar.rarity ||
    prevProps.avatar.imageUrl !== nextProps.avatar.imageUrl ||
    prevProps.avatar.description !== nextProps.avatar.description;
    
  const statusChanged = 
    prevProps.isOwned !== nextProps.isOwned ||
    prevProps.isEquipped !== nextProps.isEquipped ||
    prevProps.canAfford !== nextProps.canAfford;
    
  // Возвращаем true если ничего не изменилось (не ререндерить)
  // Возвращаем false если что-то изменилось (ререндерить)
  return !avatarChanged && !statusChanged;
});
