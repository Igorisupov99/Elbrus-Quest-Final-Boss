import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { avatarApi } from '../api/avatar/avatarApi';
import { updateUserScore } from './authSlice';
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
    const result = await avatarApi.purchaseAvatar(data);
    return result;
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
      .addCase(purchaseAvatar.fulfilled, (state, action) => {
        // Обновляем userAvatars для корректного отображения статуса
        const avatarId = action.meta.arg.avatarId;
        const avatar = state.avatars.find(a => a.id === avatarId);
        
        if (avatar) {
          // Проверяем, не добавлен ли уже аватар
          const existingUserAvatar = state.userAvatars.find(ua => ua.avatarId === avatarId);
          if (!existingUserAvatar) {
            // Добавляем новый аватар в список пользователя
            const newUserAvatar = {
              id: Date.now(), // Временный ID, сервер вернет правильный
              userId: 0, // Будет заполнено сервером
              avatarId: avatarId,
              isEquipped: false,
              purchasedAt: new Date().toISOString(),
              avatar: avatar
            };
            
            state.userAvatars.push(newUserAvatar);
          }
        }
        
        // Очки пользователя обновляются автоматически в thunk
        // Но нам нужно обновить их локально, чтобы избежать дополнительного запроса
        // Это будет сделано через обновление auth состояния в компоненте
      })
      .addCase(purchaseAvatar.rejected, (state, action) => {
        state.error = action.payload as string || 'Ошибка покупки аватара';
      });

    // Надевание аватара
    builder
      .addCase(equipAvatar.fulfilled, (state, action) => {
        const avatarId = action.meta.arg.avatarId;
        const avatar = state.avatars.find(a => a.id === avatarId);
        
        if (avatar) {
          // Обновляем текущий аватар
          state.currentAvatar = avatar;
          
          // Обновляем статус isEquipped для всех аватаров пользователя
          state.userAvatars.forEach(userAvatar => {
            userAvatar.isEquipped = userAvatar.avatarId === avatarId;
          });
        }
      })
      .addCase(equipAvatar.rejected, (state, action) => {
        state.error = action.payload as string || 'Ошибка надевания аватара';
      });

    // Снятие аватара
    builder
      .addCase(unequipAvatar.fulfilled, (state) => {
        state.currentAvatar = null;
        
        // Снимаем статус isEquipped со всех аватаров пользователя
        state.userAvatars.forEach(userAvatar => {
          userAvatar.isEquipped = false;
        });
      })
      .addCase(unequipAvatar.rejected, (state, action) => {
        state.error = action.payload as string || 'Ошибка снятия аватара';
      });
  },
});

export const { clearError, setFilters } = avatarSlice.actions;
export default avatarSlice.reducer;
