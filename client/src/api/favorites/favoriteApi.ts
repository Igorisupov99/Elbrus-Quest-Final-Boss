import api from '../axios';

export interface FavoriteQuestion {
  id: number;
  questionId: number;
  question: {
    id: number;
    text: string;
    correctAnswer: string;
    questionType: string;
    mentorTip: string;
    topic: {
      id: number;
      title: string;
      phaseId: number;
    };
  };
  createdAt: string;
}

export interface FavoritesResponse {
  favorites: FavoriteQuestion[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface AddToFavoritesRequest {
  questionId: number;
}

export interface AddToFavoritesResponse {
  message: string;
  favorite: {
    id: number;
    questionId: number;
    createdAt: string;
  };
}

export interface CheckFavoriteResponse {
  isFavorite: boolean;
}

class FavoriteApi {
  // Добавить вопрос в избранное
  async addToFavorites(data: AddToFavoritesRequest): Promise<AddToFavoritesResponse> {
    const response = await api.post('/api/favorites', data);
    return response.data;
  }

  // Удалить вопрос из избранного
  async removeFromFavorites(questionId: number): Promise<{ message: string }> {
    const response = await api.delete(`/api/favorites/${questionId}`);
    return response.data;
  }

  // Получить все избранные вопросы пользователя
  async getUserFavorites(params?: {
    page?: number;
    limit?: number;
  }): Promise<FavoritesResponse> {
    const response = await api.get('/api/favorites', { params });
    return response.data;
  }

  // Проверить, находится ли вопрос в избранном
  async checkIfFavorite(questionId: number): Promise<CheckFavoriteResponse> {
    const response = await api.get(`/api/favorites/${questionId}/check`);
    return response.data;
  }

  // Переключить состояние избранного (добавить/удалить)
  async toggleFavorite(questionId: number): Promise<{ 
    isFavorite: boolean; 
    message: string; 
  }> {
    try {
      const { isFavorite } = await this.checkIfFavorite(questionId);
      
      if (isFavorite) {
        await this.removeFromFavorites(questionId);
        return { 
          isFavorite: false, 
          message: 'Вопрос удален из избранного' 
        };
      } else {
        await this.addToFavorites({ questionId });
        return { 
          isFavorite: true, 
          message: 'Вопрос добавлен в избранное' 
        };
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Ошибка при работе с избранным');
    }
  }
}

export const favoriteApi = new FavoriteApi();
