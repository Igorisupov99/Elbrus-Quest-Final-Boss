import api from '../axios';
import type {
  User,
  LoginCredentials,
  RegisterData,
  AuthResponse,
} from '../../types/auth';

function handleError(error: any): never {
  const msg =
    error?.response?.data?.message ||
    error?.response?.data?.errors?.[0]?.msg ||
    error?.message ||
    'Произошла ошибка';
  throw new Error(msg);
}

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post('/api/auth/login', credentials);
      return response.data.data;
    } catch (err) {
      handleError(err);
    }
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await api.post('/api/auth/register', data);
      return response.data.data;
    } catch (err) {
      handleError(err);
    }
  },

  async logout(): Promise<void> {
    try {
      await api.post('/api/auth/logout');
    } catch (err) {
      handleError(err);
    }
  },

  async getCurrentUser(): Promise<User> {
    try {
      const response = await api.get('/api/auth/profile');
      return response.data.data;
    } catch (err) {
      handleError(err);
    }
  },
};

export default authApi;
