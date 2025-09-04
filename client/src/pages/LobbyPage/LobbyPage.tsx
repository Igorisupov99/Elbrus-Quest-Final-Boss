import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./LobbyPage.module.css";
import { Button } from "../../components/common/Button/Button";
import {
  socketClient,
  type ChatHistoryItem,
  type IncomingChatMessage,
  type SystemEvent,
} from "../../socket/socketLobbyPage";
import { Point } from "../../components/map/Point/Point";
import { QuestionModal } from "../../components/common/modals/QuestionModal/QuestionModal";

export function LobbyPage() {
  const { id } = useParams<{ id: string }>();
  const lobbyId = useMemo(() => Number(id), [id]);
  const navigate = useNavigate();

  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);

  // модалка
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTopic, setCurrentTopic] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentQuestionId, setCurrentQuestionId] = useState<number | null>(null);

  const openModal = async (phaseId: number, topicId: number) => {
    try {
      console.log("Запрос вопроса:", { phaseId, topicId });

      const res = await axios.get("http://localhost:3000/api/question/textQuestion", {
        params: { phase_id: phaseId, topic_id: topicId },
        withCredentials: true,
      });

      console.log("Ответ сервера:", res.data);

      setCurrentTopic(res.data.topic_title || "Без названия");
      setCurrentQuestion(res.data.question_text || "Вопрос отсутствует");
      setCurrentQuestionId(res.data.question_id || null);

      setIsModalOpen(true);
    } catch (err: any) {
      console.error("Ошибка при получении вопроса:", err);

      setCurrentTopic("Ошибка");
      setCurrentQuestion(
        err.response?.data?.error || "Не удалось загрузить вопрос"
      );
      setCurrentQuestionId(null);
      setIsModalOpen(true);
    }
  };

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

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.on("connect_error", onConnectError);
    s.on("chat:history", onHistory);
    s.on("chat:message", onChatMessage);
    s.on("system", onSystem);
    s.on("error", onError);

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("connect_error", onConnectError);
      s.off("chat:history", onHistory);
      s.off("chat:message", onChatMessage);
      s.off("system", onSystem);
      s.off("error", onError);
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

  return (
    <div className={styles.lobbyPage}>
      <div className={styles.gameArea}>
        <img src="/map.png" alt="Игровая карта" className={styles.gameMap} />

        {/* Примеры с разными фазами и топиками */}
        <Point
          id="1"
          title="Тема 1"
          top={81}
          left={32.3}
          status="available"
          onClick={() => openModal(1, 1)} // phaseId=1, topicId=1
        />

        <Point
          id="2"
          title="Тема 2"
          top={70.5}
          left={32}
          status="available"
          onClick={() => openModal(1, 2)}
        />

        <Point
          id="3"
          title="Тема 3"
          top={65}
          left={26.5}
          status="available"
          onClick={() => openModal(1, 3)}
        />

        <Point
          id="4"
          title="Тема 4"
          top={55}
          left={36}
          status="available"
          onClick={() => openModal(1, 4)}
        />
      </div>

      <div className={styles.sidebar}>
        <Button className={styles.exitButton} onClick={handleExitLobby}>
          Выйти из комнаты
        </Button>

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
        onClose={() => setIsModalOpen(false)}
        topic={currentTopic}
        question={currentQuestion}
        questionId={currentQuestionId}
      />
    </div>
  );
}
