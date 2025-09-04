import { useState } from "react";
import axios from "axios";
import { Button } from "../../Button/Button";
import styles from "./QuestionModal.module.css";

interface QuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic: string;
  question: string;
  questionId: number | null;
}

export function QuestionModal({
  isOpen,
  onClose,
  topic,
  question,
  questionId,
}: QuestionModalProps) {
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSendAnswer = async () => {
    if (!questionId) {
      console.error("Нет ID вопроса, нельзя проверить ответ");
      return;
    }

    try {
      const res = await axios.post("/api/question/answerCheck", {
        question_id: questionId,
        answer,
      });

      if (res.data.correct) {
        setFeedback("✅ Ответ правильный!");
      } else {
        setFeedback("❌ Ответ неверный, попробуйте снова.");
      }
    } catch (err) {
      console.error("Ошибка при проверке ответа:", err);
      setFeedback("⚠ Ошибка при отправке ответа");
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
        />

        {feedback && <p className={styles.feedback}>{feedback}</p>}

        <div className={styles.actions}>
          <Button onClick={onClose}>Закрыть</Button>
          <Button onClick={handleSendAnswer}>Отправить</Button>
        </div>
      </div>
    </div>
  );
}
