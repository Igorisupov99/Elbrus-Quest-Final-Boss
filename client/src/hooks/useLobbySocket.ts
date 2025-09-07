import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import type { RootState } from "../store/store";
import { type ChatHistoryItem, type IncomingChatMessage, socketClient, type SystemEvent } from "../socket/socketLobbyPage";
import { initialState } from "../store/lobbyPage/lobbySlice";
import {
  setUsers,
  setPoints,
  updatePointStatus,
} from "../store/lobbyPage/lobbySlice";

export function useLobbySocket(lobbyId: number) {
  const dispatch = useAppDispatch();
  const token = localStorage.getItem("accessToken");
  const { user } = useAppSelector((state: RootState) => state.auth);

  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);

  useEffect(() => {
    if (!token) return;
    socketClient.connectWithToken(token, lobbyId);

    const socket = socketClient.socket;

    const onConnect = () => {
      setConnected(true);
      setConnecting(false);
    };
    const onDisconnect = () => {
      setConnected(false);
      setConnecting(true);
    };
    const onConnectError = () => {
      setConnected(false);
      setConnecting(false);
    };
    const onHistory = (items: ChatHistoryItem[]) => setHistory(items);
    const onChatMessage = (msg: IncomingChatMessage) => setHistory(prev => [...prev, msg]);
    const onSystem = (evt: SystemEvent) => {
      const text = evt.type === "join" ? `${evt.username} вошёл в лобби` : `${evt.username} покинул лобби`;
      setHistory(prev => [...prev, {
        id: Date.now(),
        text,
        user: { id: 0, username: "system" },
        createdAt: new Date().toISOString(),
      }]);
    };
    const onError = (payload: any) => console.error("ошибка чата", payload);

    const onUsers = ({ users, activePlayerId }: any) => dispatch(setUsers({ users, activePlayerId }));
    const onInitPoints = (points: any) => dispatch(setPoints(points));
    const onPointStatus = ({ pointId, status}: any) => dispatch(updatePointStatus({ pointId, status }));

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("chat:history", onHistory);
    socket.on("chat:message", onChatMessage);
    socket.on("system", onSystem);
    socket.on("error", onError);
    socket.on("lobby:users", onUsers);
    socket.on("lobby:initPoints", (serverPoints) => {
      const mapped = serverPoints.map(p => {
        const clientPoint = initialState.points.find(cp => cp.id === String(p.id));
        return {
          id: String(p.id),
          title: p.title,
          status: p.status,
          phaseId: p.phase_id,
          topicId: p.topic_id,
          top: clientPoint?.top ?? 0,
          left: clientPoint?.left ?? 0,
        };
      });
      dispatch(setPoints(mapped));
    });
    socket.on("lobby:updatePointStatus", onPointStatus);

    return () => {
      socket.emit("leaveLobby");
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("chat:history", onHistory);
      socket.off("chat:message", onChatMessage);
      socket.off("system", onSystem);
      socket.off("error", onError);
      socket.off("lobby:users", onUsers);
      socket.off("lobby:initPoints", onInitPoints);
      socket.off("lobby:updatePointStatus", onPointStatus);
      socket.disconnect();
    };
  }, [dispatch, lobbyId, token]);

  const sendChatMessage = (text: string) => {
    if (!text.trim() || !connected) return;
    socketClient.socket.emit("chat:message", { text });
  };

  const sendAnswer = (pointId: string, correct: boolean) => {
    socketClient.socket.emit("lobby:answer", { lobbyId, pointId, correct });
  };

  const sendExamComplete = (correctAnswers: number, totalQuestions: number) => {
    socketClient.socket.emit("lobby:examComplete", { lobbyId, correctAnswers, totalQuestions});
  };

  return {
    history,
    connected,
    connecting,
    currentUserId: user?.id ?? 0,
    sendChatMessage,
    sendAnswer,
    sendExamComplete,
  };
};
