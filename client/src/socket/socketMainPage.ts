import { io, Socket } from 'socket.io-client';

const SERVER_URL =
  import.meta.env.VITE_SERVER_URL?.replace(/\/$/, '') ||
  'http://localhost:3000';

export type MainChatMessage = {
  id: number;
  text: string;
  user: { id: number; username: string };
  createdAt: string;
};

class MainSocketClient {
  private _socket: Socket | null = null;
  private _roomUpdateListener: ((data: any) => void) | null = null;
  private _achievementListener: ((data: any) => void) | null = null;

  connectWithToken(token: string) {
    // Disconnect existing socket if any
    if (this._socket) {
      this._socket.disconnect();
      this._socket = null;
    }

    console.log('🔌 Connecting to main page socket...');
    this._socket = io(SERVER_URL, {
      path: '/socket.io',
      transports: ['websocket'],
      withCredentials: true,
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Add connection event listeners
    this._socket.on('connect', () => {
      console.log('✅ Main page socket connected');
      console.log('🔌 Socket ID:', this._socket?.id);
      // Re-setup room update listener if it exists
      if (this._roomUpdateListener) {
        this._socket?.on('room:update', this._roomUpdateListener);
        console.log('🔄 Re-setup room update listener after reconnection');
      }
      
      // Re-setup achievement listener if it exists
      if (this._achievementListener) {
        this._socket?.on('user:newAchievements', this._achievementListener);
        console.log('🔄 Re-setup achievement listener after reconnection');
      }
    });

    this._socket.on('disconnect', (reason) => {
      console.log('❌ Main page socket disconnected:', reason);
    });

    this._socket.on('connect_error', (error) => {
      console.error('❌ Main page socket connection error:', error);
    });

    // Add test response listener
    this._socket.on('test:response', (data) => {
      console.log('🎉 Received test response from server:', data);
    });

    // Add general event listener for debugging
    this._socket.onAny((eventName, ...args) => {
      console.log(`📡 Received event: ${eventName}`, args);
    });
  }

  setupRoomUpdateListener(listener: (data: any) => void) {
    console.log('🔧 Setting up room update listener...');
    this._roomUpdateListener = listener;

    if (this._socket) {
      console.log(
        '🔌 Socket exists, checking connection status:',
        this._socket.connected
      );
      if (this._socket.connected) {
        this._socket.on('room:update', listener);
        console.log('📡 Room update listener set up immediately');
      } else {
        console.log(
          '⏳ Socket not connected yet, listener will be set up on connect'
        );
        // Set up a one-time connection listener
        this._socket.once('connect', () => {
          console.log('🔄 Socket connected, setting up room update listener');
          this._socket?.on('room:update', listener);
        });
      }
    } else {
      console.log('❌ No socket instance available');
    }
    
    // Also set up a general room:update listener for debugging
    if (this._socket) {
      this._socket.on('room:update', (data) => {
        console.log('🎯 Received room:update event:', data);
        if (this._roomUpdateListener) {
          this._roomUpdateListener(data);
        }
      });
      console.log('🔍 General room:update listener also set up for debugging');
    }
  }

  setupAchievementListener(listener: (data: any) => void) {
    console.log('🏆 Setting up achievement listener...');
    this._achievementListener = listener;

    if (this._socket) {
      console.log(
        '🔌 Socket exists, checking connection status:',
        this._socket.connected
      );
      if (this._socket.connected) {
        this._socket.on('user:newAchievements', listener);
        console.log('🏆 Achievement listener set up immediately');
      } else {
        console.log(
          '⏳ Socket not connected yet, achievement listener will be set up on connect'
        );
        // Set up a one-time connection listener
        this._socket.once('connect', () => {
          console.log('🔄 Socket connected, setting up achievement listener');
          this._socket?.on('user:newAchievements', listener);
        });
      }
    } else {
      console.log('❌ No socket instance available');
    }
    
    // Also set up a general user:newAchievements listener for debugging
    if (this._socket) {
      this._socket.on('user:newAchievements', (data) => {
        console.log('🏆 Received user:newAchievements event:', data);
        if (this._achievementListener) {
          this._achievementListener(data);
        }
      });
      console.log('🔍 General user:newAchievements listener also set up for debugging');
    }
  }

  removeRoomUpdateListener() {
    if (this._socket && this._roomUpdateListener) {
      this._socket.off('room:update', this._roomUpdateListener);
      console.log('🧹 Room update listener removed');
    }
    this._roomUpdateListener = null;
  }

  removeAchievementListener() {
    if (this._socket && this._achievementListener) {
      this._socket.off('user:newAchievements', this._achievementListener);
      console.log('🧹 Achievement listener removed');
    }
    this._achievementListener = null;
  }

  disconnect() {
    if (this._socket) {
      this._socket.disconnect();
      this._socket = null;
    }
  }

  get socket() {
    if (!this._socket) throw new Error('MainPage socket не подключен');
    return this._socket;
  }

  get isConnected() {
    return this._socket?.connected || false;
  }

  // Test function to emit a test event
  testConnection() {
    if (this._socket && this._socket.connected) {
      console.log('🧪 Testing socket connection...');
      this._socket.emit('test', { message: 'Hello from client' });
      return true;
    } else {
      console.log('❌ Cannot test - socket not connected');
      return false;
    }
  }
}

export const mainSocketClient = new MainSocketClient();
