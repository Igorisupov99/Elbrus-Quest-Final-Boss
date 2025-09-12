import React, { memo } from 'react';
import { StaticAvatarCard } from './AvatarCard/StaticAvatarCard';
import type { Avatar } from '../../types/avatar';

interface AvatarCardData {
  avatar: Avatar;
  isOwned: boolean;
  isEquipped: boolean;
  canAfford: boolean;
}

interface AvatarGridProps {
  avatarCardsData: AvatarCardData[];
  userScore: number;
}

/**
 * Мемоизированная сетка аватаров
 * Перерендерится только при изменении списка карточек
 */
const AvatarGridComponent: React.FC<AvatarGridProps> = ({ avatarCardsData, userScore }) => {
  console.log('🎨 AvatarGrid render with', avatarCardsData.length, 'cards');
  
  return (
    <div className="avatars-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem', padding: '1rem' }}>
      {avatarCardsData.map(({ avatar, isOwned, isEquipped, canAfford }) => (
        <StaticAvatarCard
          key={avatar.id}
          avatar={avatar}
          initialIsOwned={isOwned}
          initialIsEquipped={isEquipped}
          initialCanAfford={canAfford}
          userScore={userScore}
        />
      ))}
    </div>
  );
};

// Мемоизируем сетку - она перерендерится только при изменении данных карточек
export const AvatarGrid = memo(AvatarGridComponent, (prevProps, nextProps) => {
  // Сравниваем длину и содержимое массива
  if (prevProps.avatarCardsData.length !== nextProps.avatarCardsData.length) {
    return false; // Ререндерить
  }
  
  // Сравниваем userScore
  if (prevProps.userScore !== nextProps.userScore) {
    return false; // Ререндерить
  }
  
  // Сравниваем каждую карточку
  return prevProps.avatarCardsData.every((prevCard, index) => {
    const nextCard = nextProps.avatarCardsData[index];
    return (
      prevCard.avatar.id === nextCard.avatar.id &&
      prevCard.isOwned === nextCard.isOwned &&
      prevCard.isEquipped === nextCard.isEquipped &&
      prevCard.canAfford === nextCard.canAfford
    );
  });
});
