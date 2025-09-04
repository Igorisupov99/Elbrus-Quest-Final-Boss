import { useState } from "react";
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
  onAnswerResult?: (
    correct: boolean,
    scores?: { userScore?: number; sessionScore?: number }
  ) => void;
}

export function QuestionModal({
  isOpen,
  onClose,
  topic,
  question,
  questionId,
  lobbyId,
  onAnswerResult,
}: QuestionModalProps) {
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!questionId) return;

    try {
      setLoading(true);
      setResult(null);

      const res = await api.post(
        "/api/question/answerCheck",
        { question_id: questionId, answer, lobbyId },
        { withCredentials: true }
      );

      if (res.data.correct) {
        setResult("✅ Правильный ответ! (+10 очков)");
        onAnswerResult?.(true, {
          userScore: res.data.userScore,
          sessionScore: res.data.sessionScore,
        });
      } else {
        setResult("❌ Неправильный ответ!");
        onAnswerResult?.(false);
      }
    } catch (err) {
      console.error("Ошибка при отправке ответа:", err);
      setResult("⚠ Ошибка при проверке ответа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        <h2 className={styles.title}>{topic}</h2>
        <p className={styles.question}>{question}</p>

        <input
          type="text"
          className={styles.input}
          placeholder="Ваш ответ..."
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={loading}
        />

        {result && <p className={styles.result}>{result}</p>}

        <div className={styles.actions}>
          <Button onClick={onClose}>Закрыть</Button>
          <Button onClick={handleSubmit} disabled={loading || !answer.trim()}>
            Отправить
          </Button>
        </div>
      </div>
    </div>
  );
}
