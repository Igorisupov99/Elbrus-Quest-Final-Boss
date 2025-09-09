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
    });

    this._socket.on('disconnect', (reason) => {
      console.log('❌ Main page socket disconnected:', reason);
    });

    this._socket.on('connect_error', (error) => {
      console.error('❌ Main page socket connection error:', error);
    });
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
}

export const mainSocketClient = new MainSocketClient();
