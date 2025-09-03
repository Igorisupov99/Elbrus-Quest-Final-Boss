import { createSlice } from '@reduxjs/toolkit';

export interface MainPageItem {
  id: number;
  title: string;
}

interface MainPageState {
  items: MainPageItem[];
}

const initialState: MainPageState = {
  items: [
    { id: 1, title: 'Комната 1' },
    { id: 2, title: 'Комната 2' },
    { id: 3, title: 'Комната 3' }
  ],
};

const mainPageSlice = createSlice({
  name: 'mainPage',
  initialState,
  reducers: {},
});

export default mainPageSlice.reducer;
