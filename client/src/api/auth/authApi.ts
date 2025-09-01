import api from '../axios';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  score: number;
  isActive: boolean;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post('/api/auth/login', credentials);
    return response.data.data;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post('/api/auth/register', data);
    return response.data.data;
  },

  async logout(): Promise<void> {
    await api.post('/api/auth/logout');
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/api/auth/profile');
    return response.data.data;
  },
};

export default authApi;
