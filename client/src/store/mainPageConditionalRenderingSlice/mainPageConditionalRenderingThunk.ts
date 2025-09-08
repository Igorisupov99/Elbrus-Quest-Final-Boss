import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios'; // your axios instance
import type { CheckCreatorResponse } from '../../types/mainPage'; 

// --- CHECK room creator ---
export const checkRoomCreator = createAsyncThunk<CheckCreatorResponse>(
  'mainPageConditional/checkRoomCreator',
  async (_, thunkAPI) => {
    try {
      const response = await api.get(`/api/room/creator-check`);

      return response.data.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);