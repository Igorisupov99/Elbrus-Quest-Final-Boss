import { useState, useEffect } from "react";
import { Button } from "../../Button/Button";
import styles from "./QuestionModal.module.css";
import api from "../../../../api/axios";

interface QuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic: string;
  question: string;
  questionId: number | null;
  pointId?: string;
  lobbyId?: number;
  currentUserId: number;          // 👈 id текущего игрока
  activePlayerId: number | null;  // 👈 id активного игрока
  activePlayerName: string;       // 👈 имя активного игрока
  onAnswerResult?: (
    correct: boolean,
    scores?: { userScore?: number; sessionScore?: number; incorrectAnswers?: number }
  ) => void;
  onLocalIncorrectAnswer?: () => void;
  onTimeout?: (pointId: string) => void;
  sharedResult?: string | null;
}

export function QuestionModal({
  isOpen,
  onClose,
  topic,
  question,
  questionId,
  pointId,
  lobbyId,
  currentUserId,
  activePlayerId,
  activePlayerName,
  onAnswerResult,
  onLocalIncorrectAnswer,
  onTimeout,
  sharedResult,
}: QuestionModalProps) {
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    setAnswer('');
    setResult(null);
    setTimeLeft(30);
    setTimerActive(false);
  }, [questionId]);

  // Таймер для активного игрока
  useEffect(() => {
    if (!isOpen || !timerActive || Number(currentUserId) !== Number(activePlayerId)) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setTimerActive(false);
          // Автоматически отправляем ответ при истечении времени
          console.log("⏰ Время истекло, автоматически отправляем ответ:", answer.trim() || "пустой");
          if (answer.trim()) {
            handleSubmit();
          } else {
            // Если ответ пустой, отправляем событие timeout всем игрокам
            console.log("⏰ Пустой ответ при истечении времени - отправляем timeout");
            if (pointId) {
              onTimeout?.(pointId);
              // Закрываем модальное окно локально
              console.log("⏰ Закрываем QuestionModal через 100ms");
              setTimeout(() => {
                onClose();
              }, 100);
            } else {
              onLocalIncorrectAnswer?.();
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, timerActive, currentUserId, activePlayerId, answer]);

  // Запускаем таймер когда модальное окно открывается для активного игрока
  useEffect(() => {
    if (isOpen && Number(currentUserId) === Number(activePlayerId) && !loading) {
      setTimerActive(true);
    } else {
      setTimerActive(false);
    }
  }, [isOpen, currentUserId, activePlayerId, loading]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!questionId) return;

    setTimerActive(false); // Останавливаем таймер при отправке ответа

    try {
      setLoading(true);
      setResult(null);

      const res = await api.post(
        "/api/question/answerCheck",
        { question_id: questionId, answer, lobby_id: lobbyId },
        { withCredentials: true }
      );

      if (res.data.correct) {
        // Локально не показываем текст, он придёт по сокету как общее сообщение
        setResult(null);
        const s = res.data?.scores ?? {};
        onAnswerResult?.(true, {
          userScore: s.userScore ?? s.user_score ?? s.total ?? s.value,
          sessionScore: s.sessionScore ?? s.session_score ?? s.session ?? s.value,
          incorrectAnswers: s.incorrectAnswers ?? s.incorrect_answers,
        });
      } else {
        // Не показываем локальное сообщение при неправильном ответе.
        // Глобальное уведомление приходит через sharedResult и скрывается через 3 сек.
        onAnswerResult?.(false);
      }
      
    } catch (err) {
      console.error("Ошибка при отправке ответа:", err);
      setResult("⚠ Ошибка при проверке ответа");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAnswer('');
    setResult(null);
    setTimerActive(false);
    setTimeLeft(30);
    
    // Если закрывает активный игрок до истечения времени - это неправильный ответ
    if (Number(currentUserId) === Number(activePlayerId) && timerActive) {
      console.log("❌ Активный игрок закрыл модалку до истечения времени - локальная обработка");
      onLocalIncorrectAnswer?.();
    } else {
      onClose();
    }
  };

  const isCorrectMessage = Boolean(sharedResult && sharedResult.includes('Правильный ответ'));

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        {(sharedResult || result) && (
          <p className={styles.result}>{sharedResult ?? result}</p>
        )}

        {!isCorrectMessage && (
          <>
            <h2 className={styles.title}>{topic}</h2>
            <p className={styles.question}>{question}</p>

            {Number(currentUserId) === Number(activePlayerId) && timerActive && (
              <div className={`${styles.timer} ${
                timeLeft <= 10 ? styles.timerDanger : 
                timeLeft <= 15 ? styles.timerWarning : ''
              }`}>
                <p className={styles.timerText}>
                  ⏰ Осталось: {timeLeft} сек
                </p>
                <div className={styles.timerBar}>
                  <div 
                    className={`${styles.timerBarFill} ${
                      timeLeft <= 10 ? styles.timerBarDanger : 
                      timeLeft <= 15 ? styles.timerBarWarning : ''
                    }`}
                    style={{ width: `${(timeLeft / 30) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {Number(currentUserId) === Number(activePlayerId) ? (
              <>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Ваш ответ... (пустой ответ = неправильный)"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  disabled={loading}
                />

                <div className={styles.actions}>
                  <Button onClick={onClose}>Закрыть</Button>
                  <Button onClick={handleSubmit} disabled={loading}>
                    Отправить
                  </Button>
                </div>
              </>
            ) : (
              <div className={styles.waitingBlock}>
                <p className={styles.waiting}>
                  Сейчас отвечает <strong>{activePlayerName}</strong>
                </p>
                <div className={styles.actions}>
                  <Button onClick={handleClose}>Закрыть</Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
