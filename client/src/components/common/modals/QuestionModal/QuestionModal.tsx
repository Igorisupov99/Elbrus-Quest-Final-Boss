import { useState, useEffect, useRef } from "react";
import { Button } from "../../Button/Button";
import { ConfirmCloseModal } from "../ConfirmCloseModal/ConfirmCloseModal";
import styles from "./QuestionModal.module.css";
import api from "../../../../api/axios";

interface QuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic: string;
  question: string;
  questionId: number | null;
  lobbyId?: number;
  currentUserId: number;          // 👈 id текущего игрока
  activePlayerId: number | null;  // 👈 id активного игрока
  activePlayerName: string;       // 👈 имя активного игрока
  mentor_tip?: string | null;     // 👈 подсказка от ментора
  onAnswerResult?: (
    correct: boolean,
    scores?: { userScore?: number; sessionScore?: number; incorrectAnswers?: number }
  ) => void;
  onCloseModal?: () => void;
  onTimeoutClose?: () => void;
  sharedResult?: string | null;
}

export function QuestionModal({
  isOpen,
  onClose,
  topic,
  question,
  questionId,
  lobbyId,
  currentUserId,
  activePlayerId,
  activePlayerName,
  mentor_tip,
  onAnswerResult,
  onCloseModal,
  onTimeoutClose,
  sharedResult,
}: QuestionModalProps) {
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const closeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setAnswer('');
    setResult(null);
    setTimeLeft(30);
    setTimerActive(false);
    setShowHint(false);
    setShowConfirmClose(false);
    setAnswerSubmitted(false);
    
    // Очищаем таймер при смене вопроса
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, [questionId]);

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  // Таймер для всех игроков - синхронизированный
  useEffect(() => {
    if (!isOpen || !timerActive) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setTimerActive(false);
          // При истечении времени закрываем модалку у всех игроков
          onTimeoutClose?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, timerActive]);

  // Запускаем таймер когда модальное окно открывается
  useEffect(() => {
    if (isOpen && !loading) {
      setTimerActive(true);
    } else {
      setTimerActive(false);
    }
  }, [isOpen, loading]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!questionId || answerSubmitted) return;

    try {
      setLoading(true);
      setResult(null);
      setAnswerSubmitted(true);

      const res = await api.post(
        "/api/question/answerCheck",
        { question_id: questionId, answer, lobby_id: lobbyId },
        { withCredentials: true }
      );

      if (res.data.correct) {
        // При правильном ответе передаем очки с сервера, но НЕ останавливаем таймер сразу
        // Таймер остановится после показа уведомления в LobbyPage
        setResult(null);
        const s = res.data?.scores ?? {};
        onAnswerResult?.(true, {
          userScore: s.userScore ?? s.user_score ?? s.total ?? s.value,
          sessionScore: s.sessionScore ?? s.session_score ?? s.session ?? s.value,
          incorrectAnswers: s.incorrectAnswers ?? s.incorrect_answers,
        });
      } else {
        // При неправильном ответе НЕ останавливаем таймер - модалка должна остаться открытой до истечения времени
        // Таймер продолжает работать, модалка закроется автоматически по истечении времени
        // Разрешаем повторную отправку ответа (уведомление показывается через sharedResult)
        setAnswerSubmitted(false);
        onAnswerResult?.(false, undefined);
      }
      
    } catch (err) {
      console.error("Ошибка при отправке ответа:", err);
      setResult("⚠ Ошибка при проверке ответа");
      setAnswerSubmitted(false); // Разрешаем повторную отправку при ошибке
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Если закрывает активный игрок - показываем подтверждение
    if (Number(currentUserId) === Number(activePlayerId)) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setShowConfirmClose(false);
    onCloseModal?.();
  };

  const handleCancelClose = () => {
    setShowConfirmClose(false);
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

            {/* Кнопка подсказки и отображение подсказки */}
            {mentor_tip && (
              <div className={styles.hintSection}>
                {!showHint ? (
                  <Button 
                    onClick={() => setShowHint(true)}
                    className={styles.hintButton}
                  >
                    💡 Подсказка
                  </Button>
                ) : (
                  <div className={styles.hintContent}>
                    <div className={styles.hintHeader}>
                      <span className={styles.hintIcon}>💡</span>
                      <span className={styles.hintTitle}>Подсказка от ментора:</span>
                    </div>
                    <p className={styles.hintText}>{mentor_tip}</p>
                    <Button 
                      onClick={() => setShowHint(false)}
                      className={styles.hideHintButton}
                    >
                      Скрыть подсказку
                    </Button>
                  </div>
                )}
              </div>
            )}

            {timerActive && (
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
                  <Button onClick={handleClose}>Закрыть</Button>
                  <Button onClick={handleSubmit} disabled={loading || answerSubmitted}>
                    {answerSubmitted ? 'Ответ отправлен' : 'Отправить'}
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

      {/* Модальное окно подтверждения закрытия */}
      <ConfirmCloseModal
        isOpen={showConfirmClose}
        onConfirm={handleConfirmClose}
        onCancel={handleCancelClose}
      />
    </div>
  );
}
