import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./LobbyPage.module.css";
import { Button } from "../../components/common/Button/Button";
import { Point, type POIStatus } from "../../components/map/Point/Point";
import { QuestionModal } from "../../components/common/modals/QuestionModal/QuestionModal";
import { ExamModal } from "../../components/common/modals/ExamModal/ExamModal";
import UserActionsModal from "../../components/common/modals/UserActionsModal/UserActionsModal";
import api from "../../api/axios";
import { useLobbySocket } from "../../hooks/useLobbySocket";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { updatePointStatus, mergeScores, openModal as openModalAction, closeModal as closeModalAction, openExamModal as openExamModalAction, closeExamModal as closeExamModalAction, setModalResult, closePhaseTransitionModal, closeExamFailureModal, closeReconnectWaitingModal } from "../../store/lobbyPage/lobbySlice";
import { updateUserScore } from "../../store/authSlice";
import { AchievementNotification } from "../../components/Achievement/AchievementNotification/AchievementNotification";
import type { Achievement } from "../../types/achievement";
import PhaseTransitionModal from "../../components/common/modals/PhaseTransitionModal";
import ExamFailureModal from "../../components/common/modals/ExamFailureModal";
import { ReconnectWaitingModal } from "../../components/common/modals/ReconnectWaitingModal";
// import { CloseConfirmModal } from "../../components/common/modals/CloseConfirmModal"; // Больше не нужен

export function LobbyPage() {
  const { id } = useParams<{ id: string }>();
  const lobbyId = useMemo(() => Number(id), [id]);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const usersInLobby = useAppSelector(s => s.lobbyPage.users);
  const activePlayerId = useAppSelector(s => s.lobbyPage.activePlayerId);
  const points = useAppSelector(s => s.lobbyPage.points);
  const { user } = useAppSelector(s => s.auth)
  const { userScore, sessionScore, incorrectAnswers } = useAppSelector(s => s.lobbyPage.scores);
  const phaseTransitionModal = useAppSelector(s => s.lobbyPage.phaseTransitionModal);
  
  // Логирование очков для отладки
  useEffect(() => {
    console.log(`💰 [LobbyPage] Текущие очки пользователя: ${userScore}`);
  }, [userScore]);
  const examFailureModal = useAppSelector(s => s.lobbyPage.examFailureModal);
  const reconnectWaitingModal = useAppSelector(s => s.lobbyPage.reconnectWaitingModal);
  const {
    history,
    connected,
    connecting,
    sendChatMessage,
    sendAnswer,
    sendTimeout,
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
    sendLeaveLobby,
    sendCheckActiveQuestion,
    sendCheckActiveExam,
    sendAIQuestion,
  } = useLobbySocket(
    lobbyId,
    (answer: string) => setSyncedAnswer(answer),
    (answer: string) => setSyncedExamAnswer(answer)
  );

  const [input, setInput] = useState("");
  const [mapNaturalSize, setMapNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [currentPointId, setCurrentPointId] = useState<string | null>(null);
  const [syncedAnswer, setSyncedAnswer] = useState("");
  const [syncedExamAnswer, setSyncedExamAnswer] = useState("");
  
  const modal = useAppSelector(s => s.lobbyPage.modal);
  const examModalOpenGlobal = useAppSelector(s => s.lobbyPage.examModalOpen);
  const modalResult = useAppSelector(s => s.lobbyPage.modalResult);

  const [achievementNotifications, setAchievementNotifications] = useState<Achievement[]>([]);
  const [inactivePlayerNotification, setInactivePlayerNotification] = useState<string | null>(null);
  const [activeQuestionPointId, setActiveQuestionPointId] = useState<string | null>(null);
  
  // Состояние для модального окна действий пользователя
  const [isUserActionsModalOpen, setIsUserActionsModalOpen] = useState(false);
  const [selectedUsername, setSelectedUsername] = useState("");
  useEffect(() => {
    const img = new Image();
    img.src = '/map.png';
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        setMapNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
      }
    };
  }, []);

  const listRef = useRef<HTMLDivElement | null>(null);

  const openModal = async (pointId: string) => {
    const point = points.find(p => p.id === pointId);
    if (!point || point.status !== "available") return;

    // Если неактивный игрок пытается открыть вопрос или экзамен
    if (user?.id !== activePlayerId) {
      if (pointId === "exam" || pointId === "exam2") {
        // Для экзамена запрашиваем активный экзамен
        console.log('👁️ [INACTIVE] Неактивный игрок запрашивает активный экзамен для поинта:', pointId);
        sendCheckActiveExam(pointId);
      } else {
        // Для обычного вопроса запрашиваем активный вопрос
        console.log('👁️ [INACTIVE] Неактивный игрок запрашивает активный вопрос для поинта:', pointId);
        sendCheckActiveQuestion(pointId);
      }
      return;
    }

    try {
      if (pointId !== "exam" && pointId !== "exam2") {
        const res = await api.get("/api/question/textQuestion", {
          params: { phase_id: point.phaseId, topic_id: point.topicId },
          withCredentials: true,
        });
        
        const payload = { 
          questionId: res.data.question_id, 
          topic: res.data.topic_title || "Без названия", 
          question: res.data.question_text,
          mentor_tip: res.data.mentor_tip || null,
          pointId: pointId
        };
        
        setCurrentPointId(pointId);
        dispatch(openModalAction(payload));
        sendOpenModal(payload);
      } else {
        const phaseId = pointId === "exam" ? 1 : 2;
        const res = await api.get("/api/exam/examQuestion", {
          params: { phase_id: phaseId, count: usersInLobby.length + incorrectAnswers },
          withCredentials: true,
        });
        const questions = res.data?.questions ?? [];
        dispatch(openExamModalAction());
        sendOpenExam({ questions, examId: pointId });
      }
    } catch (err) {
      console.error("Ошибка при получении вопроса:", err);
    }
  };

  // УДАЛИТЬ: loadExamQuestions перенесена в ExamModal

  const updatePoint = (pointId: string, status: POIStatus) => {
    dispatch(updatePointStatus({ pointId, status }));
  };

  useEffect(() => {
    // Фаза 1: разблокировать экзамен, когда все 1-4 выполнены, но НЕ трогать если уже completed
    const phase1 = points.filter(p => p.phaseId === 1 && p.id !== "exam");
    const exam1 = points.find(p => p.id === "exam");
    const phase1AllDone = phase1.every(p => p.status === "completed");
    if (exam1 && exam1.status !== "completed") {
      if (phase1AllDone && exam1.status === "locked") updatePoint("exam", "available");
      if (!phase1AllDone && exam1.status === "available") updatePoint("exam", "locked");
    }

    // После завершения экзамена 1 — разблокировать темы 5-8 (фаза 2)
    const exam1Completed = exam1?.status === "completed";
    const phase2 = points.filter(p => p.phaseId === 2 && p.id !== "exam2");
    if (exam1Completed) {
      phase2.forEach(p => {
        if (p.status === "locked") updatePoint(p.id, "available");
      });
    }

    // Фаза 2: экзамен 2 становится доступен, когда темы 5-8 выполнены
    const exam2 = points.find(p => p.id === "exam2");
    const phase2AllDone = phase2.every(p => p.status === "completed");
    if (exam2 && exam2.status !== "completed") {
      if (phase2AllDone && exam2.status === "locked") updatePoint("exam2", "available");
      if (!phase2AllDone && exam2.status === "available") updatePoint("exam2", "locked");
    }
  }, [points]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [history]);

  useEffect(() => {
    if (!lobbyId || Number.isNaN(lobbyId)) { navigate("/"); return; }
    const token = localStorage.getItem("accessToken");
    if (!token) { navigate("/login"); return; }
  }, [lobbyId, navigate]);

  // Обработчик уведомлений о достижениях
  useEffect(() => {
    const handleAchievementReceived = (event: CustomEvent) => {
      const { userId, achievements } = event.detail;
      
      // Показываем уведомления только для текущего пользователя
      if (user && Number(userId) === Number(user.id)) {
        setAchievementNotifications(achievements);
      }
    };

    window.addEventListener('achievement:received', handleAchievementReceived as EventListener);
    
    return () => {
      window.removeEventListener('achievement:received', handleAchievementReceived as EventListener);
    };
  }, [user]);

  // Обработчик установки currentPointId при восстановлении вопроса
  useEffect(() => {
    const handleSetCurrentPointId = (event: CustomEvent) => {
      const { pointId } = event.detail;
      console.log('🔄 [QUESTION] Устанавливаем currentPointId при восстановлении:', pointId);
      setCurrentPointId(pointId);
    };

    const handleNoActiveQuestion = () => {
      console.log('❌ [INACTIVE] Нет активного вопроса - показываем уведомление');
      const activePlayer = usersInLobby.find(u => u.id === activePlayerId);
      const activePlayerName = activePlayer?.username || 'другой игрок';
      setInactivePlayerNotification(`Сейчас вопрос выбирает ${activePlayerName}`);
      setTimeout(() => setInactivePlayerNotification(null), 3000);
    };

    const handleWrongPoint = (event: CustomEvent) => {
      const { activePointId } = event.detail;
      console.log('❌ [INACTIVE] Неправильный поинт - показываем уведомление');
      
      // Находим название активного поинта
      const activePoint = points.find(p => p.id === activePointId);
      const activePointTitle = activePoint?.title || `поинт ${activePointId}`;
      
      setInactivePlayerNotification(`Активный вопрос находится в "${activePointTitle}"`);
      setTimeout(() => setInactivePlayerNotification(null), 3000);
    };

    const handleActivePointChanged = (event: CustomEvent) => {
      const { activePointId } = event.detail;
      setActiveQuestionPointId(activePointId);
    };

    const handleNoActiveExam = () => {
      console.log('❌ [INACTIVE] Нет активного экзамена - показываем уведомление');
      const activePlayer = usersInLobby.find(u => u.id === activePlayerId);
      const activePlayerName = activePlayer?.username || 'другой игрок';
      setInactivePlayerNotification(`Сейчас экзамен выбирает ${activePlayerName}`);
      setTimeout(() => setInactivePlayerNotification(null), 3000);
    };

    const handleWrongExam = (event: CustomEvent) => {
      const { activeExamId } = event.detail;
      console.log('❌ [INACTIVE] Неправильный экзамен - показываем уведомление');
      
      // Находим название активного экзамена
      const examName = activeExamId === 'exam2' ? 'Экзамен 2' : 'Экзамен';
      
      setInactivePlayerNotification(`Активный экзамен: "${examName}"`);
      setTimeout(() => setInactivePlayerNotification(null), 3000);
    };

    window.addEventListener('question:setCurrentPointId', handleSetCurrentPointId as EventListener);
    window.addEventListener('question:noActiveQuestion', handleNoActiveQuestion as EventListener);
    window.addEventListener('question:wrongPoint', handleWrongPoint as EventListener);
    window.addEventListener('exam:noActiveExam', handleNoActiveExam as EventListener);
    window.addEventListener('exam:wrongExam', handleWrongExam as EventListener);
    window.addEventListener('lobby:activePointChanged', handleActivePointChanged as EventListener);
    
    return () => {
      window.removeEventListener('question:setCurrentPointId', handleSetCurrentPointId as EventListener);
      window.removeEventListener('question:noActiveQuestion', handleNoActiveQuestion as EventListener);
      window.removeEventListener('question:wrongPoint', handleWrongPoint as EventListener);
      window.removeEventListener('exam:noActiveExam', handleNoActiveExam as EventListener);
      window.removeEventListener('exam:wrongExam', handleWrongExam as EventListener);
      window.removeEventListener('lobby:activePointChanged', handleActivePointChanged as EventListener);
    };
  }, [usersInLobby, activePlayerId, points]);

  // Локальное отслеживание больше не нужно - используем глобальные события через сокеты

  const handleCloseAchievementNotification = () => {
    setAchievementNotifications([]);
  };

  const handleQuestionModalClose = () => {
    // Если текущий игрок активный - закрываем и засчитываем как неправильный ответ
    if (user?.id === activePlayerId) {
      console.log('🔒 [ACTIVE] Активный игрок закрывает вопрос - засчитываем как неправильный ответ');
      
      if (!currentPointId) return;
      
      // Засчитываем неправильный ответ при закрытии активным игроком
      const newIncorrectCount = (incorrectAnswers || 0) + 1;
      dispatch(mergeScores({
        incorrectAnswers: newIncorrectCount
      }));
      
      // Отправляем событие закрытия активным игроком (засчитывается как неправильный ответ)
      sendTimeout(currentPointId);
      
      return;
    }

    // Если неактивный игрок - закрываем локально (можно переоткрыть)
    console.log('🔒 [INACTIVE] Неактивный игрок закрывает вопрос локально');
    dispatch(closeModalAction());
    setCurrentPointId(null);
  };

  // Функции handleConfirmClose и handleCancelClose больше не нужны


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    sendChatMessage(text);
    setInput("");
  };


  const handleExitLobby = () => {
    sendLeaveLobby(); // Отправляем намеренный выход из лобби
    navigate("/");
  };

  const handleUserClick = (username: string) => {
    // Не открываем модальное окно для своего собственного имени
    if (user?.username === username) return;
    
    setSelectedUsername(username);
    setIsUserActionsModalOpen(true);
  };

  const handleGoToProfile = () => {
    // TODO: Реализовать переход в профиль пользователя
    console.log(`Переход в профиль пользователя: ${selectedUsername}`);
  };

  const handleAddFriend = async () => {
    if (!selectedUsername) return;
    
    try {
      console.log('Начинаем добавление в друзья для:', selectedUsername);
      
      // Получаем ID пользователя по username
      const { getUserByUsername, sendFriendRequest } = await import('../../api/friendship/friendshipApi');
      const userResponse = await getUserByUsername(selectedUsername);
      
      console.log('Результат поиска пользователя:', userResponse);
      
      if (userResponse.success && userResponse.data) {
        console.log('Отправляем запрос на дружбу для ID:', userResponse.data.id);
        const friendResponse = await sendFriendRequest(userResponse.data.id);
        
        console.log('Результат отправки запроса:', friendResponse);
        
        if (friendResponse.success) {
          alert(`Запрос на дружбу отправлен пользователю ${selectedUsername}`);
        } else {
          console.error('Ошибка при отправке запроса:', friendResponse.message);
          alert(friendResponse.message || 'Ошибка при отправке запроса на дружбу');
        }
      } else {
        console.error('Пользователь не найден:', userResponse.message);
        alert(userResponse.message || 'Пользователь не найден');
      }
    } catch (error: any) {
      console.error('Критическая ошибка при добавлении в друзья:', error);
      alert(`Ошибка при добавлении в друзья: ${error.message || 'Неизвестная ошибка'}`);
    }
    
    // Модальное окно будет закрыто в UserActionsModal, не закрываем здесь дважды
  };


  const handleAnswerResult = (correct: boolean, scores: any, answer?: string) => {
    if (correct && scores) {
      // При правильном ответе обновляем очки из сервера
      const nested = (scores as any)?.scores;
      const isNumber = typeof scores === 'number';
      const flat = !nested && !isNumber ? scores : undefined;

      const nextUserScore = isNumber
        ? scores
        : nested
        ? (nested.userScore ?? nested.user_score ?? userScore)
        : (flat?.userScore ?? flat?.user_score ?? userScore);

      const nextSessionScore = isNumber
        ? scores
        : nested
        ? (nested.sessionScore ?? nested.session_score ?? sessionScore)
        : (flat?.sessionScore ?? flat?.session_score ?? sessionScore);

      const nextIncorrect = (nested?.incorrectAnswers ?? flat?.incorrectAnswers ?? incorrectAnswers);

      dispatch(mergeScores({
        userScore: Number(nextUserScore),
        sessionScore: Number(nextSessionScore),
        incorrectAnswers: Number(nextIncorrect),
      }));
      
      // Обновляем глобальное состояние пользователя для отображения в магазине
      dispatch(updateUserScore(Number(nextUserScore)));
    }
    
    if (correct && currentPointId) {
      dispatch(updatePointStatus({ pointId: currentPointId, status: "completed" }));
      sendAnswer(currentPointId, true, answer);
      
      // Отправляем уведомление о правильном ответе всем игрокам
      sendCorrectAnswer();
      
      // Локально закрываем модалку у активного игрока
      setTimeout(() => {
        dispatch(closeModalAction());
        setCurrentPointId(null);
      }, 3000);
    } else if (currentPointId) {
      // При неправильном ответе увеличиваем счетчик неправильных ответов
      const newIncorrectCount = (incorrectAnswers || 0) + 1;
      dispatch(mergeScores({
        incorrectAnswers: newIncorrectCount
      }));
      
      // Отправляем уведомление и обновление счетчика всем игрокам
      // НЕ передаем ход следующему игроку - активный игрок может попробовать еще раз
      sendIncorrectAnswer(newIncorrectCount);
    }
  };


  const handleCloseModal = () => {
    if (!currentPointId) return;
    
    // Засчитываем неправильный ответ при закрытии модалки
    const newIncorrectCount = (incorrectAnswers || 0) + 1;
    dispatch(mergeScores({
      incorrectAnswers: newIncorrectCount
    }));
    
    // Отправляем обновление счетчика всем игрокам без показа уведомления
    sendIncorrectCountUpdate(newIncorrectCount);
    
    // Передаем ход следующему игроку
    sendPassTurn();
    
    // Отправляем уведомление о передаче хода всем игрокам
    sendPassTurnNotification();
    
    // Локально закрываем модалку после показа уведомления
    setTimeout(() => {
      dispatch(closeModalAction());
      setCurrentPointId(null);
      // Отправляем событие закрытия модалки после показа уведомления
      sendCloseModal();
    }, 2000);
  };


  const handleTimeoutClose = () => {
    if (!currentPointId) return;
    
    console.log('⏰ [TIMEOUT] Время истекло для вопроса:', currentPointId);
    
    // Засчитываем неправильный ответ при истечении времени
    const newIncorrectCount = (incorrectAnswers || 0) + 1;
    dispatch(mergeScores({
      incorrectAnswers: newIncorrectCount
    }));
    
    // Отправляем обновление счетчика всем игрокам без показа уведомления
    sendIncorrectCountUpdate(newIncorrectCount);
    
    // Отправляем событие таймаута на сервер (сервер сам передаст ход)
    sendTimeout(currentPointId);
    
    // Показываем уведомление о передаче хода
    dispatch(setModalResult('⏰ Время истекло! Ход передается следующему игроку'));
    setTimeout(() => {
      dispatch(setModalResult(null));
      dispatch(closeModalAction());
      setCurrentPointId(null);
      // Отправляем событие закрытия модалки после показа уведомления
      sendCloseModal();
    }, 2000);
  };

  return (
    <div className={styles.lobbyPage}>
      <div
        className={styles.gameArea}
        style={mapNaturalSize ? ({ aspectRatio: `${mapNaturalSize.w} / ${mapNaturalSize.h}` } as React.CSSProperties) : undefined}
      >
        {points.map(point => (
          <Point
            key={point.id}
            id={point.id}
            title={point.title}
            top={point.top}
            left={point.left}
            status={point.status}
            isActive={activeQuestionPointId === point.id}
            onClick={openModal}
          />
        ))}
        
        {/* Модальные окна рендерятся внутри области карты */}
         <QuestionModal
           isOpen={modal.isOpen}
           onClose={handleQuestionModalClose}
           topic={modal.topic}
           question={modal.question}
           questionId={modal.questionId}
           lobbyId={lobbyId}
           onAnswerResult={handleAnswerResult}
           onCloseModal={handleCloseModal}
           onTimeoutClose={handleTimeoutClose}
           currentUserId={user?.id ?? 0}
           activePlayerId={activePlayerId}
           activePlayerName={
             usersInLobby.find(u => u.id === activePlayerId)?.username ?? ''
           }
           mentor_tip={modal.mentor_tip}
           userScore={userScore}
           sharedResult={modalResult}
           onAnswerSync={(answer: string, activePlayerName: string) => {
             // Синхронизируем ответ активного игрока
             console.log('🔄 Синхронизация ответа:', { answer, activePlayerName });
             sendAnswerInput(answer, activePlayerName);
           }}
           syncedAnswer={syncedAnswer}
         />

        <ExamModal
          isOpen={examModalOpenGlobal}
          onClose={() => {
            dispatch(closeExamModalAction());
          }}
          lobbyId={lobbyId}
          currentUserId={user?.id ?? 0}
          activePlayerId={activePlayerId}
          activePlayerName={
            usersInLobby.find(u => u.id === activePlayerId)?.username ?? ''
          }
          questions={useAppSelector(s => s.lobbyPage.examQuestions)}
          onAdvance={(correct: boolean, isTimeout?: boolean, answer?: string) => {
            // Сообщаем серверу, был ли ответ правильным, чтобы он продвинул индекс
            (sendExamAnswerProgress as any)?.(correct, isTimeout, answer);
          }}
          onTimerReset={(timeLeft: number) => {
            // Синхронизируем таймер при получении события с сервера
            console.log('⏰ Синхронизация таймера:', timeLeft);
          }}
          onAnswerSync={(answer: string, activePlayerName: string) => {
            // Синхронизируем ответ активного игрока
            console.log('🔄 Синхронизация ответа:', { answer, activePlayerName });
            sendExamAnswerInput(answer, activePlayerName);
          }}
          syncedAnswer={syncedExamAnswer}
          onExamFail={() => {
            // Проваливаем экзамен при закрытии активным игроком
            console.log('❌ Экзамен провален при закрытии активным игроком');
            // Отправляем событие провала экзамена на сервер
            // Это будет обработано сервером и покажет модальное окно провала
            sendExamAnswerProgress(false, false, 'exam_closed_by_user');
          }}
        />

        <PhaseTransitionModal
          isOpen={phaseTransitionModal.isOpen}
          onClose={() => dispatch(closePhaseTransitionModal())}
          phaseNumber={phaseTransitionModal.phaseNumber}
          rewardPoints={phaseTransitionModal.rewardPoints}
        />

        <ExamFailureModal
          isOpen={examFailureModal.isOpen}
          onClose={() => dispatch(closeExamFailureModal())}
          correctAnswers={examFailureModal.correctAnswers}
          totalQuestions={examFailureModal.totalQuestions}
          successRate={examFailureModal.successRate}
          phaseId={examFailureModal.phaseId}
        />

        <ReconnectWaitingModal
          isOpen={reconnectWaitingModal.isOpen}
          activePlayerName={reconnectWaitingModal.activePlayerName}
          timeLeft={reconnectWaitingModal.timeLeft}
          onTimeUp={() => {
            console.log('⏰ Время ожидания переподключения истекло');
            dispatch(closeReconnectWaitingModal());
          }}
        />

        {/* CloseConfirmModal больше не нужен - неактивные игроки могут закрывать локально */}
      </div>

      <div className={styles.sidebar}>
        <Button className={styles.exitButton} onClick={handleExitLobby}>
          Выйти из комнаты
        </Button>

        <div className={styles.usersList}>
          <h3>Пользователи в комнате</h3>
          <ul>
            {usersInLobby.map(user => (
              <li
                key={user.id}
                className={styles.userItem}
                style={{
                  color: user.id === activePlayerId ? '#4caf50' : 'inherit',
                  fontWeight: user.id === activePlayerId ? 'bold' : 'normal'
                }}
              >
                <span 
                  className={styles.clickableUsername}
                  onClick={() => handleUserClick(user.username)}
                >
                  {user.username}
                </span>
                {user.id === activePlayerId && ' (активный)'}
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.scores}>
          <h3>Ваши очки</h3>
          <p>Общий счёт: {userScore}</p>
          <p>В этой игре: {sessionScore}</p>
          <p>Неправильных ответов: {incorrectAnswers}</p> {/* Используем из Redux */}
        </div>

        <div className={styles.chat}>
          <h3 className={styles.chatTitle}>
            Чат комнаты{' '}
            <span
              className={`${styles.connectionIndicator} ${
                connecting
                  ? styles.connecting
                  : connected
                  ? styles.online
                  : styles.offline
              }`}
            />
          </h3>

          <div ref={listRef} className={styles.chatList}>
            {history.map(m => (
              <div
                key={m.id}
                className={
                  m.user.username === "system"
                    ? styles.systemMessage
                    : (m as any).isAI
                    ? styles.aiMessage
                    : styles.message
                }
                title={new Date(m.createdAt).toLocaleString()}
              >
                {m.user.username !== "system" && (
                  <span className={styles.author}>{m.user.username}:</span>
                )}
                <span className={styles.text}>{m.text}</span>
                {(m as any).usage && (
                  <div className={styles.usageInfo}>
                    Токены: {(m as any).usage.totalTokens}
                  </div>
                )}
              </div>
            ))}
          </div>


          <form className={styles.chatForm} onSubmit={handleSubmit}>
            <input
              className={styles.chatInput}
              placeholder={
                connecting
                  ? 'Подключение…'
                  : connected
                  ? 'Напишите сообщение…'
                  : 'Отключено'
              }
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={!connected}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendChatMessage(input.trim());
                  setInput("");
                }
              }}
            />
            <Button
              type="submit"
              className={styles.sendButton}
              disabled={!connected || !input.trim()}
            >
              Отправить
            </Button>
          </form>
        </div>
      </div>

      {/* Модальное окно действий пользователя */}
      <UserActionsModal
        isOpen={isUserActionsModalOpen}
        onClose={() => setIsUserActionsModalOpen(false)}
        username={selectedUsername}
        onGoToProfile={handleGoToProfile}
        onAddFriend={handleAddFriend}
      />

      {/* Уведомления о достижениях */}
      {achievementNotifications.length > 0 && (
        <AchievementNotification
          achievements={achievementNotifications}
          onClose={handleCloseAchievementNotification}
        />
      )}

      {/* Уведомление для неактивного игрока */}
      {inactivePlayerNotification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255, 107, 53, 0.95)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          fontWeight: 'bold',
          fontSize: '16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          zIndex: 9999,
          animation: 'fadeInOut 3s ease-in-out forwards',
          fontFamily: 'Cinzel, serif'
        }}>
          ⚠️ {inactivePlayerNotification}
        </div>
      )}

    </div>
  );
}