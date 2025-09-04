import { useState } from "react";
import { Button } from "../../Button/Button";
import styles from "./QuestionModal.module.css";

interface QuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic: string;
  question: string;
}

export function QuestionModal({ isOpen, onClose, topic, question }: QuestionModalProps) {
  const [answer, setAnswer] = useState("");

  if (!isOpen) return null;

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

        <div className={styles.actions}>
          <Button onClick={onClose}>Закрыть</Button>
          <Button
            onClick={() => {
              console.log("Ответ:", answer);
              onClose();
            }}
          >
            Отправить
          </Button>
        </div>
      </div>
    </div>
  );
}
