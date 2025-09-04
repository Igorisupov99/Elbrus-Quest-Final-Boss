import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios'; // your axios instance
import type { MainPageItem } from '../../types/mainPage'; 



// --- GET all rooms ---
export const fetchRooms = createAsyncThunk<MainPageItem[]>(
  'mainPage/fetchRooms',
  async (_, thunkAPI) => {
    try {
      const response = await api.get('/api/room/all');
      return response.data.data.map((room: any) => ({
        id: room.id,
        title: room.room_name,
      }));
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

// --- CREATE room ---
export const createRoom = createAsyncThunk<
  MainPageItem,
  { roomName: string; password: string },
  { rejectValue: string }
>(
  'mainPage/createRoom',
  async ({ roomName, password }, thunkAPI) => {
    try {
      const response = await api.post(
        '/api/room/new',
        {
          phase_id: 1,
          current_topic_id: 1,
          current_question_id: 1,
          room_code: password,        
          is_active: true,
          room_name: roomName,
        },
      );

      const room = response.data.data;

      return {
        id: room.id,
        title: room.room_name,
        room_creator: room.room_creator,
      };
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);


// --- UPDATE room ---
export const updateRoom = createAsyncThunk<MainPageItem, { id: number; room_name: string }>(
  'mainPage/updateRoom',
  async ({ id, room_name }, thunkAPI) => {
    try {
      const response = await api.put(`/api/room/change/${id}`, { room_name });
      return {
        id: response.data.data.id,
        title: response.data.data.room_name,
      };
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

// --- DELETE room ---
export const removeRoom = createAsyncThunk<number, number>(
  'mainPage/removeRoom',
  async (id, thunkAPI) => {
    try {
      await api.delete(`/api/room/${id}`);
      return id;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);
