import { createAsyncThunk } from '@reduxjs/toolkit';
import { authApi, type LoginCredentials, type RegisterData, type User } from '../api/auth/authApi';

// initAuth
export const initAuth = createAsyncThunk<void, void, { rejectValue: string }>(
  'auth/initAuth',
  async (_, { dispatch }) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    try {
      await dispatch(fetchProfile()).unwrap();
    } catch {
      localStorage.removeItem('accessToken');
    }
  }
);

// login
export const loginUser = createAsyncThunk<User, LoginCredentials, { rejectValue: string }>(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const { user, accessToken } = await authApi.login(credentials);
      localStorage.setItem('accessToken', accessToken);
      return user;
    } catch (err: any) {
      return rejectWithValue(err?.message || 'Ошибка входа');
    }
  }
);

// register
export const registerUser = createAsyncThunk<User, RegisterData, { rejectValue: string }>(
  'auth/registerUser',
  async (data, { rejectWithValue }) => {
    try {
      const { user, accessToken } = await authApi.register(data);
      localStorage.setItem('accessToken', accessToken);
      return user;
    } catch (err: any) {
      return rejectWithValue(err?.message || 'Ошибка регистрации');
    }
  }
);

// fetchProfile
export const fetchProfile = createAsyncThunk<User, void, { rejectValue: string }>(
  'auth/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      return await authApi.getCurrentUser();
    } catch (err: any) {
      return rejectWithValue(err?.message || 'Ошибка загрузки профиля');
    }
  }
);

// logout
export const logoutUser = createAsyncThunk<void, void, { rejectValue: string }>(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await authApi.logout();
      localStorage.removeItem('accessToken');
    } catch (err: any) {
      return rejectWithValue(err?.message || 'Ошибка выхода');
    }
  }
);
