// mainPageSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { MainPageItem } from '../../types/mainPage';
import { fetchRooms, updateRoom, removeRoom, createRoom } from './mainPageThunks';

interface MainPageState {
  items: MainPageItem[];
  loading: boolean;
  error: string | null;
}

const initialState: MainPageState = {
  items: [],
  loading: false,
  error: null,
};

const mainPageSlice = createSlice({
  name: 'mainPage',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // --- GET all rooms ---
    builder
      .addCase(fetchRooms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRooms.fulfilled, (state, action: PayloadAction<MainPageItem[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchRooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Ошибка при загрузке комнат';
      });

    // --- CREATE room ---
    builder
      .addCase(createRoom.fulfilled, (state, action: PayloadAction<MainPageItem>) => {
        state.items.push(action.payload);
      });

    // --- UPDATE room ---
    builder
      .addCase(updateRoom.fulfilled, (state, action: PayloadAction<MainPageItem>) => {
        const idx = state.items.findIndex((r) => r.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      });

    // --- DELETE room ---
    builder
      .addCase(removeRoom.fulfilled, (state, action: PayloadAction<number>) => {
        state.items = state.items.filter((r) => r.id !== action.payload);
      });

  },
});

export default mainPageSlice.reducer;
