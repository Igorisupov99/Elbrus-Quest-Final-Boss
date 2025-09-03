// src/store.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import mainPageReducer from './mainPage/mainPageSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    mainPage: mainPageReducer, 
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
