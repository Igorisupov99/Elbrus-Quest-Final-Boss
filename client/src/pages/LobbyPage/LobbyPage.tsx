import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./LobbyPage.module.css";
import { Button } from "../../components/common/Button/Button";
import { Point, type POIStatus } from "../../components/map/Point/Point";
import { QuestionModal } from "../../components/common/modals/QuestionModal/QuestionModal";
import api from "../../api/axios";
import { useLobbySocket } from "../../hooks/useLobbySocket";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { updatePointStatus, setScores } from "../../store/lobbyPage/lobbySlice";

interface ExamQuestion {
  id: number;
  question_text: string;
  topic_title: string;
}

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
    sendExamComplete,
  } = useLobbySocket(lobbyId);

  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);

  // модалка
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTopic, setCurrentTopic] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentQuestionId, setCurrentQuestionId] = useState<number | null>(null);
  const [currentPointId, setCurrentPointId] = useState<string | null>(null);

  // состояние для экзамена
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([]);
  const [currentExamQuestionIndex, setCurrentExamQuestionIndex] = useState(0);
  // УДАЛИТЬ: const [incorrectAnswersCount, setIncorrectAnswersCount] = useState(0);

  const openModal = async (pointId: string) => {
    const point = points.find(p => p.id === pointId);
    if (!point) return;

    if (pointId === "exam" && point.status !== "available") return;
    if (pointId !== "exam" && point.status !== "available") return;

    try {
      if (pointId !== "exam") {
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
      const res = await api.get("/api/exam/examQuestion", {
        params: { phase_id: 1, count: 2 + incorrectAnswers }, // Используем из Redux
        withCredentials: true,
      });
      if (!res.data.questions || res.data.questions.length === 0) return;
      setExamQuestions(res.data.questions);
      setCurrentExamQuestionIndex(0);
      const question = res.data.questions[0];
      setCurrentTopic(question.topic_title || "Экзамен");
      setCurrentQuestion(question.question_text);
      setCurrentQuestionId(question.id);
      setCurrentPointId("exam");
      setIsModalOpen(true);
    } catch (err) {
      console.error("Ошибка при загрузке вопросов для экзамена:", err);
    }
  };

  const updatePoint = (pointId: string, status: POIStatus) => {
    dispatch(updatePointStatus({ pointId, status }));
  };

  useEffect(() => {
    const allRegular = points.filter(p => p.id !== "exam");
    const exam = points.find(p => p.id === "exam");
    const shouldUnlock = allRegular.every(p => p.status === "completed") && exam?.status !== "available";
    const shouldLock = !allRegular.every(p => p.status === "completed") && exam?.status !== "locked";
    if (shouldUnlock) updatePoint("exam", "available");
    if (shouldLock) updatePoint("exam", "locked");
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

  const handleExamAnswer = (correct: boolean) => {
    if (currentPointId !== "exam") return;
    if (currentExamQuestionIndex + 1 < examQuestions.length) {
      setCurrentExamQuestionIndex(prev => prev + 1);
      const next = examQuestions[currentExamQuestionIndex + 1];
      setCurrentTopic(next.topic_title);
      setCurrentQuestion(next.question_text);
      setCurrentQuestionId(next.id);
    } else {
      setIsModalOpen(false);
      dispatch(updatePointStatus({ pointId: "exam", status: "completed" }));
      const correctAnswers = examQuestions.filter((_, i) => i <= currentExamQuestionIndex).length - (correct ? 0 : 1);
      const totalQuestions = examQuestions.length;
      sendExamComplete(correctAnswers, totalQuestions);
    }
  };

  const handleAnswerResult = (correct: boolean, scores: any) => {
    if (scores?.scores) {
      const { userScore, sessionScore, incorrectAnswers: wrong } = scores.scores;
      dispatch(setScores({
        userScore: userScore ?? 0,
        sessionScore: sessionScore ?? 0,
        incorrectAnswers: wrong ?? incorrectAnswers
      }));
    }

    if (currentPointId === "exam") {
      handleExamAnswer(correct);
    } else if (correct && currentPointId) {
      dispatch(updatePointStatus({ pointId: currentPointId, status: "completed" }));
      sendAnswer(currentPointId, true);
    } else {
      console.log("Неправильный ответ, точка остается доступной");
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

      <QuestionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        topic={currentTopic}
        question={currentQuestion}
        questionId={currentQuestionId}
        lobbyId={lobbyId}
        onAnswerResult={handleAnswerResult}
        currentUserId={user?.id ?? 0}
        activePlayerId={activePlayerId}
        activePlayerName={
          usersInLobby.find(u => u.id === activePlayerId)?.username ?? ''
        }
      />
    </div>
  );
}