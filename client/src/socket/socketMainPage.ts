import { io, Socket } from "socket.io-client";

const SERVER_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:3000";

export type MainChatMessage = {
  id: number;
  text: string;
  user: { id: number; username: string };
  createdAt: string;
};

class MainSocketClient {
  private _socket: Socket | null = null;

  connectWithToken(token: string) {
    if (this._socket && this._socket.connected) {
      return;
    }

    this._socket = io(SERVER_URL, {
      path: "/socket.io",
      transports: ["websocket"],
      withCredentials: true,
      auth: { token },
    });
  }

  disconnect() {
    if (this._socket) {
      this._socket.disconnect();
      this._socket = null;
    }
  }

  get socket() {
    if (!this._socket) throw new Error("MainPage socket не подключен");
    return this._socket;
  }
}

export const mainSocketClient = new MainSocketClient();
