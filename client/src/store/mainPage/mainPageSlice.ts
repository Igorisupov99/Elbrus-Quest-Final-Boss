import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface MainPageItem {
  id: number;
  title: string;
}

interface MainPageState {
  items: MainPageItem[];
  nextId: number; // to generate unique IDs
}

const initialState: MainPageState = {
  items: [
    { id: 1, title: 'Комната 1' },
    { id: 2, title: 'Комната 2' },
    { id: 3, title: 'Комната 3' }
  ],
  nextId: 4,
};

const mainPageSlice = createSlice({
  name: 'mainPage',
  initialState,
  reducers: {
    addRoom: (state, action: PayloadAction<string>) => {
      state.items.push({ id: state.nextId, title: action.payload });
      state.nextId += 1;
    },
    editRoom: (state, action: PayloadAction<{ id: number; title: string }>) => {
      const room = state.items.find((item) => item.id === action.payload.id);
      if (room) {
        room.title = action.payload.title;
      }
    },
    deleteRoom: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
  },
});

export const { addRoom, editRoom, deleteRoom } = mainPageSlice.actions;
export default mainPageSlice.reducer;
