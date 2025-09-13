import React, { memo } from 'react';
import { AvatarCardComponent } from './AvatarCard';
import type { Avatar } from '../../../types/avatar';

interface AvatarCardWrapperProps {
  avatar: Avatar;
  isOwned: boolean;
  isEquipped: boolean;
  canAfford: boolean;
}

/**
 * Обертка для AvatarCard с мемоизацией данных
 * Предотвращает ререндеры при неизменных данных аватара
 */
const AvatarCardWrapperComponent: React.FC<AvatarCardWrapperProps> = ({ 
  avatar, 
  isOwned, 
  isEquipped, 
  canAfford 
}) => {
  return (
    <AvatarCardComponent 
      avatar={avatar}
      isOwned={isOwned}
      isEquipped={isEquipped}
      canAfford={canAfford}
    />
  );
};

// Мемоизируем обертку - она перерендерится только если изменились данные
export const AvatarCardWrapper = memo(AvatarCardWrapperComponent, (prevProps, nextProps) => {
  return (
    prevProps.avatar.id === nextProps.avatar.id &&
    prevProps.avatar.name === nextProps.avatar.name &&
    prevProps.avatar.price === nextProps.avatar.price &&
    prevProps.avatar.rarity === nextProps.avatar.rarity &&
    prevProps.avatar.imageUrl === nextProps.avatar.imageUrl &&
    prevProps.avatar.description === nextProps.avatar.description &&
    prevProps.isOwned === nextProps.isOwned &&
    prevProps.isEquipped === nextProps.isEquipped &&
    prevProps.canAfford === nextProps.canAfford
  );
});
