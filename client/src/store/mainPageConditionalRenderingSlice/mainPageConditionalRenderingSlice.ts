import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  CheckCreatorResponse,
  CheckCreatorState,
} from '../../types/mainPage';
import { checkRoomCreator } from './mainPageConditionalRenderingThunk';

const conditionalRenderingModelPage: CheckCreatorState = {
  response: null,
  onLoading: false,
  error: null,
};

const mainPageConditionalRenderingSlice = createSlice({
  name: 'mainPageConditional',
  initialState: conditionalRenderingModelPage,
  reducers: {},
  extraReducers: (builder) => {
    // --- CHECK creator ---
    builder
      .addCase(checkRoomCreator.pending, (state) => {
        state.onLoading = true;
        state.error = null;
      })
      .addCase(
        checkRoomCreator.fulfilled,
        (state, action: PayloadAction<CheckCreatorResponse>) => {
          state.onLoading = false;
          state.response = action.payload;
        }
      )
      .addCase(checkRoomCreator.rejected, (state, action) => {
        state.onLoading = false;
        state.error = action.error.message || 'Ошибка при загрузке комнат';
      });
  },
});

export default mainPageConditionalRenderingSlice.reducer;
