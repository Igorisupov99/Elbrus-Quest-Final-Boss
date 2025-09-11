// src/store.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import mainPageReducer from './mainPage/mainPageSlice';
import mainPageConditionalRenderingReducer from './mainPageConditionalRenderingSlice/mainPageConditionalRenderingSlice';
import lobbyPageReducer from './lobbyPage/lobbySlice';
import avatarReducer from './avatarSlice';


export const store = configureStore({
  reducer: {
    auth: authReducer,
    mainPage: mainPageReducer,
    mainPageConditionalRendering: mainPageConditionalRenderingReducer,
    lobbyPage: lobbyPageReducer,
    avatar: avatarReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
