import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import type { RootState } from "../store/store";
import { type ChatHistoryItem, type IncomingChatMessage, socketClient, type SystemEvent } from "../socket/socketLobbyPage";
import { initialState, setScores, mergeScores, openModal, setModalResult, closeModal, openExamModal, closeExamModal, setExamQuestions, setExamIndex, clearExamQuestions, openPhaseTransitionModal, openExamFailureModal, openReconnectWaitingModal, closeReconnectWaitingModal } from "../store/lobbyPage/lobbySlice";
import { updateUserScore } from "../store/authSlice";
import {
  setUsers,
  setPoints,
  updatePointStatus,
} from "../store/lobbyPage/lobbySlice";

export function useLobbySocket(lobbyId: number, onAnswerInputSync?: (answer: string) => void, onExamAnswerInputSync?: (answer: string) => void) {
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

    const onQuestionRestore = (payload: { 
      questionId: number;
      topic: string;
      question: string;
      mentor_tip?: string;
      timeLeft: number;
      pointId?: string;
    }) => {
      console.log('🔄 [QUESTION] Восстанавливаем вопрос:', payload);
      
      // Восстанавливаем состояние вопроса
      dispatch(openModal({
        questionId: payload.questionId,
        topic: payload.topic,
        question: payload.question,
        mentor_tip: payload.mentor_tip
      }));
      
      // Эмитим кастомное событие для установки currentPointId в LobbyPage
      window.dispatchEvent(new CustomEvent('question:setCurrentPointId', { 
        detail: { pointId: payload.pointId || String(payload.questionId) } 
      }));
      
      console.log(`📝 [QUESTION] Вопрос восстановлен: ID ${payload.questionId}, тема "${payload.topic}"`);
      console.log(`⏰ [QUESTION] Таймер восстановлен: осталось ${payload.timeLeft} секунд`);
      
      // Эмитим кастомное событие для синхронизации таймера в QuestionModal
      // Добавляем задержку, чтобы модальное окно успело открыться
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('question:timerReset', { 
          detail: { timeLeft: payload.timeLeft } 
        }));
      }, 200); // 200мс задержка
    };
    const onExamStart = (payload: { questions: any[]; index: number }) => {
      dispatch(setExamQuestions(payload.questions));
      dispatch(setExamIndex(payload.index));
      dispatch(openExamModal());
    };
    
    const onExamNext = (payload: { index: number; question?: any }) => {
      dispatch(setExamIndex(payload.index));
    };

    const onExamRestore = (payload: { 
      examId: string;
      questions: any[];
      currentIndex: number;
      correctAnswers: number;
      totalQuestions: number;
      currentQuestion: any;
      timeLeft: number;
    }) => {
      console.log('🔄 [EXAM] Восстанавливаем экзамен:', payload);
      
      // Восстанавливаем состояние экзамена
      dispatch(setExamQuestions(payload.questions));
      dispatch(setExamIndex(payload.currentIndex));
      dispatch(openExamModal());
      
      console.log(`📊 [EXAM] Экзамен восстановлен: вопрос ${payload.currentIndex + 1}/${payload.totalQuestions}, правильных ответов: ${payload.correctAnswers}`);
      console.log(`⏰ [EXAM] Таймер восстановлен: осталось ${payload.timeLeft} секунд`);
    };

    const onExamComplete = () => {
      dispatch(closeExamModal());
      dispatch(clearExamQuestions());
      dispatch(setExamIndex(0));
    };

    const onCloseModal = () => {
      dispatch(closeModal());
    };

    const onNewAchievements = (payload: any) => {
      console.log('🏆 [CLIENT] Получил lobby:newAchievements:', payload);
      // Эмитим кастомное событие для показа уведомления о достижениях
      window.dispatchEvent(new CustomEvent('achievement:received', { 
        detail: payload 
      }));
    };

    const onUserNewAchievements = (payload: any) => {
      console.log('🏆 [CLIENT] Получил user:newAchievements:', payload);
      // Эмитим кастомное событие для показа уведомления о достижениях
      window.dispatchEvent(new CustomEvent('achievement:received', { 
        detail: payload 
      }));
    };

    const onCloseExamModal = () => {
      dispatch(closeExamModal());
    };

    const onExamReward = (payload: { 
      message: string; 
      rewardPoints: number; 
      sessionScore: number; 
      userScores?: Array<{ userId: number; userScore: number }> 
    }) => {
      // Обновляем общий счет лобби
      dispatch(mergeScores({
        sessionScore: payload.sessionScore
      }));
      
      // Обновляем очки текущего пользователя, если он есть в списке
      if (payload.userScores && user?.id) {
        const currentUserScore = payload.userScores.find(us => Number(us.userId) === Number(user.id));
        if (currentUserScore) {
          console.log('🎯 Обновляем очки пользователя:', {
            userId: user.id,
            newScore: currentUserScore.userScore,
            sessionScore: payload.sessionScore
          });
          dispatch(mergeScores({
            userScore: currentUserScore.userScore
          }));
          
          // Обновляем глобальное состояние пользователя для отображения в магазине
          dispatch(updateUserScore(currentUserScore.userScore));
        }
      }

      // Открываем модальное окно поздравления с переходом на новую фазу
      // Определяем номер фазы на основе награды (30 очков = фаза 2, 60 очков = фаза 3)
      const phaseNumber = payload.rewardPoints === 30 ? 2 : 3;
      dispatch(openPhaseTransitionModal({
        phaseNumber,
        rewardPoints: payload.rewardPoints
      }));
    };

    const onExamFailed = (payload: {
      message: string;
      correctAnswers: number;
      totalQuestions: number;
      successRate: number;
      phaseId: number;
    }) => {
      console.log('❌ [EXAM] Экзамен провален:', payload);
      
      // Открываем модальное окно провала экзамена
      dispatch(openExamFailureModal({
        correctAnswers: payload.correctAnswers,
        totalQuestions: payload.totalQuestions,
        successRate: payload.successRate,
        phaseId: payload.phaseId,
      }));
    };

    const onExamIncorrectAnswer = (payload: { message: string }) => {
      console.log('❌ [EXAM] Неправильный ответ в экзамене:', payload);
      
      // Показываем уведомление о неправильном ответе всем игрокам
      dispatch(setModalResult(payload.message));
      
      // Закрываем уведомление через 2 секунды
      setTimeout(() => {
        dispatch(setModalResult(null));
      }, 2000);
    };

    const onExamAnswerSync = (payload: { answer: string; activePlayerName: string }) => {
      console.log('🔄 [EXAM] Синхронизация ответа:', payload);
      // Это событие будет обработано в ExamModal через пропсы
    };

    const onAnswerSync = (payload: { answer: string; activePlayerName: string }) => {
      console.log('🔄 [QUESTION] Синхронизация ответа:', payload);
      // Это событие будет обработано в QuestionModal через пропсы
    };

    const onAnswerInput = (payload: { answer: string; activePlayerName: string }) => {
      console.log('🔄 [QUESTION] Синхронизация ввода:', payload);
      if (onAnswerInputSync) {
        onAnswerInputSync(payload.answer);
      }
    };

    const onExamAnswerInput = (payload: { answer: string; activePlayerName: string }) => {
      console.log('🔄 [EXAM] Синхронизация ввода:', payload);
      if (onExamAnswerInputSync) {
        onExamAnswerInputSync(payload.answer);
      }
    };

    const onExamTimerReset = (payload: { timeLeft: number }) => {
      // Синхронизируем таймер для всех игроков
      console.log('⏰ Синхронизация таймера экзамена:', payload.timeLeft);
      
      // Эмитим кастомное событие для синхронизации таймера в ExamModal
      window.dispatchEvent(new CustomEvent('exam:timerReset', { 
        detail: { timeLeft: payload.timeLeft } 
      }));
    };

    const onTimerReset = (payload: { timeLeft: number }) => {
      // Синхронизируем таймер обычного вопроса для всех игроков
      console.log('⏰ Синхронизация таймера вопроса:', payload.timeLeft);
      
      // Эмитим кастомное событие для синхронизации таймера в QuestionModal
      window.dispatchEvent(new CustomEvent('question:timerReset', { 
        detail: { timeLeft: payload.timeLeft } 
      }));
    };

    const onReconnectWaiting = (payload: { activePlayerName: string; timeLeft: number }) => {
      console.log('⏳ [RECONNECT] Начинаем ожидание переподключения:', payload);
      dispatch(openReconnectWaitingModal({
        activePlayerName: payload.activePlayerName,
        timeLeft: payload.timeLeft
      }));
    };

    const onReconnectTimeout = () => {
      console.log('⏰ [RECONNECT] Время ожидания истекло');
      dispatch(closeReconnectWaitingModal());
    };

    const onReconnectCanceled = () => {
      console.log('✅ [RECONNECT] Ожидание отменено, игрок вернулся');
      dispatch(closeReconnectWaitingModal());
    };

    const onActiveQuestion = (payload: { 
      questionId: number;
      topic: string;
      question: string;
      mentor_tip?: string;
      pointId: string;
      timeLeft: number;
    }) => {
      console.log('👁️ [INACTIVE] Получен активный вопрос для подключения:', payload);
      
      // Восстанавливаем состояние вопроса для неактивного игрока
      dispatch(openModal({
        questionId: payload.questionId,
        topic: payload.topic,
        question: payload.question,
        mentor_tip: payload.mentor_tip
      }));
      
      // Устанавливаем currentPointId
      window.dispatchEvent(new CustomEvent('question:setCurrentPointId', { 
        detail: { pointId: payload.pointId } 
      }));
      
      // Синхронизируем таймер
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('question:timerReset', { 
          detail: { timeLeft: payload.timeLeft } 
        }));
      }, 200);
    };

    const onNoActiveQuestion = () => {
      console.log('❌ [INACTIVE] Нет активного вопроса для подключения');
      // Эмитим кастомное событие для показа уведомления
      window.dispatchEvent(new CustomEvent('question:noActiveQuestion'));
    };

    const onWrongPoint = (payload: { requestedPointId: string; activePointId: string }) => {
      console.log('❌ [INACTIVE] Неправильный поинт! Запрошен:', payload.requestedPointId, 'активный:', payload.activePointId);
      // Эмитим кастомное событие для показа уведомления о неправильном поинте
      window.dispatchEvent(new CustomEvent('question:wrongPoint', { 
        detail: payload 
      }));
    };

    const onActiveExam = (payload: { 
      examId: string;
      questions: any[];
      currentIndex: number;
      correctAnswers: number;
      totalQuestions: number;
      currentQuestion: any;
      timeLeft: number;
    }) => {
      console.log('👁️ [INACTIVE] Получен активный экзамен для подключения:', payload);
      
      // Восстанавливаем состояние экзамена для неактивного игрока
      dispatch(setExamQuestions(payload.questions));
      dispatch(setExamIndex(payload.currentIndex));
      dispatch(openExamModal());
      
      console.log(`📊 [EXAM] Экзамен восстановлен для неактивного игрока: вопрос ${payload.currentIndex + 1}/${payload.totalQuestions}`);
      
      // Синхронизируем таймер
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('exam:timerReset', { 
          detail: { timeLeft: payload.timeLeft } 
        }));
      }, 200);
    };

    const onNoActiveExam = () => {
      console.log('❌ [INACTIVE] Нет активного экзамена для подключения');
      // Эмитим кастомное событие для показа уведомления
      window.dispatchEvent(new CustomEvent('exam:noActiveExam'));
    };

    const onWrongExam = (payload: { requestedExamId: string; activeExamId: string }) => {
      console.log('❌ [INACTIVE] Неправильный экзамен! Запрошен:', payload.requestedExamId, 'активный:', payload.activeExamId);
      // Эмитим кастомное событие для показа уведомления о неправильном экзамене
      window.dispatchEvent(new CustomEvent('exam:wrongExam', { 
        detail: payload 
      }));
    };

    const onActivePointChanged = (payload: { activePointId: string | null }) => {
      console.log('🎯 [ACTIVE POINT] Изменение активного поинта для всех игроков:', payload.activePointId);
      
      // Эмитим кастомное событие для синхронизации активного поинта у всех игроков
      window.dispatchEvent(new CustomEvent('lobby:activePointChanged', { 
        detail: payload 
      }));
    };

    const onFavoriteToggled = (payload: { 
      userId: number; 
      questionId: number; 
      isFavorite: boolean; 
      username: string;
    }) => {
      console.log('⭐ [FAVORITE] Вопрос добавлен/удален из избранного:', payload);
      
      // Эмитим кастомное событие для синхронизации состояния избранного
      window.dispatchEvent(new CustomEvent('favorite:sync', { 
        detail: payload 
      }));
    };
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
    socket.on("lobby:questionRestore", onQuestionRestore);
    socket.on("lobby:examStart", onExamStart);
    socket.on("lobby:examNext", onExamNext);
    socket.on("lobby:examRestore", onExamRestore);
    socket.on("lobby:examComplete", onExamComplete);
    socket.on("lobby:examReward", onExamReward);
    socket.on("lobby:examFailed", onExamFailed);
    socket.on("lobby:examIncorrectAnswer", onExamIncorrectAnswer);
    socket.on("lobby:examAnswerSync", onExamAnswerSync);
    socket.on("lobby:answerSync", onAnswerSync);
    socket.on("lobby:answerInput", onAnswerInput);
    socket.on("lobby:examAnswerInput", onExamAnswerInput);
    socket.on("lobby:examTimerReset", onExamTimerReset);
    socket.on("lobby:timerReset", onTimerReset);
    socket.on("lobby:reconnectWaiting", onReconnectWaiting);
    socket.on("lobby:reconnectTimeout", onReconnectTimeout);
    socket.on("lobby:reconnectCanceled", onReconnectCanceled);
    socket.on("lobby:timeout", onTimeout);
    socket.on("lobby:passTurnNotification", onPassTurnNotification);
    socket.on("lobby:closeModal", onCloseModal);
    socket.on("lobby:newAchievements", onNewAchievements);
    socket.on("user:newAchievements", onUserNewAchievements);
    socket.on("lobby:closeExamModal", onCloseExamModal);
    socket.on("lobby:activeQuestion", onActiveQuestion);
    socket.on("lobby:noActiveQuestion", onNoActiveQuestion);
    socket.on("lobby:wrongPoint", onWrongPoint);
    socket.on("lobby:activeExam", onActiveExam);
    socket.on("lobby:noActiveExam", onNoActiveExam);
    socket.on("lobby:wrongExam", onWrongExam);
    socket.on("lobby:activePointChanged", onActivePointChanged);
    socket.on("lobby:favoriteToggled", onFavoriteToggled);

    return () => {
      // Не отправляем leaveLobby при размонтировании - пусть сработает обычный disconnect
      // socket.emit("leaveLobby");
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
      socket.off("lobby:questionRestore", onQuestionRestore);
      socket.off("lobby:examStart", onExamStart);
      socket.off("lobby:examNext", onExamNext);
      socket.off("lobby:examRestore", onExamRestore);
      socket.off("lobby:examComplete", onExamComplete);
      socket.off("lobby:examReward", onExamReward);
      socket.off("lobby:examAnswerSync", onExamAnswerSync);
      socket.off("lobby:answerSync", onAnswerSync);
      socket.off("lobby:answerInput", onAnswerInput);
      socket.off("lobby:examAnswerInput", onExamAnswerInput);
      socket.off("lobby:examTimerReset", onExamTimerReset);
      socket.off("lobby:timerReset", onTimerReset);
      socket.off("lobby:reconnectWaiting", onReconnectWaiting);
      socket.off("lobby:reconnectTimeout", onReconnectTimeout);
      socket.off("lobby:reconnectCanceled", onReconnectCanceled);
      socket.off("lobby:closeModal", onCloseModal);
      socket.off("lobby:newAchievements", onNewAchievements);
      socket.off("user:newAchievements", onUserNewAchievements);
      socket.off("lobby:activeQuestion", onActiveQuestion);
      socket.off("lobby:noActiveQuestion", onNoActiveQuestion);
      socket.off("lobby:wrongPoint", onWrongPoint);
      socket.off("lobby:activeExam", onActiveExam);
      socket.off("lobby:noActiveExam", onNoActiveExam);
      socket.off("lobby:wrongExam", onWrongExam);
      socket.off("lobby:activePointChanged", onActivePointChanged);
      socket.off("lobby:favoriteToggled", onFavoriteToggled);
      socket.disconnect();
    };
  }, [dispatch, lobbyId, token]);

  const sendChatMessage = (text: string) => {
    if (!text.trim() || !connected) return;
    socketClient.socket.emit("chat:message", { text });
  };

  const sendAnswer = (pointId: string, correct: boolean, answer?: string) => {
    socketClient.socket.emit("lobby:answer", { lobbyId, pointId, correct, answer });
  };

  const sendTimeout = (pointId: string) => {
    socketClient.socket.emit("lobby:timeout", { lobbyId, pointId });
  };

  const sendExamComplete = (correctAnswers: number, totalQuestions: number) => {
    socketClient.socket.emit("lobby:examComplete", { lobbyId, correctAnswers, totalQuestions});
  };
  
  const sendOpenModal = (payload: { questionId: number; topic: string; question: string; mentor_tip?: string; pointId?: string }) => {
    socketClient.socket.emit("lobby:openModal", payload);
  };
  const sendOpenExam = (payload?: { questions?: any[]; examId?: string }) => {
    socketClient.socket.emit("lobby:openExam", payload ?? {});
  };
  const sendExamAnswerProgress = (correct?: boolean, isTimeout?: boolean, answer?: string) => {
    socketClient.socket.emit("lobby:examAnswer", { 
      correct: Boolean(correct), 
      isTimeout: Boolean(isTimeout),
      answer: answer 
    });
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

  const sendAnswerInput = (answer: string, activePlayerName: string) => {
    socketClient.socket.emit("lobby:answerInput", { answer, activePlayerName });
  };

  const sendExamAnswerInput = (answer: string, activePlayerName: string) => {
    socketClient.socket.emit("lobby:examAnswerInput", { answer, activePlayerName });
  };

  const sendFavoriteToggle = (questionId: number, isFavorite: boolean) => {
    socketClient.socket.emit("lobby:favoriteToggle", { questionId, isFavorite });
  };

  const sendLeaveLobby = () => {
    socketClient.socket.emit("leaveLobby");
  };

  const sendCheckActiveQuestion = (pointId?: string) => {
    socketClient.socket.emit("lobby:checkActiveQuestion", { pointId });
  };

  const sendCheckActiveExam = (examId?: string) => {
    socketClient.socket.emit("lobby:checkActiveExam", { examId });
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
    sendAnswerInput,
    sendExamAnswerInput,
    sendFavoriteToggle,
    sendLeaveLobby,
    sendCheckActiveQuestion,
    sendCheckActiveExam,
  };
};
