import { useState, useEffect } from "react";
import { Button } from "../../Button/Button";
import { ConfirmCloseExamModal } from "../ConfirmCloseExamModal/ConfirmCloseExamModal";
import styles from "./ExamModal.module.css";
import api from "../../../../api/axios";
import { useAppSelector } from "../../../../store/hooks";

interface ExamQuestion {
  id: number;
  question_text: string;
  topic_title: string;
  phase_id?: number;
  topic_id?: number;
}

interface ExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  lobbyId?: number;
  currentUserId: number;
  activePlayerId: number | null;
  activePlayerName: string;
  questions?: ExamQuestion[];
  onAdvance?: (correct: boolean, isTimeout?: boolean, answer?: string) => void;
  onTimerReset?: (timeLeft: number) => void;
  onAnswerSync?: (answer: string, activePlayerName: string) => void;
  syncedAnswer?: string;          // 👈 синхронизированный ввод от активного игрока
  onExamFail?: () => void;        // 👈 колбэк для провала экзамена
}

export function ExamModal({
  isOpen,
  onClose,
  lobbyId: _lobbyId,
  currentUserId,
  activePlayerId,
  activePlayerName,
  questions,
  onAdvance,
  onTimerReset,
  onAnswerSync,
  syncedAnswer,
  onExamFail,
}: ExamModalProps) {
  // Для отправки прогресса экзамена (следующий вопрос) используем хук сокета через пропсы не получаем, поэтому просто импорт нельзя использовать напрямую.
  const globalQuestions = useAppSelector(s => s.lobbyPage.examQuestions);
  const currentQuestionIndex = useAppSelector(s => s.lobbyPage.examIndex);
  const examRestoring = useAppSelector(s => s.lobbyPage.examRestoring);
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>(questions ?? globalQuestions ?? []);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [hasBeenRestored, setHasBeenRestored] = useState(false); // Флаг для отслеживания восстановления

  const totalQuestions = examQuestions.length;
  const currentQuestion = examQuestions[currentQuestionIndex];

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
    console.log('🔄 [EXAM] useEffect вызван:', { 
      currentQuestionIndex, 
      isOpen, 
      examRestoring,
      hasBeenRestored,
      timeLeft: timeLeft,
      timerActive: timerActive 
    });
    
    // Если экзамен восстанавливается, не сбрасываем состояние
    if (examRestoring) {
      console.log('🔄 [EXAM] Экзамен восстанавливается, не сбрасываем состояние');
      setHasBeenRestored(true); // Помечаем что экзамен был восстановлен
      // При восстановлении НЕ запускаем таймер здесь - он будет синхронизирован через событие
      return;
    }
    
    // Если экзамен был восстановлен и теперь examRestoring стал false - не сбрасываем состояние
    if (hasBeenRestored && !examRestoring) {
      console.log('🔄 [EXAM] Экзамен был восстановлен, пропускаем сброс состояния');
      return;
    }
    
    console.log('🔄 [EXAM] Сбрасываем состояние для нового вопроса');
    setAnswer('');
    setCorrectAnswer(null);
    setTimeLeft(30);
    setTimerActive(false);
    setAnswerSubmitted(false); // Сбрасываем флаг отправки ответа
    setHasBeenRestored(false); // Сбрасываем флаг восстановления для нового вопроса
    
    // НЕ сбрасываем result - уведомления показываются через сокет
    
    // Автоматически запускаем таймер для всех игроков при переходе к новому вопросу
    if (isOpen) {
      console.log('⏰ [EXAM] Запускаем таймер для нового вопроса');
      setTimerActive(true);
    }
  }, [currentQuestionIndex, isOpen, examRestoring, hasBeenRestored]);

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
            if (answer.trim() && !answerSubmitted) {
              handleSubmit();
            } else {
              // Если ответ пустой в экзамене или уже отправлен — считаем как неправильный ответ
              // Используем сокетную логику для корректного перехода к следующему вопросу
              console.log("⏰ Пустой ответ или уже отправленный ответ при истечении времени в экзамене - считаем как неправильный");
              // Очищаем инпут при истечении времени
              setAnswer('');
              // Убираем локальное уведомление - оно будет показано через сокет всем игрокам
              onAdvance?.(false, true); // Передаем true для указания таймаута
            }
          } else {
            // Если неактивный игрок - просто сбрасываем таймер
            console.log("⏰ Время истекло для неактивного игрока в экзамене");
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
    console.log('⏰ [EXAM] Проверка запуска таймера:', { isOpen, loading, examRestoring });
    
    if (isOpen && !loading && !examRestoring) {
      // Запускаем таймер только если экзамен НЕ восстанавливается
      console.log('⏰ [EXAM] Запускаем таймер при открытии модалки (не восстановление)');
      setTimerActive(true);
    } else if (!isOpen) {
      console.log('⏰ [EXAM] Останавливаем таймер - модалка закрыта');
      setTimerActive(false);
    } else if (examRestoring) {
      console.log('⏰ [EXAM] НЕ запускаем таймер - экзамен восстанавливается');
    }
    // При восстановлении таймер будет синхронизирован через событие
  }, [isOpen, loading, examRestoring]);

  // Слушаем события синхронизации таймера
  useEffect(() => {
    const handleTimerReset = (event: CustomEvent) => {
      const { timeLeft } = event.detail;
      console.log('⏰ [EXAM] Получено событие синхронизации таймера:', timeLeft, 'isOpen:', isOpen, 'examRestoring:', examRestoring);
      
      // Применяем синхронизацию только если модальное окно открыто
      if (isOpen) {
        console.log('⏰ [EXAM] Применяем синхронизацию таймера:', timeLeft);
        setTimeLeft(timeLeft);
        setTimerActive(timeLeft > 0); // Активируем таймер только если время больше 0
        
        // Сбрасываем ответ при синхронизации (кроме активного игрока)
        if (Number(currentUserId) !== Number(activePlayerId)) {
          console.log('🔄 [EXAM] Сбрасываем ответ неактивного игрока при синхронизации таймера');
          setAnswer('');
          setAnswerSubmitted(false);
        } else {
          console.log('🔄 [EXAM] НЕ сбрасываем ответ активного игрока при синхронизации таймера');
        }
        
        // Если это было восстановление, отмечаем успешную синхронизацию
        if (examRestoring) {
          console.log('🔄 [EXAM] Таймер синхронизирован после восстановления экзамена');
        }
      }
    };

    window.addEventListener('exam:timerReset', handleTimerReset as EventListener);
    
    return () => {
      window.removeEventListener('exam:timerReset', handleTimerReset as EventListener);
    };
  }, [isOpen, currentUserId, activePlayerId, examRestoring]);

  // Синхронизация таймера через сокеты
  useEffect(() => {
    if (onTimerReset) {
      // Пока просто используем пропс для синхронизации
      // Можно добавить слушатель события при необходимости
    }
  }, [onTimerReset]);

  // Синхронизация ответа активного игрока
  useEffect(() => {
    if (onAnswerSync) {
      // Пока просто используем пропс для синхронизации
      // Можно добавить слушатель события при необходимости
    }
  }, [onAnswerSync]);

  // Синхронизация ввода от активного игрока
  useEffect(() => {
    if (syncedAnswer !== undefined && Number(currentUserId) !== Number(activePlayerId)) {
      console.log('🔄 [EXAM] Синхронизируем ввод от активного игрока:', syncedAnswer);
      // Обновляем ввод только для неактивных игроков
      setAnswer(syncedAnswer);
      setAnswerSubmitted(false); // Сбрасываем флаг при синхронизации
    } else if (syncedAnswer !== undefined && Number(currentUserId) === Number(activePlayerId)) {
      console.log('🔄 [EXAM] Пропускаем синхронизацию для активного игрока:', syncedAnswer);
    }
  }, [syncedAnswer, currentUserId, activePlayerId]);

  // Загрузка перенесена в инициатора и рассылается по сокету

  const handleAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAnswer = e.target.value;
    console.log('📝 [EXAM] Изменение инпута:', { 
      newAnswer, 
      isActive: Number(currentUserId) === Number(activePlayerId),
      answerSubmitted 
    });
    setAnswer(newAnswer);
    
    // Отправляем изменения инпута через сокет, если это активный игрок
    if (Number(currentUserId) === Number(activePlayerId) && onAnswerSync) {
      console.log('📤 [EXAM] Отправляем синхронизацию ввода:', newAnswer);
      onAnswerSync(newAnswer, activePlayerName);
    }
  };

  const handleSubmit = async () => {
    if (!currentQuestion || answerSubmitted) return;

    setTimerActive(false); // Останавливаем таймер при отправке ответа
    setAnswerSubmitted(true); // Блокируем повторную отправку

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
        console.log('✅ [EXAM] Правильный ответ, очищаем инпут. Текущий answer:', answer);
        // Очищаем инпут после правильного ответа
        setAnswer('');
        console.log('✅ [EXAM] Инпут очищен после правильного ответа');
        // Убираем локальное уведомление - оно будет показано через сокет всем игрокам
        // Переходим к следующему вопросу или завершаем экзамен
        // Сообщаем серверу, что ответ правильный, чтобы он продвинул индекс и/или завершил экзамен
        onAdvance?.(true, false, answer);
      } else {
        console.log('❌ [EXAM] Неправильный ответ, очищаем инпут. Текущий answer:', answer);
        // Очищаем инпут после неправильного ответа
        setAnswer('');
        console.log('❌ [EXAM] Инпут очищен после неправильного ответа');
        // Убираем локальное уведомление - оно будет показано через сокет всем игрокам
        setCorrectAnswer(res.data.correctAnswer);
        // При неправильном ответе не продвигаем индекс, просто передаём ход следующему игроку
        onAdvance?.(false, false, answer);
      }
      
    } catch (err) {
      console.error("Ошибка при отправке ответа:", err);
      setResult("⚠ Ошибка при проверке ответа. Попробуйте еще раз.");
      setAnswerSubmitted(false); // Разрешаем повторную отправку при ошибке
      setTimerActive(true); // Восстанавливаем таймер при ошибке
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Если закрывает активный игрок - показываем подтверждение
    if (Number(currentUserId) === Number(activePlayerId)) {
      setShowConfirmClose(true);
    } else {
      // Неактивный игрок просто закрывает у себя
      // НЕ сбрасываем флаг hasBeenRestored, чтобы при повторном открытии экзамен восстановился
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setShowConfirmClose(false);
    setHasBeenRestored(false); // Сбрасываем флаг при закрытии активным игроком
    // Вызываем колбэк для провала экзамена
    onExamFail?.();
  };

  const handleCancelClose = () => {
    setShowConfirmClose(false);
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

            <input
              type="text"
              className={styles.input}
              placeholder={
                Number(currentUserId) === Number(activePlayerId)
                  ? "Ваш ответ... (пустой ответ = неправильный)"
                  : `Отвечает ${activePlayerName}...`
              }
              value={answer}
              onChange={handleAnswerChange}
              disabled={loading || answerSubmitted || Number(currentUserId) !== Number(activePlayerId)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && Number(currentUserId) === Number(activePlayerId)) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />

            <div className={styles.actions}>
              <Button onClick={handleClose}>Закрыть</Button>
              {Number(currentUserId) === Number(activePlayerId) && (
                <Button onClick={handleSubmit} disabled={loading || answerSubmitted}>
                  {answerSubmitted ? 'Отправлено' : 'Отправить'}
                </Button>
              )}
            </div>
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

      {/* Модальное окно подтверждения закрытия экзамена */}
      <ConfirmCloseExamModal
        isOpen={showConfirmClose}
        onConfirm={handleConfirmClose}
        onCancel={handleCancelClose}
      />
    </div>
  );
}
