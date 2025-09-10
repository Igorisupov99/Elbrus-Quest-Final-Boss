import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./LobbyPage.module.css";
import { Button } from "../../components/common/Button/Button";
import { Point, type POIStatus } from "../../components/map/Point/Point";
import { QuestionModal } from "../../components/common/modals/QuestionModal/QuestionModal";
import { ExamModal } from "../../components/common/modals/ExamModal/ExamModal";
import { UserActionsModal } from "../../components/common/modals/UserActionsModal";
import api from "../../api/axios";
import { useLobbySocket } from "../../hooks/useLobbySocket";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { updatePointStatus, mergeScores, openModal as openModalAction, closeModal as closeModalAction, openExamModal as openExamModalAction, closeExamModal as closeExamModalAction } from "../../store/lobbyPage/lobbySlice";

// УДАЛИТЬ: ExamQuestion перенесен в ExamModal

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
  } = useLobbySocket(lobbyId);

  const [input, setInput] = useState("");
  const [mapNaturalSize, setMapNaturalSize] = useState<{ w: number; h: number } | null>(null);
  
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

  // локальная модалка (для обратной совместимости). Также используем redux.modal для синхронизации через сокет
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTopic, setCurrentTopic] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentQuestionId, setCurrentQuestionId] = useState<number | null>(null);
  const [currentMentorTip, setCurrentMentorTip] = useState<string | null>(null);
  const [currentPointId, setCurrentPointId] = useState<string | null>(null);
  const modal = useAppSelector(s => s.lobbyPage.modal);
  const examModalOpenGlobal = useAppSelector(s => s.lobbyPage.examModalOpen);
  const modalResult = useAppSelector(s => s.lobbyPage.modalResult);

  // Вычисляемые значения модалки: если в Redux есть открытая модалка — используем её
  const effectiveIsOpen = isModalOpen || modal.isOpen;
  const effectiveTopic = modal.isOpen ? modal.topic : currentTopic;
  const effectiveQuestion = modal.isOpen ? modal.question : currentQuestion;
  const effectiveQuestionId = modal.isOpen ? modal.questionId : currentQuestionId;
  const effectiveMentorTip = modal.isOpen ? modal.mentor_tip : currentMentorTip;

  // УДАЛИТЬ: состояние для экзамена перенесено в ExamModal

  const openModal = async (pointId: string) => {
    const point = points.find(p => p.id === pointId);
    if (!point) return;

    if (pointId === "exam" && point.status !== "available") return;
    if (pointId !== "exam" && point.status !== "available") return;

    try {
      if (pointId !== "exam" && pointId !== "exam2") {
        console.log("📡 Запрашиваю вопрос:", {
          phase_id: point.phaseId,
          topic_id: point.topicId,
        });
        const res = await api.get("/api/question/textQuestion", {
          params: { phase_id: point.phaseId, topic_id: point.topicId },
          withCredentials: true,
        });
        setCurrentTopic(res.data.topic_title || "Без названия");
        setCurrentQuestion(res.data.question_text);
        setCurrentQuestionId(res.data.question_id);
        setCurrentMentorTip(res.data.mentor_tip || null);
        setCurrentPointId(pointId);
        setIsModalOpen(true);
        const payload = { 
          questionId: res.data.question_id, 
          topic: res.data.topic_title || "Без названия", 
          question: res.data.question_text,
          mentor_tip: res.data.mentor_tip || null
        };
        dispatch(openModalAction(payload));
        sendOpenModal(payload);
      } else {
        // Для экзамена инициатор загружает вопросы и рассылает всем
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

  const handleAddFriend = () => {
    // TODO: Реализовать добавление в друзья
    console.log(`Добавить в друзья: ${selectedUsername}`);
  };

  const handleExamComplete = (correctAnswers: number, totalQuestions: number) => {
    dispatch(updatePointStatus({ pointId: "exam", status: "completed" }));
    sendExamComplete(correctAnswers, totalQuestions);
  };

  const handleAnswerResult = (correct: boolean, scores: any) => {
    // Если сервер ничего не прислал про очки, не трогаем текущие значения
    if (!scores) {
      return;
    }

    // Допускаем разные форматы payload
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
    
    if (correct && currentPointId) {
      dispatch(updatePointStatus({ pointId: currentPointId, status: "completed" }));
      sendAnswer(currentPointId, true);
      // Закрываем модалку локально для отвечающего игрока через 3 секунды
      setTimeout(() => {
        setIsModalOpen(false);
        dispatch(closeModalAction());
      }, 3000);
    } else if (currentPointId) {
      // При неправильном ответе меняем роль, точка остается доступной для других игроков
      console.log("Неправильный ответ, меняем роль, точка остается доступной");
      sendAnswer(currentPointId, false);
      // Закрываем модалку локально для отвечающего игрока через 3 секунды
      setTimeout(() => {
        setIsModalOpen(false);
        dispatch(closeModalAction());
      }, 3000);
    }
  };

  // Локальная обработка неправильного ответа без запроса к серверу
  const handleLocalIncorrectAnswer = () => {
    console.log("🔍 [CLIENT] handleLocalIncorrectAnswer вызван");
    console.log("🔍 [CLIENT] currentPointId:", currentPointId);
    console.log("🔍 [CLIENT] user?.id:", user?.id);
    console.log("🔍 [CLIENT] activePlayerId:", activePlayerId);
    
    if (!currentPointId) {
      console.log("❌ [CLIENT] currentPointId не установлен, не можем отправить неправильный ответ");
      return;
    }
    
    console.log("❌ [CLIENT] Локальная обработка неправильного ответа (пустой ответ или закрытие модалки)");
    console.log("❌ [CLIENT] Отправляем sendAnswer с pointId:", currentPointId, "correct: false");
    
    // Сохраняем pointId перед отправкой
    const pointIdToSend = currentPointId;
    
    // Отправляем неправильный ответ на сервер - он сам обновит счетчики и передаст ход
    sendAnswer(pointIdToSend, false);
    
    // Отправляем событие закрытия модалки всем игрокам
    console.log("🔒 [CLIENT] Отправляем событие закрытия модалки всем игрокам");
    sendCloseModal();
    
    // Закрываем модалку локально
    setTimeout(() => {
      console.log("❌ [CLIENT] Закрываем модалку локально");
      setIsModalOpen(false);
      dispatch(closeModalAction());
      setCurrentPointId(null);
    }, 1000);
  };

  // Обработка timeout - отправка события всем игрокам
  const handleTimeout = (pointId: string) => {
    console.log("⏰ Отправляем timeout событие для точки:", pointId);
    sendTimeout(pointId);
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
           isOpen={effectiveIsOpen}
           onClose={() => { setIsModalOpen(false); dispatch(closeModalAction()); }}
           topic={effectiveTopic}
           question={effectiveQuestion}
           questionId={effectiveQuestionId}
           pointId={currentPointId || undefined}
           lobbyId={lobbyId}
           onAnswerResult={handleAnswerResult}
           onLocalIncorrectAnswer={handleLocalIncorrectAnswer}
           onTimeout={handleTimeout}
           currentUserId={user?.id ?? 0}
           activePlayerId={activePlayerId}
           activePlayerName={
             usersInLobby.find(u => u.id === activePlayerId)?.username ?? ''
           }
           mentor_tip={effectiveMentorTip}
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
          onAdvance={(correct: boolean) => {
            // Сообщаем серверу, был ли ответ правильным, чтобы он продвинул индекс
            (sendExamAnswerProgress as any)?.(correct);
          }}
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

      {/* Модальное окно действий пользователя */}
      <UserActionsModal
        isOpen={isUserActionsModalOpen}
        onClose={() => setIsUserActionsModalOpen(false)}
        username={selectedUsername}
        onGoToProfile={handleGoToProfile}
        onAddFriend={handleAddFriend}
      />

    </div>
  );
}