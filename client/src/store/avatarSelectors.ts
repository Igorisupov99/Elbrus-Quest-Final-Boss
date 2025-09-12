import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from './store';

// Селектор для получения ID купленных аватаров
export const selectOwnedAvatarIds = createSelector(
  [(state: RootState) => state.avatar.userAvatars],
  (userAvatars) => new Set(userAvatars.map(ua => ua.avatarId))
);

// Селектор для получения ID надетого аватара
export const selectEquippedAvatarId = createSelector(
  [(state: RootState) => state.avatar.currentAvatar],
  (currentAvatar) => currentAvatar?.id
);

// Селектор для получения очков пользователя
export const selectUserScore = createSelector(
  [(state: RootState) => state.auth.user],
  (user) => user?.score || 0
);

// Селектор для получения отфильтрованных аватаров
export const selectFilteredAvatars = createSelector(
  [
    (state: RootState) => state.avatar.avatars,
    selectOwnedAvatarIds,
    (_state: RootState, filters: { showOwned?: boolean; showLocked?: boolean }) => filters
  ],
  (avatars, ownedAvatarIds, filters) => {
    console.log('🔍 selectFilteredAvatars recalculating');
    return avatars.filter(avatar => {
      const isOwned = ownedAvatarIds.has(avatar.id);
      
      if (filters.showOwned && !isOwned) return false;
      if (filters.showLocked && isOwned) return false;
      
      return true;
    });
  }
);

// Селектор для получения данных карточек аватаров с мемоизацией
export const selectAvatarCardsData = createSelector(
  [selectFilteredAvatars, selectOwnedAvatarIds, selectEquippedAvatarId, selectUserScore],
  (filteredAvatars, ownedAvatarIds, equippedAvatarId, userScore) => {
    console.log('🔄 selectAvatarCardsData recalculating');
    return filteredAvatars.map(avatar => ({
      avatar,
      isOwned: ownedAvatarIds.has(avatar.id),
      isEquipped: equippedAvatarId === avatar.id,
      canAfford: userScore >= avatar.price,
    }));
  }
);

// Селектор для получения всех аватаров (без фильтрации)
export const selectAllAvatars = createSelector(
  [(state: RootState) => state.avatar.avatars],
  (avatars) => avatars
);

// Селектор для получения данных всех карточек аватаров (без фильтрации)
export const selectAllAvatarCardsData = createSelector(
  [selectAllAvatars, selectOwnedAvatarIds, selectEquippedAvatarId, selectUserScore],
  (avatars, ownedAvatarIds, equippedAvatarId, userScore) => {
    console.log('🔄 selectAllAvatarCardsData recalculating');
    return avatars.map(avatar => ({
      avatar,
      isOwned: ownedAvatarIds.has(avatar.id),
      isEquipped: equippedAvatarId === avatar.id,
      canAfford: userScore >= avatar.price,
    }));
  }
);

// Селектор для проверки, может ли пользователь купить аватар
export const createCanAffordSelector = (avatarPrice: number) =>
  createSelector(
    [selectUserScore],
    (userScore) => userScore >= avatarPrice
  );
