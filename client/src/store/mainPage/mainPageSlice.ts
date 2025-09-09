// mainPageSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { MainPageItem, MainPageState } from '../../types/mainPage';
import {
  fetchRooms,
  updateRoom,
  removeRoom,
  createRoom,
} from './mainPageThunks';

const initialState: MainPageState = {
  items: [],
  loading: false,
  error: null,
};

const mainPageSlice = createSlice({
  name: 'mainPage',
  initialState,
  reducers: {
    addRoom: (state, action: PayloadAction<MainPageItem>) => {
      // Check if room already exists to avoid duplicates
      const existingRoom = state.items.find(
        (room) => room.id === action.payload.id
      );
      if (!existingRoom) {
        state.items.push(action.payload);
      }
    },
  },
  extraReducers: (builder) => {
    // --- GET all rooms ---
    builder
      .addCase(fetchRooms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchRooms.fulfilled,
        (state, action: PayloadAction<MainPageItem[]>) => {
          state.loading = false;
          state.items = action.payload;
        }
      )
      .addCase(fetchRooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Ошибка при загрузке комнат';
      });

    // --- CREATE room ---
    builder.addCase(
      createRoom.fulfilled,
      (state, action: PayloadAction<MainPageItem>) => {
        state.items.push(action.payload);
      }
    );

    // --- UPDATE room ---
    builder.addCase(updateRoom.fulfilled, (state, action) => {
      const idx = state.items.findIndex((r) => r.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = { ...state.items[idx], ...action.payload };
      }
    });

    // --- DELETE room ---
    builder.addCase(
      removeRoom.fulfilled,
      (state, action: PayloadAction<number>) => {
        state.items = state.items.filter((r) => r.id !== action.payload);
      }
    );
  },
});

export const { addRoom } = mainPageSlice.actions;
export default mainPageSlice.reducer;
