import { useState, useEffect, useRef } from "react";
import { Button } from "../../Button/Button";
import { FavoriteButton } from "../../FavoriteButton";
import { ConfirmCloseModal } from "../ConfirmCloseModal/ConfirmCloseModal";
import styles from "./QuestionModal.module.css";
import api from "../../../../api/axios";
import { socketClient } from "../../../../socket/socketLobbyPage";

const AI_QUESTION_COST = 100; // Стоимость запроса к AI

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
  userScore?: number;             // 👈 очки пользователя
  onAnswerResult?: (
    correct: boolean,
    scores?: { userScore?: number; sessionScore?: number; incorrectAnswers?: number },
    answer?: string
  ) => void;
  onCloseModal?: () => void;
  onTimeoutClose?: () => void;
  sharedResult?: string | null;
  onAnswerSync?: (answer: string, activePlayerName: string) => void;
  syncedAnswer?: string;          // 👈 синхронизированный ввод от активного игрока
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
  userScore = 0,
  onAnswerResult,
  onCloseModal,
  onTimeoutClose,
  sharedResult,
  onAnswerSync,
  syncedAnswer,
}: QuestionModalProps) {
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const closeTimeoutRef = useRef<number | null>(null);
  const timerResetTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setAnswer('');
    setResult(null);
    setTimeLeft(30);
    setTimerActive(false);
    setShowHint(false);
    setShowConfirmClose(false);
    setAnswerSubmitted(false);
    setAiResponse(null);
    setAiLoading(false);
    
    // Очищаем таймеры при смене вопроса
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    if (timerResetTimeoutRef.current) {
      clearTimeout(timerResetTimeoutRef.current);
      timerResetTimeoutRef.current = null;
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

  // Слушаем события синхронизации таймера
  useEffect(() => {
    const handleTimerReset = (event: CustomEvent) => {
      const { timeLeft } = event.detail;
      console.log('⏰ [QUESTION] Получено событие синхронизации таймера:', timeLeft);
      
      // Применяем синхронизацию только если модальное окно открыто
      // Добавляем небольшую задержку, чтобы дать время основной логике инициализации
      if (isOpen) {
        setTimeout(() => {
          console.log('⏰ [QUESTION] Применяем синхронизацию таймера:', timeLeft);
          setTimeLeft(timeLeft);
          setTimerActive(true);
        }, 100); // 100мс задержка
      }
    };

    window.addEventListener('question:timerReset', handleTimerReset as EventListener);
    
    return () => {
      window.removeEventListener('question:timerReset', handleTimerReset as EventListener);
    };
  }, [isOpen]);

  // Синхронизация ответа активного игрока
  useEffect(() => {
    if (onAnswerSync) {
      // Здесь можно добавить слушатель события, если нужно
      // Пока просто используем пропс для синхронизации
    }
  }, [onAnswerSync]);

  // Синхронизация ввода от активного игрока
  useEffect(() => {
    if (syncedAnswer !== undefined && Number(currentUserId) !== Number(activePlayerId)) {
      // Обновляем ввод только для неактивных игроков
      setAnswer(syncedAnswer);
    }
  }, [syncedAnswer, currentUserId, activePlayerId]);

  // Слушаем глобальные события AI ответов
  useEffect(() => {
    const handleGlobalAIResponse = (event: CustomEvent) => {
      const payload = event.detail;
      console.log('🤖 [QuestionModal] Получен глобальный AI ответ:', payload);
      
      // Показываем ответ только если это для текущего вопроса
      if (payload.questionId === questionId) {
        setAiResponse(payload.message);
        setAiLoading(false);
      }
    };

    window.addEventListener('ai:response', handleGlobalAIResponse as EventListener);
    
    return () => {
      window.removeEventListener('ai:response', handleGlobalAIResponse as EventListener);
    };
  }, [questionId]);

  if (!isOpen) return null;

  const handleAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAnswer = e.target.value;
    setAnswer(newAnswer);
    
    // Отправляем изменения инпута через сокет, если это активный игрок
    if (Number(currentUserId) === Number(activePlayerId) && onAnswerSync) {
      onAnswerSync(newAnswer, activePlayerName);
    }
  };

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
        }, answer);
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

  const handleAskAI = async () => {
    if (!lobbyId || !question) return;
    
    console.log(`🤖 [AI] Запрос к AI от пользователя с очками: ${userScore}`);
    
    setAiLoading(true);
    setAiResponse(null);
    
    try {
      // Отправляем вопрос AI через socket
      socketClient.socket.emit('ai:question', {
        message: `Вопрос: ${question}\nТема: ${topic}`,
        context: 'Программирование и IT',
        questionId: questionId,
        lobbyId: lobbyId,
        cost: AI_QUESTION_COST
      });
      
      // Таймаут на случай если AI не ответит
      setTimeout(() => {
        if (aiLoading) {
          setAiResponse('AI-ментор временно недоступен');
          setAiLoading(false);
        }
      }, 10000);
      
    } catch (error) {
      console.error('Ошибка при отправке вопроса AI:', error);
      setAiResponse('Ошибка при обращении к AI-ментору');
      setAiLoading(false);
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

            {/* Секция помощи */}
            <div className={styles.helpSection}>
              <div className={styles.helpButtons}>
                {mentor_tip && (
                  <Button 
                    onClick={() => setShowHint(!showHint)}
                    className={`${styles.helpButton} ${styles.hintButton}`}
                  >
                    💡 Подсказка
                  </Button>
                )}
                <Button 
                  onClick={handleAskAI}
                  disabled={aiLoading}
                  className={`${styles.helpButton} ${styles.aiButton}`}
                >
                  {aiLoading ? '🤖 AI думает...' : `🤖 Спросить у AI (${AI_QUESTION_COST} очков)`}
                </Button>
              </div>
              
              <div className={styles.userInfo}>
                У вас: {userScore} очков
              </div>

              {/* Отображение подсказки */}
              {showHint && mentor_tip && (
                <div className={styles.helpContent}>
                  <div className={styles.helpContentHeader}>
                    <span className={styles.helpIcon}>💡</span>
                    <span className={styles.helpTitle}>Подсказка от ментора</span>
                  </div>
                  <div className={styles.helpText}>{mentor_tip}</div>
                </div>
              )}

              {/* Отображение ответа AI */}
              {aiResponse && (
                <div className={styles.helpContent}>
                  <div className={styles.helpContentHeader}>
                    <span className={styles.helpIcon}>🤖</span>
                    <span className={styles.helpTitle}>AI-Ментор</span>
                  </div>
                  <div className={styles.helpText}>{aiResponse}</div>
                </div>
              )}
            </div>

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

            <div className={styles.questionSection}>
              <div className={styles.questionLabel}>Вопрос:</div>
              <p className={styles.question}>{question}</p>
            </div>

            <input
              type="text"
              className={styles.input}
              placeholder={
                Number(currentUserId) === Number(activePlayerId)
                  ? "Ваш ответ..."
                  : `Отвечает ${activePlayerName}...`
              }
              value={answer}
              onChange={handleAnswerChange}
              disabled={loading || Number(currentUserId) !== Number(activePlayerId)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && Number(currentUserId) === Number(activePlayerId)) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />

            <div className={styles.actions}>
              <div className={styles.leftActions}>
                {questionId && (
                  <FavoriteButton 
                    questionId={questionId} 
                    showText={true}
                    size="medium"
                    className={styles.favoriteButton}
                  />
                )}
              </div>
              <div className={styles.rightActions}>
                <Button onClick={handleClose}>Закрыть</Button>
                {Number(currentUserId) === Number(activePlayerId) && (
                  <Button onClick={handleSubmit} disabled={loading || answerSubmitted}>
                    {answerSubmitted ? 'Ответ отправлен' : 'Отправить'}
                  </Button>
                )}
              </div>
            </div>
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
