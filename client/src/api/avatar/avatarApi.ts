import api from '../axios';
import type { 
  Avatar, 
  UserAvatar, 
  AvatarPurchaseRequest, 
  AvatarEquipRequest,
  AvatarShopFilters 
} from '../../types/avatar';

export const avatarApi = {
  // Получить все доступные аватары
  async getAvatars(filters?: AvatarShopFilters): Promise<Avatar[]> {
    const params = new URLSearchParams();
    
    if (filters?.category) params.append('category', filters.category);
    if (filters?.rarity) params.append('rarity', filters.rarity);
    if (filters?.showOwned !== undefined) params.append('showOwned', filters.showOwned.toString());
    if (filters?.showLocked !== undefined) params.append('showLocked', filters.showLocked.toString());
    if (filters?.searchQuery) params.append('search', filters.searchQuery);

    const response = await api.get(`/api/avatars?${params.toString()}`);
    return response.data;
  },

  // Получить аватары пользователя
  async getUserAvatars(): Promise<UserAvatar[]> {
    const response = await api.get('/api/avatars/user');
    return response.data;
  },

  // Купить аватар
  async purchaseAvatar(data: AvatarPurchaseRequest): Promise<{ success: boolean; score: number }> {
    const response = await api.post('/api/avatars/purchase', data);
    return response.data;
  },

  // Надеть аватар
  async equipAvatar(data: AvatarEquipRequest): Promise<{ success: boolean }> {
    const response = await api.post('/api/avatars/equip', data);
    return response.data;
  },

  // Снять аватар
  async unequipAvatar(): Promise<{ success: boolean }> {
    const response = await api.post('/api/avatars/unequip');
    return response.data;
  },

  // Получить текущий аватар пользователя
  async getCurrentAvatar(): Promise<Avatar | null> {
    const response = await api.get('/api/avatars/current');
    return response.data;
  }
};
