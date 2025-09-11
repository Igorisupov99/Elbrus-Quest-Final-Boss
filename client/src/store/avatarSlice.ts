import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { avatarApi } from '../api/avatar/avatarApi';
import type { 
  AvatarShopState, 
  AvatarShopFilters,
  AvatarPurchaseRequest,
  AvatarEquipRequest
} from '../types/avatar';

const initialState: AvatarShopState = {
  avatars: [],
  userAvatars: [],
  currentAvatar: null,
  loading: false,
  error: null,
  userScore: 0,
};

// Асинхронные thunks
export const fetchAvatars = createAsyncThunk(
  'avatar/fetchAvatars',
  async (filters?: AvatarShopFilters) => {
    return await avatarApi.getAvatars(filters);
  }
);

export const fetchUserAvatars = createAsyncThunk(
  'avatar/fetchUserAvatars',
  async () => {
    return await avatarApi.getUserAvatars();
  }
);

export const fetchCurrentAvatar = createAsyncThunk(
  'avatar/fetchCurrentAvatar',
  async () => {
    return await avatarApi.getCurrentAvatar();
  }
);

// Удаляем fetchCoins, так как очки получаем из auth state

export const purchaseAvatar = createAsyncThunk(
  'avatar/purchaseAvatar',
  async (data: AvatarPurchaseRequest) => {
    return await avatarApi.purchaseAvatar(data);
  }
);

export const equipAvatar = createAsyncThunk(
  'avatar/equipAvatar',
  async (data: AvatarEquipRequest) => {
    return await avatarApi.equipAvatar(data);
  }
);

export const unequipAvatar = createAsyncThunk(
  'avatar/unequipAvatar',
  async () => {
    return await avatarApi.unequipAvatar();
  }
);

const avatarSlice = createSlice({
  name: 'avatar',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (_state, _action: PayloadAction<AvatarShopFilters>) => {
      // Фильтры будут применяться при запросе данных
    },
  },
  extraReducers: (builder) => {
    // Получение аватаров
    builder
      .addCase(fetchAvatars.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAvatars.fulfilled, (state, action) => {
        state.loading = false;
        state.avatars = action.payload;
      })
      .addCase(fetchAvatars.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Ошибка загрузки аватаров';
      });

    // Получение аватаров пользователя
    builder
      .addCase(fetchUserAvatars.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserAvatars.fulfilled, (state, action) => {
        state.loading = false;
        state.userAvatars = action.payload;
      })
      .addCase(fetchUserAvatars.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Ошибка загрузки аватаров пользователя';
      });

    // Получение текущего аватара
    builder
      .addCase(fetchCurrentAvatar.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentAvatar.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAvatar = action.payload;
      })
      .addCase(fetchCurrentAvatar.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Ошибка загрузки текущего аватара';
      });

    // Очки получаем из auth state, поэтому убираем этот блок

    // Покупка аватара
    builder
      .addCase(purchaseAvatar.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(purchaseAvatar.fulfilled, (state, action) => {
        state.loading = false;
        state.userScore = action.payload.score;
        
        // Добавляем купленный аватар в userAvatars
        const avatarId = action.meta.arg.avatarId;
        const avatar = state.avatars.find(a => a.id === avatarId);
        
        if (avatar) {
          // Проверяем, что аватар еще не добавлен в userAvatars
          const existingUserAvatar = state.userAvatars.find(ua => ua.avatarId === avatarId);
          if (!existingUserAvatar) {
            // Добавляем новую запись в userAvatars
            state.userAvatars.push({
              id: Date.now(), // Временный ID, сервер должен вернуть правильный
              userId: 0, // Будет обновлено сервером
              avatarId: avatarId,
              isEquipped: false,
              purchasedAt: new Date().toISOString(),
              avatar: avatar
            });
          }
        }
      })
      .addCase(purchaseAvatar.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Ошибка покупки аватара';
      });

    // Надевание аватара
    builder
      .addCase(equipAvatar.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(equipAvatar.fulfilled, (state, action) => {
        state.loading = false;
        const avatarId = action.meta.arg.avatarId;
        const avatar = state.avatars.find(a => a.id === avatarId);
        if (avatar) {
          state.currentAvatar = avatar;
        }
      })
      .addCase(equipAvatar.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Ошибка надевания аватара';
      });

    // Снятие аватара
    builder
      .addCase(unequipAvatar.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(unequipAvatar.fulfilled, (state) => {
        state.loading = false;
        state.currentAvatar = null;
      })
      .addCase(unequipAvatar.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Ошибка снятия аватара';
      });
  },
});

export const { clearError, setFilters } = avatarSlice.actions;
export default avatarSlice.reducer;
