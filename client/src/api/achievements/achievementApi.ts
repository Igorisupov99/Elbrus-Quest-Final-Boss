import axios from '../axios';
import { Achievement, UserAchievement, AchievementStats } from '../../types/achievement';

export const achievementApi = {
  // Получить все достижения пользователя
  async getUserAchievements(): Promise<{
    achievements: UserAchievement[];
    stats: AchievementStats;
  }> {
    const response = await axios.get('/api/achievement/user');
    return response.data;
  },

  // Получить все доступные достижения
  async getAllAchievements(): Promise<{
    achievements: Achievement[];
    categories: string[];
    rarities: string[];
  }> {
    const response = await axios.get('/api/achievement/all');
    return response.data;
  }
};
