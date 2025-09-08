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
  lobbyId?: number;
  currentUserId: number;          // 👈 id текущего игрока
  activePlayerId: number | null;  // 👈 id активного игрока
  activePlayerName: string;       // 👈 имя активного игрока
  onAnswerResult?: (
    correct: boolean,
    scores?: { userScore?: number; sessionScore?: number; incorrectAnswers?: number }
  ) => void;
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
  onAnswerResult,
  sharedResult,
}: QuestionModalProps) {
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    setAnswer('');
    setResult(null);
  }, [questionId]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!questionId) return;

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
    onClose();
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

            {Number(currentUserId) === Number(activePlayerId) ? (
              <>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Ваш ответ..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  disabled={loading}
                />

                <div className={styles.actions}>
                  <Button onClick={onClose}>Закрыть</Button>
                  <Button onClick={handleSubmit} disabled={loading || !answer.trim()}>
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
