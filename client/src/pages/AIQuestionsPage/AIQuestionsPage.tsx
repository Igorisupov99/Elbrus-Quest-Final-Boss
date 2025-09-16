import React, { useState } from 'react';
import { aiApi } from '../../api/ai/aiApi';
import type { AIQuestionResponse, AICheckAnswerResponse } from '../../api/ai/aiApi';
import CodeRunner from '../../components/CodeRunner/CodeRunner';
import styles from './AIQuestionsPage.module.css';

interface AIQuestion {
  id: string;
  question: string;
  answer: string;
  hint: string;
  topic: string;
  difficulty: string;
  userAnswer?: string;
  isAnswered?: boolean;
  isCorrect?: boolean;
  isPartial?: boolean;
  showHint?: boolean;
}

const TOPICS = [
  'JavaScript',
  'React',
  'TypeScript',
  'Node.js',
  'HTML/CSS',
  'Алгоритмы',
  'Базы данных',
  'Git',
  'Web-разработка'
];

const DIFFICULTY_LEVELS = [
  { value: 'easy', label: 'Легкий', emoji: '🟢' },
  { value: 'medium', label: 'Средний', emoji: '🟡' },
  { value: 'hard', label: 'Сложный', emoji: '🔴' }
];

const AIQuestionsPage: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState<AIQuestion | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('JavaScript');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questionHistory, setQuestionHistory] = useState<AIQuestion[]>([]);
  const [selectedLanguage] = useState('javascript');
  const [activeTab, setActiveTab] = useState<'questions' | 'codeRunner'>('questions');
  
  // CodeRunner состояния
  const [codeRunnerCode, setCodeRunnerCode] = useState(`// Добро пожаловать в CodeRunner!
// Здесь вы можете писать и выполнять JavaScript/TypeScript код

console.log('Привет, мир!');

// Пример функции
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Вызов функции
const result = fibonacci(10);
console.log('10-е число Фибоначчи:', result);

// Возвращаем результат
result;`);

  // Генерация нового вопроса
  const handleGenerateQuestion = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      setUserAnswer('');
      setCurrentQuestion(null);

      const response: AIQuestionResponse = await aiApi.generateQuestion({
        topic: selectedTopic,
        difficulty: selectedDifficulty
      });

      const newQuestion: AIQuestion = {
        id: Date.now().toString(),
        question: response.question,
        answer: response.answer,
        hint: response.hint,
        topic: response.topic,
        difficulty: response.difficulty,
        isAnswered: false
      };

      setCurrentQuestion(newQuestion);
    } catch (err: any) {
      console.error('Ошибка генерации вопроса:', err);
      setError(err.message || 'Не удалось сгенерировать вопрос');
    } finally {
      setIsGenerating(false);
    }
  };

  // Проверка ответа
  const handleCheckAnswer = async () => {
    if (!currentQuestion || !userAnswer.trim()) return;

    try {
      setIsChecking(true);
      setError(null);

      const response: AICheckAnswerResponse = await aiApi.checkAnswer({
        userAnswer: userAnswer.trim(),
        correctAnswer: currentQuestion.answer,
        question: currentQuestion.question
      });

      const updatedQuestion: AIQuestion = {
        ...currentQuestion,
        userAnswer: userAnswer.trim(),
        isAnswered: true,
        isCorrect: response.isCorrect,
        isPartial: response.isPartial
      };

      setCurrentQuestion(updatedQuestion);
      setQuestionHistory(prev => [updatedQuestion, ...prev.slice(0, 9)]); // Храним последние 10 вопросов
    } catch (err: any) {
      console.error('Ошибка проверки ответа:', err);
      setError(err.message || 'Не удалось проверить ответ');
    } finally {
      setIsChecking(false);
    }
  };

  // Показать подсказку
  const handleShowHint = () => {
    if (currentQuestion) {
      setCurrentQuestion(prev => prev ? { ...prev, showHint: !prev.showHint } : null);
    }
  };

  // Очистить текущий вопрос
  const handleClearQuestion = () => {
    setCurrentQuestion(null);
    setUserAnswer('');
    setError(null);
  };

  // Обработка нажатия Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isChecking) {
      e.preventDefault();
      handleCheckAnswer();
    }
  };



  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          🤖 Вопросы от АИ
        </h1>
        <p className={styles.subtitle}>
          Получайте уникальные вопросы и решайте задачи в IDE
        </p>
      </div>

      {/* Вкладки */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'questions' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('questions')}
        >
          📝 Вопросы
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'codeRunner' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('codeRunner')}
        >
          🚀 Code Runner
        </button>
      </div>

      {/* Настройки генерации - только для вкладки вопросов */}
      {activeTab === 'questions' && (
        <div className={styles.settings}>
          <div className={styles.settingGroup}>
            <label className={styles.settingLabel}>Тема:</label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className={styles.settingSelect}
              disabled={isGenerating}
            >
              {TOPICS.map(topic => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>
          </div>

          <div className={styles.settingGroup}>
            <label className={styles.settingLabel}>Сложность:</label>
            <div className={styles.difficultyButtons}>
              {DIFFICULTY_LEVELS.map(level => (
                <button
                  key={level.value}
                  className={`${styles.difficultyButton} ${
                    selectedDifficulty === level.value ? styles.active : ''
                  }`}
                  onClick={() => setSelectedDifficulty(level.value as 'easy' | 'medium' | 'hard')}
                  disabled={isGenerating}
                >
                  {level.emoji} {level.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.generateButtons}>
            <button
              className={styles.generateButton}
              onClick={handleGenerateQuestion}
              disabled={isGenerating}
            >
              {isGenerating ? '⏳ Генерирую...' : '🎲 Сгенерировать вопрос'}
            </button>
          </div>
        </div>
      )}

      {/* Ошибка */}
      {error && (
        <div className={styles.error}>
          <span className={styles.errorIcon}>⚠️</span>
          <span>{error}</span>
          <button 
            className={styles.retryButton}
            onClick={() => setError(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Текущий вопрос */}
      {currentQuestion && (
        <div className={styles.questionCard}>
          <div className={styles.questionHeader}>
            <div className={styles.questionMeta}>
              <span className={styles.topicBadge}>{currentQuestion.topic}</span>
              <span className={styles.difficultyBadge}>
                {DIFFICULTY_LEVELS.find(l => l.value === currentQuestion.difficulty)?.emoji}
                {DIFFICULTY_LEVELS.find(l => l.value === currentQuestion.difficulty)?.label}
              </span>
            </div>
            <button
              className={styles.clearButton}
              onClick={handleClearQuestion}
              title="Очистить вопрос"
            >
              ✕
            </button>
          </div>

          <div className={styles.questionContent}>
            <h3 className={styles.questionText}>
              {currentQuestion.question}
            </h3>

            {!currentQuestion.isAnswered ? (
              <div className={styles.answerSection}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Ваш ответ:</label>
                  <textarea
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Введите ваш ответ..."
                    className={styles.answerInput}
                    rows={3}
                    disabled={isChecking}
                  />
                </div>

                <div className={styles.questionActions}>
                  <button
                    className={styles.checkButton}
                    onClick={handleCheckAnswer}
                    disabled={!userAnswer.trim() || isChecking}
                  >
                    {isChecking ? '⏳ Проверяю...' : '✅ Проверить ответ'}
                  </button>
                  
                  <button
                    className={styles.hintButton}
                    onClick={handleShowHint}
                  >
                    {currentQuestion.showHint ? 'Скрыть подсказку' : '💡 Показать подсказку'}
                  </button>
                </div>

                {currentQuestion.showHint && (
                  <div className={styles.hintSection}>
                    <h4>💡 Подсказка:</h4>
                    <p>{currentQuestion.hint}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.resultSection}>
                <div className={`${styles.resultCard} ${
                  currentQuestion.isCorrect ? styles.correct : 
                  currentQuestion.isPartial ? styles.partial : styles.incorrect
                }`}>
                  <div className={styles.resultIcon}>
                    {currentQuestion.isCorrect ? '🎉' : 
                     currentQuestion.isPartial ? '🤔' : '❌'}
                  </div>
                  <div className={styles.resultContent}>
                    <h4 className={styles.resultTitle}>
                      {currentQuestion.isCorrect ? 'Правильно!' : 
                       currentQuestion.isPartial ? 'Частично правильно' : 'Неправильно'}
                    </h4>
                    <p className={styles.resultText}>
                      {currentQuestion.isCorrect ? 'Отличная работа!' : 
                       currentQuestion.isPartial ? 'Вы на правильном пути, но ответ неполный' : 
                       'Попробуйте еще раз или посмотрите правильный ответ'}
                    </p>
                  </div>
                </div>

                <div className={styles.answerReveal}>
                  <div className={styles.userAnswer}>
                    <strong>Ваш ответ:</strong> {currentQuestion.userAnswer}
                  </div>
                  <div className={styles.correctAnswer}>
                    <strong>Правильный ответ:</strong> {currentQuestion.answer}
                  </div>
                </div>

                <div className={styles.resultActions}>
                  <button
                    className={styles.newQuestionButton}
                    onClick={handleGenerateQuestion}
                    disabled={isGenerating}
                  >
                    🎲 Новый вопрос
                  </button>
                  
                  <button
                    className={styles.clearButton}
                    onClick={handleClearQuestion}
                  >
                    🗑️ Очистить
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* История вопросов */}
      {questionHistory.length > 0 && (
        <div className={styles.historySection}>
          <h3 className={styles.historyTitle}>📚 История вопросов</h3>
          <div className={styles.historyList}>
            {questionHistory.map((question) => (
              <div key={question.id} className={styles.historyItem}>
                <div className={styles.historyMeta}>
                  <span className={styles.historyTopic}>{question.topic}</span>
                  <span className={`${styles.historyResult} ${
                    question.isCorrect ? styles.correct : 
                    question.isPartial ? styles.partial : styles.incorrect
                  }`}>
                    {question.isCorrect ? '✅' : 
                     question.isPartial ? '🤔' : '❌'}
                  </span>
                </div>
                <p className={styles.historyQuestion}>
                  {question.question.length > 100 
                    ? `${question.question.substring(0, 100)}...` 
                    : question.question}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Code Runner */}
      {activeTab === 'codeRunner' && (
        <div className={styles.codeRunnerSection}>
          <div className={styles.codeRunnerHeader}>
            <h3 className={styles.codeRunnerTitle}>🚀 Code Runner</h3>
            <p className={styles.codeRunnerDescription}>
              Пишите и выполняйте JavaScript/TypeScript код в реальном времени. 
              Используйте console.log() для вывода или просто возвращайте значения из функций.
            </p>
          </div>
          
          <div className={styles.codeRunnerContainer}>
            <CodeRunner
              initialCode={codeRunnerCode}
              language={selectedLanguage as 'javascript' | 'typescript'}
              height="500px"
              onCodeChange={setCodeRunnerCode}
            />
          </div>
        </div>
      )}

      {/* Пустое состояние */}
      {!currentQuestion && questionHistory.length === 0 && activeTab === 'questions' && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🤖</div>
          <h3>Начните с генерации вопроса!</h3>
          <p>Выберите тему и сложность, затем нажмите "Сгенерировать вопрос"</p>
        </div>
      )}

    </div>
  );
};

export default AIQuestionsPage;
