import api from '../axios';

export interface User {
  id: number;
  username: string;
  email: string;
  image_url?: string;
  score?: number;
}

export interface Friendship {
  id: number;
  user_id: number;
  friend_id: number;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  updated_at: string;
  user?: User;
  friend?: User;
}

export interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  message?: string;
}

// Отправить запрос на дружбу
export const sendFriendRequest = async (friendId: number): Promise<ApiResponse<Friendship>> => {
  try {
    const response = await api.post('/api/friendship/send-request', {
      friend_id: friendId
    }, {
      withCredentials: true
    });
    // Сервер возвращает { message, data }, добавляем success: true
    return { success: true, data: response.data.data, message: response.data.message };
  } catch (error: any) {
    console.error('Ошибка в sendFriendRequest:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || error.message || 'Ошибка при отправке запроса на дружбу' 
    };
  }
};

// Принять запрос на дружбу
export const acceptFriendRequest = async (friendshipId: number): Promise<ApiResponse<Friendship>> => {
  try {
    const response = await api.put(`/api/friendship/accept/${friendshipId}`, {}, {
      withCredentials: true
    });
    return { success: true, data: response.data.data, message: response.data.message };
  } catch (error: any) {
    console.error('Ошибка в acceptFriendRequest:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || error.message || 'Ошибка при принятии запроса на дружбу' 
    };
  }
};

// Отклонить запрос на дружбу
export const rejectFriendRequest = async (friendshipId: number): Promise<ApiResponse<void>> => {
  try {
    const response = await api.delete(`/api/friendship/reject/${friendshipId}`, {
      withCredentials: true
    });
    return { success: true, message: response.data.message };
  } catch (error: any) {
    console.error('Ошибка в rejectFriendRequest:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || error.message || 'Ошибка при отклонении запроса на дружбу' 
    };
  }
};

// Удалить из друзей
export const removeFriend = async (friendId: number): Promise<ApiResponse<void>> => {
  try {
    const response = await api.delete(`/api/friendship/remove/${friendId}`, {
      withCredentials: true
    });
    return { success: true, message: response.data.message };
  } catch (error: any) {
    console.error('Ошибка в removeFriend:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || error.message || 'Ошибка при удалении из друзей' 
    };
  }
};

// Получить список друзей
export const getFriends = async (): Promise<ApiResponse<User[]>> => {
  try {
    const response = await api.get('/api/friendship/friends', {
      withCredentials: true
    });
    return { success: true, data: response.data.data || [] };
  } catch (error: any) {
    console.error('Ошибка в getFriends:', error);
    return { 
      success: false, 
      data: [],
      message: error.response?.data?.message || error.message || 'Ошибка при получении списка друзей' 
    };
  }
};

// Получить входящие запросы на дружбу
export const getIncomingRequests = async (): Promise<ApiResponse<Friendship[]>> => {
  try {
    const response = await api.get('/api/friendship/incoming-requests', {
      withCredentials: true
    });
    return { success: true, data: response.data.data || [] };
  } catch (error: any) {
    console.error('Ошибка в getIncomingRequests:', error);
    return { 
      success: false, 
      data: [],
      message: error.response?.data?.message || error.message || 'Ошибка при получении входящих запросов' 
    };
  }
};

// Получить исходящие запросы на дружбу
export const getOutgoingRequests = async (): Promise<ApiResponse<Friendship[]>> => {
  try {
    const response = await api.get('/api/friendship/outgoing-requests', {
      withCredentials: true
    });
    return { success: true, data: response.data.data || [] };
  } catch (error: any) {
    return { 
      success: false, 
      data: [],
      message: error.response?.data?.message || 'Ошибка при получении исходящих запросов' 
    };
  }
};

// Поиск пользователей для добавления в друзья
export const searchUsers = async (query: string): Promise<ApiResponse<User[]>> => {
  try {
    const response = await api.get('/api/friendship/search', {
      params: { query },
      withCredentials: true
    });
    return { success: true, data: response.data.data || [] };
  } catch (error: any) {
    return { 
      success: false, 
      data: [],
      message: error.response?.data?.message || 'Ошибка при поиске пользователей' 
    };
  }
};

// Получить пользователя по username для добавления в друзья
export const getUserByUsername = async (username: string): Promise<ApiResponse<User>> => {
  try {
    console.log('Запрос пользователя по username:', username);
    const response = await api.get(`/api/auth/user/${username}`, {
      withCredentials: true
    });
    console.log('Ответ сервера для getUserByUsername:', response.data);
    
    // Проверяем разные форматы ответа сервера
    const userData = response.data.data || response.data;
    return { success: true, data: userData };
  } catch (error: any) {
    console.error('Ошибка в getUserByUsername:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || error.message || 'Пользователь не найден' 
    };
  }
};

// Проверить статус дружбы с пользователем
export const checkFriendshipStatus = async (friendId: number): Promise<ApiResponse<{ status: 'none' | 'pending' | 'accepted' | 'blocked', friendship?: Friendship }>> => {
  try {
    const response = await api.get(`/api/friendship/status/${friendId}`, {
      withCredentials: true
    });
    return { 
      success: true, 
      data: { 
        status: response.data.status || 'none',
        friendship: response.data.friendship
      }
    };
  } catch (error: any) {
    console.error('Ошибка в checkFriendshipStatus:', error);
    return { 
      success: false, 
      data: { status: 'none' },
      message: error.response?.data?.message || error.message || 'Ошибка при проверке статуса дружбы' 
    };
  }
};
