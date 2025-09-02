import { io, Socket } from 'socket.io-client';

const SERVER_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:3000';

export type ChatHistoryItem = {
  id: number;
  text: string;
  user: { id: number; username: string };
  createdAt: string;
};

export type IncomingChatMessage = ChatHistoryItem;

export type SystemEvent = {
  type: 'join' | 'leave';
  userId: number;
  username: string;
};

class SocketClient {
  private _socket: Socket | null = null;

  connectWithToken(token: string) {
    this._socket = io(SERVER_URL, {
      withCredentials: true,
      transports: ['websocket'],
      auth: { token }, // ✅ сразу передаём токен в handshake
    });
  }

  get socket() {
    if (!this._socket) {
      throw new Error('Socket не подключен');
    }
    return this._socket;
  }
}

export const socketClient = new SocketClient();
