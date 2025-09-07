// src/store.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import mainPageReducer from './mainPage/mainPageSlice';
import lobbyPageReducer from './lobbyPage/lobbySlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    mainPage: mainPageReducer,
    lobbyPage: lobbyPageReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
