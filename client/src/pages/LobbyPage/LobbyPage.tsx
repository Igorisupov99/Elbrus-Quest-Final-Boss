import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./LobbyPage.module.css";
import { Button } from "../../components/common/Button/Button";
import { Point, type POIStatus } from "../../components/map/Point/Point";
import { QuestionModal } from "../../components/common/modals/QuestionModal/QuestionModal";
import { ExamModal } from "../../components/common/modals/ExamModal/ExamModal";
import api from "../../api/axios";
import { useLobbySocket } from "../../hooks/useLobbySocket";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { updatePointStatus, mergeScores, openModal as openModalAction, closeModal as closeModalAction, openExamModal as openExamModalAction, closeExamModal as closeExamModalAction, setModalResult, closePhaseTransitionModal, closeExamFailureModal } from "../../store/lobbyPage/lobbySlice";
import PhaseTransitionModal from "../../components/common/modals/PhaseTransitionModal";
import ExamFailureModal from "../../components/common/modals/ExamFailureModal";

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
  const examFailureModal = useAppSelector(s => s.lobbyPage.examFailureModal);
  const {
    history,
    connected,
    connecting,
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
  } = useLobbySocket(lobbyId);

  const [input, setInput] = useState("");
  const [mapNaturalSize, setMapNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [currentPointId, setCurrentPointId] = useState<string | null>(null);
  
  const modal = useAppSelector(s => s.lobbyPage.modal);
  const examModalOpenGlobal = useAppSelector(s => s.lobbyPage.examModalOpen);
  const modalResult = useAppSelector(s => s.lobbyPage.modalResult);

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

    // Проверяем, что нажимает активный игрок
    if (user?.id !== activePlayerId) return;

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
          mentor_tip: res.data.mentor_tip || null
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    sendChatMessage(text);
    setInput("");
  };

  const handleExitLobby = () => navigate("/");

  const handleExamComplete = (correctAnswers: number, totalQuestions: number) => {
    dispatch(updatePointStatus({ pointId: "exam", status: "completed" }));
    sendExamComplete(correctAnswers, totalQuestions);
  };

  const handleAnswerResult = (correct: boolean, scores: any) => {
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
    }
    
    if (correct && currentPointId) {
      dispatch(updatePointStatus({ pointId: currentPointId, status: "completed" }));
      sendAnswer(currentPointId, true);
      
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

  const handleLocalIncorrectAnswer = () => {
    if (!currentPointId) return;
    
    const newIncorrectCount = (incorrectAnswers || 0) + 1;
    dispatch(mergeScores({
      incorrectAnswers: newIncorrectCount
    }));
    
    // Отправляем обновление счетчика всем игрокам
    sendIncorrectAnswer(newIncorrectCount);
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

  const handleTimeout = (pointId: string) => {
    sendTimeout(pointId);
  };

  const handleTimeoutClose = () => {
    if (!currentPointId) return;
    
    // Засчитываем неправильный ответ при истечении времени
    const newIncorrectCount = (incorrectAnswers || 0) + 1;
    dispatch(mergeScores({
      incorrectAnswers: newIncorrectCount
    }));
    
    // Отправляем обновление счетчика всем игрокам без показа уведомления
    sendIncorrectCountUpdate(newIncorrectCount);
    
    // Передаем ход следующему игроку
    sendPassTurn();
    
    // Показываем уведомление о передаче хода
    dispatch(setModalResult('Ход будет передан следующему игроку'));
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
            onClick={openModal}
          />
        ))}
        
        {/* Модальные окна рендерятся внутри области карты */}
         <QuestionModal
           isOpen={modal.isOpen}
           onClose={() => { dispatch(closeModalAction()); setCurrentPointId(null); }}
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
           sharedResult={modalResult}
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
          onExamComplete={handleExamComplete}
          onLocalIncorrectAnswer={handleLocalIncorrectAnswer}
          onTimeout={handleTimeout}
          sharedResult={modalResult}
          questions={useAppSelector(s => s.lobbyPage.examQuestions)}
          onAdvance={(correct: boolean, isTimeout?: boolean) => {
            // Сообщаем серверу, был ли ответ правильным, чтобы он продвинул индекс
            (sendExamAnswerProgress as any)?.(correct, isTimeout);
          }}
          onTimerReset={(timeLeft: number) => {
            // Синхронизируем таймер при получении события с сервера
            console.log('⏰ Синхронизация таймера:', timeLeft);
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
                {user.username}
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
                    : styles.message
                }
                title={new Date(m.createdAt).toLocaleString()}
              >
                {m.user.username !== "system" && (
                  <span className={styles.author}>{m.user.username}:</span>
                )}
                <span className={styles.text}>{m.text}</span>
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

    </div>
  );
}