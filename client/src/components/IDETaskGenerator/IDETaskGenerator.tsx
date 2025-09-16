import React, { useState, useCallback } from 'react';
import { ideApi } from '../../api/ide/ideApi';
import type { IDETask, IDETaskValidation } from '../../types/ideTask';
import styles from './IDETaskGenerator.module.css';

interface IDETaskGeneratorProps {
  onTaskGenerated: (task: IDETask) => void;
  onCodeValidation: (validation: IDETaskValidation) => void;
  onHintReceived: (hint: string) => void;
  onSolutionReceived: (solution: string) => void;
  currentCode: string;
  language: 'javascript' | 'typescript';
}

const DIFFICULTY_LEVELS = [
  { value: 'easy', label: 'Легкий', emoji: '🟢' },
  { value: 'medium', label: 'Средний', emoji: '🟡' },
  { value: 'hard', label: 'Сложный', emoji: '🔴' }
];

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

const IDETaskGenerator: React.FC<IDETaskGeneratorProps> = ({
  onTaskGenerated,
  onCodeValidation,
  onHintReceived,
  onSolutionReceived,
  currentCode,
  language
}) => {
  const [currentTask, setCurrentTask] = useState<IDETask | null>(null);
  const [selectedTopic, setSelectedTopic] = useState('JavaScript');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isGettingHint, setIsGettingHint] = useState(false);
  const [isGettingSolution, setIsGettingSolution] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hintIndex, setHintIndex] = useState(0);

  // Генерация новой задачи
  const handleGenerateTask = useCallback(async () => {
    try {
      setIsGenerating(true);
      setError(null);
      setHintIndex(0);

      const response = await ideApi.generateTask({
        language,
        difficulty: selectedDifficulty,
        topic: selectedTopic
      });

      setCurrentTask(response.task);
      onTaskGenerated(response.task);
    } catch (err: any) {
      console.error('Ошибка генерации задачи:', err);
      setError(err.message || 'Не удалось сгенерировать задачу');
    } finally {
      setIsGenerating(false);
    }
  }, [language, selectedDifficulty, selectedTopic, onTaskGenerated]);

  // Проверка решения
  const handleValidateCode = useCallback(async () => {
    if (!currentTask || !currentCode.trim()) return;

    try {
      setIsValidating(true);
      setError(null);

      const validation = await ideApi.validateCode(
        currentTask.id,
        currentCode,
        currentTask.description,
        currentTask.testCases
      );

      onCodeValidation(validation);
    } catch (err: any) {
      console.error('Ошибка валидации кода:', err);
      setError(err.message || 'Не удалось проверить код');
    } finally {
      setIsValidating(false);
    }
  }, [currentTask, currentCode, onCodeValidation]);

  // Получение подсказки
  const handleGetHint = useCallback(async () => {
    if (!currentTask) return;

    try {
      setIsGettingHint(true);
      setError(null);

      const response = await ideApi.getHint(
        currentTask.id,
        hintIndex,
        currentTask.description,
        currentCode
      );

      onHintReceived(response.hint);
      setHintIndex(prev => prev + 1);
    } catch (err: any) {
      console.error('Ошибка получения подсказки:', err);
      setError(err.message || 'Не удалось получить подсказку');
    } finally {
      setIsGettingHint(false);
    }
  }, [currentTask, hintIndex, currentCode, onHintReceived]);

  // Получение решения
  const handleGetSolution = useCallback(async () => {
    if (!currentTask) return;

    try {
      setIsGettingSolution(true);
      setError(null);

      const response = await ideApi.getSolution(
        currentTask.id,
        currentTask.description
      );

      onSolutionReceived(response.solution);
    } catch (err: any) {
      console.error('Ошибка получения решения:', err);
      setError(err.message || 'Не удалось получить решение');
    } finally {
      setIsGettingSolution(false);
    }
  }, [currentTask, onSolutionReceived]);

  // Очистка задачи
  const handleClearTask = useCallback(() => {
    setCurrentTask(null);
    setHintIndex(0);
    setError(null);
  }, []);

  return (
    <div className={styles.container}>
      {/* Заголовок */}
      <div className={styles.header}>
        <h3 className={styles.title}>🎯 IDE Задача</h3>
        <p className={styles.subtitle}>
          Сгенерируйте задачу с помощью AI и получите помощь ментора
        </p>
      </div>

      {/* Настройки генерации */}
      {!currentTask && (
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

          <button
            className={styles.generateButton}
            onClick={handleGenerateTask}
            disabled={isGenerating}
          >
            {isGenerating ? '⏳ Генерирую...' : '🎲 Сгенерировать задачу'}
          </button>
        </div>
      )}

      {/* Текущая задача */}
      {currentTask && (
        <div className={styles.taskCard}>
          <div className={styles.taskHeader}>
            <div className={styles.taskInfo}>
              <h4 className={styles.taskTitle}>{currentTask.title}</h4>
              <div className={styles.taskMeta}>
                <span className={styles.taskLanguage}>{currentTask.language}</span>
                <span className={styles.taskDifficulty}>{currentTask.difficulty}</span>
                <span className={styles.taskTopic}>{currentTask.topic}</span>
              </div>
            </div>
            <button
              className={styles.clearButton}
              onClick={handleClearTask}
              title="Очистить задачу"
            >
              ✕
            </button>
          </div>

          <div className={styles.taskDescription}>
            <p>{currentTask.description}</p>
          </div>

          <div className={styles.expectedOutput}>
            <strong>Ожидаемый результат:</strong> {currentTask.expectedOutput}
          </div>

          {/* Действия с задачей */}
          <div className={styles.taskActions}>
            <button
              className={styles.validateButton}
              onClick={handleValidateCode}
              disabled={!currentCode.trim() || isValidating}
            >
              {isValidating ? '⏳ Проверяю...' : '✅ Проверить решение'}
            </button>

            <button
              className={styles.hintButton}
              onClick={handleGetHint}
              disabled={isGettingHint}
            >
              {isGettingHint ? '⏳ Получаю...' : '💡 Подсказка'}
            </button>

            <button
              className={styles.solutionButton}
              onClick={handleGetSolution}
              disabled={isGettingSolution}
            >
              {isGettingSolution ? '⏳ Загружаю...' : '🔍 Показать решение'}
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
    </div>
  );
};

export default IDETaskGenerator;
