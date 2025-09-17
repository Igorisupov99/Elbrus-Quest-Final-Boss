import React, { useState, useRef, useEffect } from 'react';
import { aiApi } from '../../api/ai/aiApi';
import type { FavoriteQuestion } from '../../types/favorite';
import styles from './AIChatModal.module.css';

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: FavoriteQuestion;
}

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export const AIChatModal: React.FC<AIChatModalProps> = ({
  isOpen,
  onClose,
  question
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Прокрутка к последнему сообщению
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Инициализация чата с контекстом вопроса
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const initialMessage: ChatMessage = {
        id: 'initial',
        text: `Привет! Я готов обсудить с тобой этот вопрос:\n\n"${question.question.text}"\n\nТема: ${question.question.topic.title}\nТип вопроса: ${question.question.questionType}\n\nЗадавай любые вопросы по этой теме!`,
        isUser: false,
        timestamp: new Date()
      };
      setMessages([initialMessage]);
    }
  }, [isOpen, question, messages.length]);

  // Обработка отправки сообщения
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await aiApi.sendMessage({
        message: inputMessage,
        context: `Контекст вопроса: "${question.question.text}". Тема: ${question.question.topic.title}. Тип: ${question.question.questionType}. Правильный ответ: ${question.question.correctAnswer}. Подсказка ментора: ${question.question.mentorTip || 'Нет подсказки'}.`
      });

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response.message,
        isUser: false,
        timestamp: new Date(response.timestamp)
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      console.error('Ошибка при отправке сообщения АИ:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Извините, произошла ошибка при обращении к АИ. Попробуйте еще раз.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Обработка нажатия Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Очистка чата при закрытии
  const handleClose = () => {
    setMessages([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <h2 className={styles.title}>🤖 Обсуждение с AI</h2>
            <p className={styles.questionPreview}>
              Вопрос: {question.question.text.length > 60 
                ? `${question.question.text.substring(0, 60)}...` 
                : question.question.text}
            </p>
          </div>
          <button className={styles.closeButton} onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className={styles.chatContainer}>
          <div className={styles.messages}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`${styles.message} ${message.isUser ? styles.userMessage : styles.aiMessage}`}
              >
                <div className={styles.messageContent}>
                  <div className={styles.messageText}>
                    {message.text.split('\n').map((line, index) => (
                      <React.Fragment key={index}>
                        {line}
                        {index < message.text.split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className={styles.messageTime}>
                    {message.timestamp.toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className={`${styles.message} ${styles.aiMessage}`}>
                <div className={styles.messageContent}>
                  <div className={styles.typingIndicator}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className={styles.inputContainer}>
            <div className={styles.inputWrapper}>
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Задайте вопрос по теме..."
                className={styles.messageInput}
                rows={2}
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className={styles.sendButton}
              >
                {isLoading ? '⏳' : '📤'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
