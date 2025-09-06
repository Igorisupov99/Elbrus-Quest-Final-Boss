import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./LobbyPage.module.css";
import { Button } from "../../components/common/Button/Button";
import {
  socketClient,
  type ChatHistoryItem,
  type IncomingChatMessage,
  type SystemEvent,
} from "../../socket/socketLobbyPage";
import { Point, type POIStatus } from "../../components/map/Point/Point";
import { QuestionModal } from "../../components/common/modals/QuestionModal/QuestionModal";
import api from "../../api/axios";

interface PointData {
  id: string;
  title: string;
  top: number;
  left: number;
  status: POIStatus;
  phaseId: number;
  topicId: number;
}

interface ExamQuestion {
  id: number;
  question_text: string;
  topic_title: string;
}

export function LobbyPage() {
  const { id } = useParams<{ id: string }>();
  const lobbyId = useMemo(() => Number(id), [id]);
  const navigate = useNavigate();

  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [input, setInput] = useState("");
  const [activePlayerId, setActivePlayerId] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Состояние для списка пользователей в комнате
  const [usersInLobby, setUsersInLobby] = useState<{ id: number; username: string }[]>([]);

  // модалка
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTopic, setCurrentTopic] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentQuestionId, setCurrentQuestionId] = useState<number | null>(null);
  const [currentPointId, setCurrentPointId] = useState<string | null>(null);

  // очки
  const [userScore, setUserScore] = useState<number>(0);
  const [sessionScore, setSessionScore] = useState<number>(0);

  // состояние точек
  const [points, setPoints] = useState<PointData[]>([
    {
      id: "1",
      title: "Тема 1",
      top: 81,
      left: 32.3,
      status: "available",
      phaseId: 1,
      topicId: 1
    },
    {
      id: "2",
      title: "Тема 2",
      top: 70.5,
      left: 32,
      status: "available",
      phaseId: 1,
      topicId: 2
    },
    {
      id: "3",
      title: "Тема 3",
      top: 65,
      left: 26.5,
      status: "available",
      phaseId: 1,
      topicId: 3
    },
    {
      id: "4",
      title: "Тема 4",
      top: 55,
      left: 36,
      status: "available",
      phaseId: 1,
      topicId: 4
    },
    {
      id: "exam",
      title: "Экзамен",
      top: 90,
      left: 24,
      status: "locked",
      phaseId: 1,
      topicId: 0
    }
  ]);

  // состояние для экзамена
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([]);
  const [currentExamQuestionIndex, setCurrentExamQuestionIndex] = useState(0);
  const [incorrectAnswersCount, setIncorrectAnswersCount] = useState(0);

  const openModal = async (pointId: string) => {
    const point = points.find(p => p.id === pointId);
    if (!point) return;

    // Для экзамена проверяем, что он доступен
    if (pointId === "exam" && point.status !== "available") return;

    // Для обычных точек проверяем доступность
    if (pointId !== "exam" && point.status !== "available") return;

    try {
      // Для обычных точек
      if (pointId !== "exam") {
        const res = await api.get("/api/question/textQuestion", {
          params: { phase_id: point.phaseId, topic_id: point.topicId },
          withCredentials: true,
        });

        setCurrentTopic(res.data.topic_title || "Без названия");
        setCurrentQuestion(res.data.question_text);
        setCurrentQuestionId(res.data.question_id);
        setCurrentPointId(pointId);
        setIsModalOpen(true);
      } else {

        await loadExamQuestions();
      }
    } catch (err) {
      console.error("Ошибка при получении вопроса:", err);
    }
  };

  const loadExamQuestions = async () => {
    try {
      // Получаем случайные вопросы из фазы 0
      const res = await api.get("/api/question/examQuestions", {
        params: { 
          phase_id: 0,
          count: 2 + incorrectAnswersCount  // Базовые 2 + за неправильные ответы
        },
        withCredentials: true,
      });

      if (res.data.questions && res.data.questions.length > 0) {
        setExamQuestions(res.data.questions);
        setCurrentExamQuestionIndex(0);
        
        // Показываем первый вопрос экзамена
        const question = res.data.questions[0];
        setCurrentTopic(question.topic_title || "Экзамен");
        setCurrentQuestion(question.question_text);
        setCurrentQuestionId(question.id);
        setCurrentPointId("exam");
        setIsModalOpen(true);
      }
    } catch (err) {
      console.error("Ошибка при загрузке вопросов для экзамена:", err);
    }
  };

  const updatePointStatus = (pointId: string, status: POIStatus) => {
    setPoints(prev => prev.map(point =>
      point.id === pointId ? { ...point, status } : point
    ));
  };

  useEffect(() => {
    const allRegularPointsCompleted = points
      .filter(point => point.id !== "exam")
      .every(point => point.status === "completed");
    
    
    const examPoint = points.find(point => point.id === "exam");
    const shouldBeAvailable = allRegularPointsCompleted && examPoint?.status !== "available";
    const shouldBeLocked = !allRegularPointsCompleted && examPoint?.status !== "locked";
    
    if (shouldBeAvailable) {
      updatePointStatus("exam", "available");
      console.log("Экзамен разблокирован! Все обычные точки пройдены.");
    } else if (shouldBeLocked) {
      updatePointStatus("exam", "locked");
    }
  }, [points]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [history]);

  useEffect(() => {
    if (!lobbyId || Number.isNaN(lobbyId)) {
      navigate("/");
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/login");
      return;
    }

    socketClient.connectWithToken(token, lobbyId);
    const s = socketClient.socket;

    const onConnect = () => {
      setConnected(true);
      setConnecting(false);
    };
    const onDisconnect = () => {
      setConnected(false);
      setConnecting(false);
    };
    const onConnectError = (err: any) => {
      console.error("connect_error:", err);
      setConnected(false);
      setConnecting(false);
    };

    const onHistory = (items: ChatHistoryItem[]) => setHistory(items);
    const onChatMessage = (msg: IncomingChatMessage) =>
      setHistory((prev) => [...prev, msg]);
    const onSystem = (evt: SystemEvent) => {
      const text =
        evt.type === "join"
          ? `${evt.username} вошёл в лобби`
          : `${evt.username} покинул лобби`;
      setHistory((prev) => [
        ...prev,
        {
          id: Date.now(),
          text,
          user: { id: 0, username: "system" },
          createdAt: new Date().toISOString(),
        },
      ]);
    };
    const onError = (payload: any) => console.error("chat error:", payload);

    // Обработчик списка пользователей в комнате
    const onUsersList = (data: { 
      users: { id: number; username: string }[]; 
      activePlayerId?: number 
    }) => {
      setUsersInLobby(data.users);
      if (data.activePlayerId !== undefined) {
        setActivePlayerId(data.activePlayerId);
      }
    };

    const onUpdatePointStatus = ({ pointId, status }: { pointId: string; status: POIStatus }) => {
      updatePointStatus(pointId, status);
    };

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.on("connect_error", onConnectError);
    s.on("chat:history", onHistory);
    s.on("chat:message", onChatMessage);
    s.on("system", onSystem);
    s.on("error", onError);
    s.on("lobby:users", onUsersList);
    s.on("lobby:updatePointStatus", onUpdatePointStatus);
    s.on("lobby:initPoints", (points: PointData[]) => {
      setPoints(prev => prev.map(p => {
        const serverPoint = points.find(sp => sp.id === p.id);
        return serverPoint ? {...p, status: serverPoint.status } : p;
      }));
    });

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("connect_error", onConnectError);
      s.off("chat:history", onHistory);
      s.off("chat:message", onChatMessage);
      s.off("system", onSystem);
      s.off("error", onError);
      s.off("lobby:users", onUsersList);
      s.off("lobby:updatePointStatus", onUpdatePointStatus);
      socketClient.disconnect();
    };
  }, [lobbyId, navigate]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text || !connected) return;
    socketClient.socket.emit("chat:message", { text });
    setInput("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  const handleExitLobby = () => {
    if (connected) {
      socketClient.socket.emit("leaveLobby");
      socketClient.disconnect();
    }
    navigate("/");
  };

  const handleExamAnswer = (correct: boolean) => {
    if (currentPointId === "exam") {
      // Обработка ответа на экзаменационный вопрос
      if (currentExamQuestionIndex + 1 < examQuestions.length) {
        // Переходим к следующему вопросу
        setCurrentExamQuestionIndex(prev => prev + 1);
        const nextQuestion = examQuestions[currentExamQuestionIndex + 1];
        setCurrentTopic(nextQuestion.topic_title);
        setCurrentQuestion(nextQuestion.question_text);
        setCurrentQuestionId(nextQuestion.id);
      } else {
        // Экзамен завершен
        setIsModalOpen(false);
        // Обновляем статус экзаменационной точки
        updatePointStatus("exam", "completed");
        
        // Отправляем результаты на сервер
        socketClient.socket.emit("lobby:examComplete", {
          lobbyId,
          correctAnswers: examQuestions.filter((_, index) => index <= currentExamQuestionIndex).length - (correct ? 0 : 1),
          totalQuestions: examQuestions.length
        });
      }
    }
  };

  const handleAnswerResult = (correct: boolean, scores: any) => {
    if (scores) {
      setUserScore(scores.userScore || 0);
      setSessionScore(scores.sessionScore || 0);
    }

    // Увеличиваем счетчик неправильных ответов (только для обычных вопросов)
    if (!correct && currentPointId !== "exam") {
      setIncorrectAnswersCount(prev => prev + 1);
    }

    if (currentPointId === "exam") {
      // Обработка ответа на экзаменационный вопрос
      handleExamAnswer(correct);
    } else {
      
      if (correct && currentPointId) {
        updatePointStatus(currentPointId, "completed");
        
        
        socketClient.socket.emit("lobby:answer", {
          lobbyId,
          pointId: currentPointId,
          correct: true,
        });
      } else if (!correct) {
        console.log("Неправильный ответ, точка остается доступной");
      }
    }
  };

  return (
    <div className={styles.lobbyPage}>
      <div className={styles.gameArea}>
        <img src="/map.png" alt="Игровая карта" className={styles.gameMap} />

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
      </div>

      <div className={styles.sidebar}>
        <Button className={styles.exitButton} onClick={handleExitLobby}>
          Выйти из комнаты
        </Button>

        {/* Список пользователей в комнате */}
        <div className={styles.usersList}>
          <h3>Пользователи в комнате</h3>
          <ul>
            {usersInLobby.map((user) => (
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

        {/* очки */}
        <div className={styles.scores}>
          <h3>Ваши очки</h3>
          <p>Общий счёт: {userScore}</p>
          <p>В этой игре: {sessionScore}</p>
          <p>Неправильных ответов: {incorrectAnswersCount}</p>
        </div>

        {/* чат */}
        <div className={styles.chat}>
          <h3 className={styles.chatTitle}>
            Чат комнаты{" "}
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
            {history.map((m) => (
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
                  ? "Подключение…"
                  : connected
                  ? "Напишите сообщение…"
                  : "Отключено"
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!connected}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
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

      {/* модалка */}
      <QuestionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
        }}
        topic={currentTopic}
        question={currentQuestion}
        questionId={currentQuestionId}
        lobbyId={lobbyId}
        currentUserId={socketClient.userId ?? -1} // 👈 безопасная замена
        activePlayerId={activePlayerId}
        activePlayerName={
          usersInLobby.find((u) => u.id === activePlayerId)?.username || "неизвестный"
        }
        onAnswerResult={(correct, scores) => {
          if (scores) {
            setUserScore(scores.userScore || 0);
            setSessionScore(scores.sessionScore || 0);
          }

          if (currentPointId) {
            socketClient.socket.emit("lobby:answer", {
              lobbyId,
              pointId: currentPointId,
              correct,
            });
          }
        }}
      />
    </div>
  );
}