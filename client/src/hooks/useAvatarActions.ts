import { useCallback } from 'react';
import { useAppDispatch } from '../store/hooks';
import { purchaseAvatar, equipAvatar, unequipAvatar } from '../store/avatarSlice';

/**
 * Хук для действий с аватарами без ререндеров
 * Обновляет только локальное состояние, не вызывая ререндеры карточек
 */
export const useAvatarActions = () => {
  const dispatch = useAppDispatch();

  const handlePurchase = useCallback(async (avatarId: number) => {
    try {
      await dispatch(purchaseAvatar({ avatarId })).unwrap();
      // Не обновляем UI - карточка сама обновит свое состояние
    } catch (error) {
      console.error('Ошибка покупки аватара:', error);
      throw error;
    }
  }, [dispatch]);

  const handleEquip = useCallback(async (avatarId: number) => {
    try {
      await dispatch(equipAvatar({ avatarId })).unwrap();
      // Не обновляем UI - карточка сама обновит свое состояние
    } catch (error) {
      console.error('Ошибка надевания аватара:', error);
      throw error;
    }
  }, [dispatch]);

  const handleUnequip = useCallback(async () => {
    try {
      await dispatch(unequipAvatar()).unwrap();
      // Не обновляем UI - карточка сама обновит свое состояние
    } catch (error) {
      console.error('Ошибка снятия аватара:', error);
      throw error;
    }
  }, [dispatch]);

  return {
    handlePurchase,
    handleEquip,
    handleUnequip,
  };
};
