import { useState, useEffect } from 'react';
import { avatarApi } from '../api/avatar/avatarApi';
import type { Avatar } from '../types/avatar';

/**
 * Хук для получения аватара пользователя по ID
 * @param userId - ID пользователя
 * @returns объект с аватаром, состоянием загрузки и ошибкой
 */
export const useUserAvatar = (userId: number | undefined) => {
  const [avatar, setAvatar] = useState<Avatar | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setAvatar(null);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchAvatar = async () => {
      try {
        setLoading(true);
        setError(null);
        const userAvatar = await avatarApi.getUserAvatar(userId);
        setAvatar(userAvatar);
      } catch (err) {
        console.error('Ошибка при загрузке аватара пользователя:', err);
        setError(err instanceof Error ? err.message : 'Ошибка загрузки аватара');
        setAvatar(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAvatar();
  }, [userId]);

  return { avatar, loading, error };
};
