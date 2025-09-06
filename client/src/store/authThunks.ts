import { createAsyncThunk } from '@reduxjs/toolkit';
import { authApi } from '../api/auth/authApi';
import type { User, LoginCredentials, RegisterData, AuthResponse } from '../types/auth';

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
export const loginUser = createAsyncThunk<AuthResponse, LoginCredentials, { rejectValue: string }>(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const { user, accessToken } = await authApi.login(credentials);
      localStorage.setItem('accessToken', accessToken);
      return { user, accessToken };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error || 
        'Ошибка входа';
      return rejectWithValue(message);
    }
  }
);

// register
export const registerUser = createAsyncThunk<AuthResponse, RegisterData, { rejectValue: string }>(
  'auth/registerUser',
  async (data, { rejectWithValue }) => {
    try {
      const { user, accessToken } = await authApi.register(data);
      localStorage.setItem('accessToken', accessToken);
      return { user, accessToken };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

// fetchProfile
export const fetchProfile = createAsyncThunk<User, void, { rejectValue: string }>(
  'auth/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      return await authApi.getCurrentUser();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      return rejectWithValue(err.message);
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
      return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);
