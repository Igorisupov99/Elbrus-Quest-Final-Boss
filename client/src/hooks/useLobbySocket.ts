import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import type { RootState } from "../store/store";
import { type ChatHistoryItem, type IncomingChatMessage, socketClient, type SystemEvent } from "../socket/socketLobbyPage";
import { initialState, setScores, mergeScores, openModal, setModalResult, closeModal, openExamModal, closeExamModal, setExamQuestions, setExamIndex, clearExamQuestions } from "../store/lobbyPage/lobbySlice";
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

    const onInitScores = (payload: any) => {
      const nextIncorrect = payload?.incorrectAnswers ?? payload?.incorrect_answers ?? 0;
      dispatch(setScores({
        userScore: payload.userScore ?? 0,
        sessionScore: payload.sessionScore ?? 0,
        incorrectAnswers: nextIncorrect,
      }));
    };

    const onScores = (payload: any) => {
      dispatch(mergeScores({ sessionScore: payload.sessionScore }));
      if (payload.userId && user?.id && Number(payload.userId) === Number(user.id)) {
        dispatch(mergeScores({ userScore: payload.userScore }));
      }
    };

    // Убираем обработчик onCorrectAnswer - уведомления о правильных ответах показываются локально

    const onIncorrectAnswer = (payload: any) => {
      // Обновляем счетчик неправильных ответов у всех игроков
      const incorrectCount = payload.incorrectAnswers || payload.incorrect_answers || 0;
      dispatch(mergeScores({
        incorrectAnswers: incorrectCount
      }));
      
      dispatch(setModalResult('❌ Неправильный ответ!'));
      setTimeout(() => dispatch(setModalResult(null)), 2000);
    };

    const onIncorrectCountUpdate = (payload: { incorrectAnswers: number }) => {
      // Обновляем только счетчик неправильных ответов без показа уведомления
      dispatch(mergeScores({
        incorrectAnswers: payload.incorrectAnswers
      }));
    };

    const onCorrectAnswer = () => {
      // Показываем уведомление о правильном ответе всем игрокам
      dispatch(setModalResult('✅ Правильный ответ! (+10 очков)'));
      setTimeout(() => {
        dispatch(setModalResult(null));
        dispatch(closeModal());
      }, 3000);
    };

    const onExamCorrectAnswer = (payload: { message: string }) => {
      // Показываем уведомление о правильном ответе в экзамене всем игрокам
      console.log('onExamCorrectAnswer: показываем уведомление:', payload.message);
      dispatch(setModalResult(payload.message));
      setTimeout(() => {
        console.log('onExamCorrectAnswer: убираем уведомление через 2 секунды');
        dispatch(setModalResult(null));
      }, 2000);
    };

    const onTimeout = () => {
      dispatch(setModalResult('Ход будет передан следующему игроку'));
      setTimeout(() => {
        dispatch(setModalResult(null));
        dispatch(closeModal());
        dispatch(closeExamModal());
      }, 2000);
    };

    const onPassTurnNotification = () => {
      dispatch(setModalResult('Ход будет передан следующему игроку'));
      setTimeout(() => {
        dispatch(setModalResult(null));
        dispatch(closeModal());
        dispatch(closeExamModal());
      }, 2000);
    };
    
    const onOpenModal = (payload: { questionId: number; topic: string; question: string }) => {
      dispatch(openModal(payload));
    };
    const onExamStart = (payload: { questions: any[]; index: number }) => {
      dispatch(setExamQuestions(payload.questions));
      dispatch(setExamIndex(payload.index));
      dispatch(openExamModal());
    };
    
    const onExamNext = (payload: { index: number; question?: any }) => {
      dispatch(setExamIndex(payload.index));
    };
    const onExamComplete = () => {
      dispatch(closeExamModal());
      dispatch(clearExamQuestions());
      dispatch(setExamIndex(0));
    };

    const onCloseModal = () => {
      dispatch(closeModal());
    };
;
    socket.on("connect", () => {
      setConnected(true);
      setConnecting(false);
    });
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("chat:history", onHistory);
    socket.on("chat:message", onChatMessage);
    socket.on("system", onSystem);
    socket.on("error", onError);
    socket.on("lobby:users", onUsers);
    socket.on("lobby:initPoints", (serverPoints) => {
      const mapped = serverPoints.map((p: any) => {    // исправить any
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
    socket.on("lobby:initScores", onInitScores);
    socket.on("lobby:scores", onScores);
    socket.on("lobby:incorrectAnswer", onIncorrectAnswer);
    socket.on("lobby:incorrectCountUpdate", onIncorrectCountUpdate);
    socket.on("lobby:correctAnswer", onCorrectAnswer);
    socket.on("lobby:examCorrectAnswer", onExamCorrectAnswer);
    socket.on("lobby:openModal", onOpenModal);
    socket.on("lobby:examStart", onExamStart);
    socket.on("lobby:examNext", onExamNext);
    socket.on("lobby:examComplete", onExamComplete);
    socket.on("lobby:timeout", onTimeout);
    socket.on("lobby:passTurnNotification", onPassTurnNotification);
    socket.on("lobby:closeModal", onCloseModal);

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
      socket.off("lobby:initScores", onInitScores);
      socket.off("lobby:scores", onScores);
      socket.off("lobby:incorrectAnswer", onIncorrectAnswer);
      socket.off("lobby:incorrectCountUpdate", onIncorrectCountUpdate);
      socket.off("lobby:correctAnswer", onCorrectAnswer);
      socket.off("lobby:examCorrectAnswer", onExamCorrectAnswer);
      socket.off("lobby:timeout", onTimeout);
      socket.off("lobby:passTurnNotification", onPassTurnNotification);
      socket.off("lobby:openModal", onOpenModal);
      socket.off("lobby:examStart", onExamStart);
      socket.off("lobby:examNext", onExamNext);
      socket.off("lobby:examComplete", onExamComplete);
      socket.off("lobby:closeModal", onCloseModal);
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

  const sendTimeout = (pointId: string) => {
    socketClient.socket.emit("lobby:timeout", { lobbyId, pointId });
  };

  const sendExamComplete = (correctAnswers: number, totalQuestions: number) => {
    socketClient.socket.emit("lobby:examComplete", { lobbyId, correctAnswers, totalQuestions});
  };
  
  const sendOpenModal = (payload: { questionId: number; topic: string; question: string }) => {
    socketClient.socket.emit("lobby:openModal", payload);
  };
  const sendOpenExam = (payload?: { questions?: any[]; examId?: string }) => {
    socketClient.socket.emit("lobby:openExam", payload ?? {});
  };
  const sendExamAnswerProgress = (correct?: boolean) => {
    socketClient.socket.emit("lobby:examAnswer", { correct: Boolean(correct) });
  };

  const sendCloseModal = () => {
    socketClient.socket.emit("lobby:closeModal");
  };

  const sendIncorrectAnswer = (incorrectCount: number) => {
    socketClient.socket.emit("lobby:incorrectAnswer", { incorrectAnswers: incorrectCount });
  };

  const sendPassTurn = () => {
    socketClient.socket.emit("lobby:passTurn");
  };

  const sendIncorrectCountUpdate = (incorrectCount: number) => {
    socketClient.socket.emit("lobby:incorrectCountUpdate", { incorrectAnswers: incorrectCount });
  };

  const sendCorrectAnswer = () => {
    socketClient.socket.emit("lobby:correctAnswer");
  };

  const sendPassTurnNotification = () => {
    socketClient.socket.emit("lobby:passTurnNotification");
  };

  return {
    history,
    connected,
    connecting,
    currentUserId: user?.id ?? 0,
    sendChatMessage,
    sendAnswer,
    sendTimeout,
    sendExamComplete,
    sendOpenModal,
    sendOpenExam,
    sendExamAnswerProgress,
    sendCloseModal,
    sendIncorrectAnswer,
    sendPassTurn,
    sendIncorrectCountUpdate,
    sendCorrectAnswer,
    sendPassTurnNotification,
  };
};
