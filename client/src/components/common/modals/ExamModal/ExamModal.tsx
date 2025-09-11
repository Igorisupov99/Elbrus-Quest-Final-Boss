import { useState, useEffect } from "react";
import { Button } from "../../Button/Button";
import styles from "./ExamModal.module.css";
import api from "../../../../api/axios";
import { useAppSelector, useAppDispatch } from "../../../../store/hooks";
import { setExamIndex } from "../../../../store/lobbyPage/lobbySlice";

interface ExamQuestion {
  id: number;
  question_text: string;
  topic_title: string;
}

interface ExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  lobbyId?: number;
  currentUserId: number;
  activePlayerId: number | null;
  activePlayerName: string;
  onExamComplete?: (correctAnswers: number, totalQuestions: number) => void;
  onLocalIncorrectAnswer?: () => void;
  onTimeout?: (pointId: string) => void;
  sharedResult?: string | null;
  questions?: ExamQuestion[];
  onAdvance?: (correct: boolean) => void;
  onTimerReset?: (timeLeft: number) => void;
}

export function ExamModal({
  isOpen,
  onClose,
  lobbyId,
  currentUserId,
  activePlayerId,
  activePlayerName,
  onExamComplete,
  onLocalIncorrectAnswer,
  onTimeout,
  sharedResult,
  questions,
  onAdvance,
  onTimerReset,
}: ExamModalProps) {
  // Для отправки прогресса экзамена (следующий вопрос) используем хук сокета через пропсы не получаем, поэтому просто импорт нельзя использовать напрямую.
  const dispatch = useAppDispatch();
  const globalQuestions = useAppSelector(s => s.lobbyPage.examQuestions);
  const currentQuestionIndex = useAppSelector(s => s.lobbyPage.examIndex);
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>(questions ?? globalQuestions ?? []);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);

  const totalQuestions = examQuestions.length;
  const currentQuestion = examQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  useEffect(() => {
    if (questions && questions.length > 0) {
      setExamQuestions(questions);
    } else if (globalQuestions && globalQuestions.length > 0) {
      setExamQuestions(globalQuestions);
    }
  }, [questions, globalQuestions]);

  // Индекс управляется через Redux (examStart/examNext). Локально не сбрасываем.

  // Индекс берём из Redux, локально не дублируем

  useEffect(() => {
    setAnswer('');
    setCorrectAnswer(null);
    setTimeLeft(30);
    setTimerActive(false);
    
    // НЕ сбрасываем result - уведомления показываются через сокет
    
    // Автоматически запускаем таймер для всех игроков при переходе к новому вопросу
    if (isOpen) {
      setTimerActive(true);
    }
  }, [currentQuestionIndex, isOpen]);

  // Таймер для всех игроков (синхронизированный)
  useEffect(() => {
    if (!isOpen || !timerActive) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setTimerActive(false);
          // Только активный игрок может отправлять ответы
          if (Number(currentUserId) === Number(activePlayerId)) {
            // Автоматически отправляем ответ при истечении времени
            console.log("⏰ Время истекло в экзамене, автоматически отправляем ответ:", answer.trim() || "пустой");
            if (answer.trim()) {
              handleSubmit();
            } else {
              // Если ответ пустой в экзамене — считаем как неправильный ответ,
              // отправляем на сервер для применения штрафа и НЕ закрываем модалку
              console.log("⏰ Пустой ответ при истечении времени в экзамене - считаем как неправильный и штрафуем");
              (async () => {
                try {
                  await api.post(
                    "/api/exam/examAnswerCheck",
                    { 
                      phase_id: currentQuestion.phase_id || 1, 
                      topic_id: currentQuestion.topic_id, 
                      question_id: currentQuestion.id, 
                      answer: "" 
                    },
                    { withCredentials: true }
                  );
                } catch (e) {
                  console.error("Ошибка применения штрафа при таймауте экзамена", e);
                } finally {
                  setResult("⏰ Время истекло. Ответ засчитан как неправильный.");
                  onAdvance?.(false);
                }
              })();
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, timerActive, currentUserId, activePlayerId, answer]);

  // Запускаем таймер когда модальное окно открывается для всех игроков
  useEffect(() => {
    if (isOpen && !loading) {
      setTimerActive(true);
    } else {
      setTimerActive(false);
    }
  }, [isOpen, loading]);

  // Синхронизация таймера через сокеты
  useEffect(() => {
    if (onTimerReset) {
      const handleTimerReset = (timeLeft: number) => {
        setTimeLeft(timeLeft);
        setTimerActive(true);
      };
      
      // Здесь можно добавить слушатель события, если нужно
      // Пока просто используем пропс для синхронизации
    }
  }, [onTimerReset]);

  // Загрузка перенесена в инициатора и рассылается по сокету

  const handleSubmit = async () => {
    if (!currentQuestion) return;

    setTimerActive(false); // Останавливаем таймер при отправке ответа

    try {
      setLoading(true);
      setResult(null);

      const res = await api.post(
        "/api/exam/examAnswerCheck",
        { 
          phase_id: currentQuestion.phase_id || 1, 
          topic_id: currentQuestion.topic_id, 
          question_id: currentQuestion.id, 
          answer 
        },
        { withCredentials: true }
      );

      if (res.data.correct) {
        // Убираем локальное уведомление - оно будет показано через сокет всем игрокам
        // Переходим к следующему вопросу или завершаем экзамен
        // Сообщаем серверу, что ответ правильный, чтобы он продвинул индекс и/или завершил экзамен
        onAdvance?.(true);
      } else {
        setResult("❌ Неправильный ответ! Ход переходит следующему игроку");
        setCorrectAnswer(res.data.correctAnswer);
        // При неправильном ответе не продвигаем индекс, просто передаём ход следующему игроку
        onAdvance?.(false);
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
    setCorrectAnswer(null);
    setTimerActive(false);
    setTimeLeft(30);
    // Не трогаем общий список вопросов и индекс — это ломает синхронизацию
    // В экзамене закрытие активным игроком трактуем как неправильный ответ (передаём ход),
    // но НЕ трогаем обычные точки карты и НЕ закрываем модалку
    if (Number(currentUserId) === Number(activePlayerId)) {
      setResult('❌ Ответ не отправлен. Ход передан следующему игроку.');
      onAdvance?.(false);
      return;
    }
    // Неактивный игрок просто закрывает у себя
    onClose();
  };

  if (!isOpen) return null;

  const isCorrectMessage = false; // для экзамена не скрываем контент по общему сообщению

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Экзамен</h2>
        
        {result && (
          <p className={styles.result}>{result}</p>
        )}

        {sharedResult && (
          <p className={styles.result}>{sharedResult}</p>
        )}

        {correctAnswer && (
          <div className={styles.correctAnswerSection}>
            <p className={styles.correctAnswerLabel}>Правильный ответ:</p>
            <p className={styles.correctAnswerText}>{correctAnswer}</p>
          </div>
        )}

        {!isCorrectMessage && totalQuestions > 0 && currentQuestion && (
          <>
            <div className={styles.progress}>
              <p>Осталось ответить на {totalQuestions - currentQuestionIndex} вопросов из {totalQuestions}</p>
            </div>

            <h3 className={styles.topic}>{currentQuestion.topic_title}</h3>
            <p className={styles.question}>{currentQuestion.question_text}</p>

            {timerActive && (
              <div className={`${styles.timer} ${
                timeLeft <= 10 ? styles.timerDanger : 
                timeLeft <= 15 ? styles.timerWarning : ''
              }`}>
                <p className={styles.timerText}>
                  ⏰ Осталось: {timeLeft} сек
                  {Number(currentUserId) === Number(activePlayerId) ? ' (ваш ход)' : ' (ход другого игрока)'}
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

        {totalQuestions === 0 && !isCorrectMessage && (
          <div className={styles.loading}>
            <p>Загрузка вопросов экзамена...</p>
            <div className={styles.actions}>
              <Button onClick={handleClose}>Закрыть</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
