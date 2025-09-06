import { io, Socket } from "socket.io-client";

const SERVER_URL =
  import.meta.env.VITE_SERVER_URL?.replace(/\/$/, "") || "http://localhost:3000";

export type ChatHistoryItem = {
  id: number;
  text: string;
  user: { id: number; username: string };
  createdAt: string;
};

export type IncomingChatMessage = ChatHistoryItem;

export type SystemEvent = {
  type: "join" | "leave";
  userId: number;
  username: string;
};

class SocketClient {
  private _socket: Socket | null = null;
  private _userId: number | null = null;

  connectWithToken(token: string, lobbyId: number) {
    if (this._socket && this._socket.connected) return;

    // Извлекаем userId из токена
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      this._userId = payload.id ?? null;
    } catch (e) {
      console.warn("Не удалось извлечь userId из токена");
      this._userId = null;
    }

    this._socket = io(`${SERVER_URL}/lobby`, {
      withCredentials: true,
      transports: ["websocket"],
      auth: { token, lobbyId },
    });
  }

  disconnect() {
    if (this._socket) {
      this._socket.disconnect();
      this._socket = null;
    }
    this._userId = null;
  }

  get socket() {
    if (!this._socket) {
      throw new Error("LobbyPage socket не подключен");
    }
    return this._socket;
  }

  get userId() {
    return this._userId;
  }
}

export const socketClient = new SocketClient();