import { useState, useEffect } from "react";
import { Button } from "../../Button/Button";
import styles from "./ExamModal.module.css";
import api from "../../../../api/axios";
import { useAppSelector } from "../../../../store/hooks";

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
  onAdvance?: () => void;
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
}: ExamModalProps) {
  // Для отправки прогресса экзамена (следующий вопрос) используем хук сокета через пропсы не получаем, поэтому просто импорт нельзя использовать напрямую.
  const globalQuestions = useAppSelector(s => s.lobbyPage.examQuestions);
  const globalIndex = useAppSelector(s => s.lobbyPage.examIndex);
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>(questions ?? globalQuestions ?? []);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(globalIndex ?? 0);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);

  const totalQuestions = examQuestions.length;
  const currentQuestion = examQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  useEffect(() => {
    if (questions && questions.length > 0) {
      setExamQuestions(questions);
      setCurrentQuestionIndex(0);
    } else if (globalQuestions && globalQuestions.length > 0) {
      setExamQuestions(globalQuestions);
      setCurrentQuestionIndex(globalIndex ?? 0);
    }
  }, [questions, globalQuestions, globalIndex]);

  useEffect(() => {
    setAnswer('');
    setResult(null);
    setTimeLeft(30);
    setTimerActive(false);
  }, [currentQuestionIndex]);

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
          console.log("⏰ Время истекло в экзамене, автоматически отправляем ответ:", answer.trim() || "пустой");
          if (answer.trim()) {
            handleSubmit();
          } else {
            // Если ответ пустой, отправляем событие timeout всем игрокам
            console.log("⏰ Пустой ответ при истечении времени в экзамене - отправляем timeout");
            onTimeout?.("exam");
            // Закрываем модальное окно локально
            console.log("⏰ Закрываем ExamModal через 100ms");
            setTimeout(() => {
              onClose();
            }, 100);
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

  // Загрузка перенесена в инициатора и рассылается по сокету

  const handleSubmit = async () => {
    if (!currentQuestion) return;

    setTimerActive(false); // Останавливаем таймер при отправке ответа

    try {
      setLoading(true);
      setResult(null);

      const res = await api.post(
        "/api/question/answerCheck",
        { question_id: currentQuestion.id, answer, lobby_id: lobbyId },
        { withCredentials: true }
      );

      if (res.data.correct) {
        setResult("✅ Правильный ответ!");
        // Переходим к следующему вопросу или завершаем экзамен
        if (isLastQuestion) {
          // Экзамен завершен
          const correctAnswers = totalQuestions; // Все ответы правильные
          onExamComplete?.(correctAnswers, totalQuestions);
        } else {
          // Переходим к следующему вопросу
          onAdvance?.();
        }
      } else {
        setResult("❌ Неправильный ответ!");
        // При неправильном ответе завершаем экзамен
        const correctAnswers = currentQuestionIndex; // Количество правильных ответов до этого
        onExamComplete?.(correctAnswers, totalQuestions);
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
    setExamQuestions([]);
    setCurrentQuestionIndex(0);
    setTimerActive(false);
    setTimeLeft(30);
    
    // Если закрывает активный игрок до истечения времени - это неправильный ответ
    if (Number(currentUserId) === Number(activePlayerId) && timerActive) {
      console.log("❌ Активный игрок закрыл экзамен до истечения времени - локальная обработка");
      onLocalIncorrectAnswer?.();
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  const isCorrectMessage = Boolean(sharedResult && sharedResult.includes('Правильный ответ'));

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Экзамен</h2>
        
        {(sharedResult || result) && (
          <p className={styles.result}>{sharedResult ?? result}</p>
        )}

        {!isCorrectMessage && totalQuestions > 0 && currentQuestion && (
          <>
            <div className={styles.progress}>
              <p>Осталось ответить на {totalQuestions - currentQuestionIndex} вопросов из {totalQuestions}</p>
            </div>

            <h3 className={styles.topic}>{currentQuestion.topic_title}</h3>
            <p className={styles.question}>{currentQuestion.question_text}</p>

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
