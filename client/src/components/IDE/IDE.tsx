import React, { useState, useRef, useEffect } from 'react';
import type { IDETask, IDETaskValidation } from '../../types/ideTask';
import { ideApi } from '../../api/ide/ideApi';
import styles from './IDE.module.css';

interface IDEProps {
  task: IDETask;
  onTaskComplete: (validation: IDETaskValidation) => void;
  onCodeChange: (code: string) => void;
}

const IDE: React.FC<IDEProps> = ({ task, onTaskComplete, onCodeChange }) => {
  const [userCode, setUserCode] = useState(task.userCode || task.initialCode);
  const [isValidating, setIsValidating] = useState(false);
  const [validation, setValidation] = useState<IDETaskValidation | null>(null);
  const [currentHint, setCurrentHint] = useState<string | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [solution, setSolution] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Сброс состояния при изменении задачи
  useEffect(() => {
    setUserCode(task.userCode || task.initialCode);
    setValidation(null);
    setCurrentHint(null);
    setShowSolution(false);
    setSolution(null);
  }, [task.id, task.initialCode]);

  // Обработка изменения кода
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setUserCode(newCode);
    onCodeChange(newCode);
  };

  // Валидация кода
  const handleValidateCode = async () => {
    if (!userCode.trim()) return;

    try {
      setIsValidating(true);
      const result = await ideApi.validateCode(task.id, userCode, task.description, task.testCases);
      setValidation(result);
      onTaskComplete(result);
    } catch (error) {
      console.error('Ошибка валидации кода:', error);
    } finally {
      setIsValidating(false);
    }
  };

  // Получение подсказки
  const handleGetHint = async () => {
    try {
      const hintIndex = task.hints.findIndex(hint => hint === currentHint) + 1;
      const response = await ideApi.getHint(task.id, hintIndex, task.description, userCode);
      setCurrentHint(response.hint);
    } catch (error) {
      console.error('Ошибка получения подсказки:', error);
    }
  };

  // Показать решение
  const handleShowSolution = async () => {
    if (solution) {
      setShowSolution(!showSolution);
      return;
    }

    try {
      const response = await ideApi.getSolution(task.id, task.description);
      setSolution(response.solution);
      setShowSolution(true);
    } catch (error) {
      console.error('Ошибка получения решения:', error);
    }
  };

  // Сброс кода
  const handleResetCode = () => {
    setUserCode(task.initialCode);
    onCodeChange(task.initialCode);
    setValidation(null);
    setCurrentHint(null);
    setShowSolution(false);
  };

  // Обработка горячих клавиш
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      handleValidateCode();
    }
  };

  // Автоматическое изменение размера textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [userCode]);

  return (
    <div className={styles.ideContainer}>
      {/* Заголовок задачи */}
      <div className={styles.taskHeader}>
        <div className={styles.taskMeta}>
          <h3 className={styles.taskTitle}>{task.title}</h3>
          <div className={styles.taskBadges}>
            <span className={styles.languageBadge}>{task.language.toUpperCase()}</span>
            <span className={`${styles.difficultyBadge} ${styles[task.difficulty]}`}>
              {task.difficulty === 'easy' ? '🟢 Легкий' : 
               task.difficulty === 'medium' ? '🟡 Средний' : '🔴 Сложный'}
            </span>
            <span className={styles.topicBadge}>{task.topic}</span>
          </div>
        </div>
        <div className={styles.taskActions}>
          <button
            className={styles.resetButton}
            onClick={handleResetCode}
            title="Сбросить код"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Описание задачи */}
      <div className={styles.taskDescription}>
        <p>{task.description}</p>
        {task.expectedOutput && (
          <div className={styles.expectedOutput}>
            <strong>Ожидаемый результат:</strong>
            <pre>{task.expectedOutput}</pre>
          </div>
        )}
      </div>

      {/* Редактор кода */}
      <div className={styles.codeEditor}>
        <div className={styles.editorHeader}>
          <span className={styles.editorTitle}>Код</span>
          <div className={styles.editorActions}>
            <button
              className={styles.hintButton}
              onClick={handleGetHint}
              disabled={!task.hints.length}
            >
              💡 Подсказка
            </button>
            <button
              className={styles.solutionButton}
              onClick={handleShowSolution}
            >
              {showSolution ? 'Скрыть решение' : 'Показать решение'}
            </button>
          </div>
        </div>
        
        <textarea
          ref={textareaRef}
          value={userCode}
          onChange={handleCodeChange}
          onKeyDown={handleKeyDown}
          className={styles.codeTextarea}
          placeholder="Введите ваш код здесь..."
          spellCheck={false}
        />
        
        <div className={styles.editorFooter}>
          <span className={styles.hotkeyHint}>Ctrl+Enter для запуска</span>
          <button
            className={styles.runButton}
            onClick={handleValidateCode}
            disabled={!userCode.trim() || isValidating}
          >
            {isValidating ? '⏳ Проверяю...' : '▶️ Запустить код'}
          </button>
        </div>
      </div>

      {/* Подсказка */}
      {currentHint && (
        <div className={styles.hintSection}>
          <h4>💡 Подсказка:</h4>
          <p>{currentHint}</p>
        </div>
      )}

      {/* Решение */}
      {showSolution && solution && (
        <div className={styles.solutionSection}>
          <h4>✅ Решение:</h4>
          <pre className={styles.solutionCode}>{solution}</pre>
        </div>
      )}

      {/* Результаты валидации */}
      {validation && (
        <div className={`${styles.validationSection} ${
          validation.isCorrect ? styles.success : styles.error
        }`}>
          <div className={styles.validationHeader}>
            <h4>
              {validation.isCorrect ? '🎉 Отлично!' : '❌ Попробуйте еще раз'}
            </h4>
            <span className={styles.testResults}>
              Пройдено тестов: {validation.passedTests}/{validation.totalTests}
            </span>
          </div>
          
          {validation.errorMessage && (
            <div className={styles.errorMessage}>
              <strong>Ошибка:</strong> {validation.errorMessage}
            </div>
          )}

          {validation.testResults.length > 0 && (
            <div className={styles.testDetails}>
              <h5>Детали тестов:</h5>
              {validation.testResults.map((result, index) => (
                <div key={index} className={`${styles.testResult} ${
                  result.passed ? styles.passed : styles.failed
                }`}>
                  <span className={styles.testIcon}>
                    {result.passed ? '✅' : '❌'}
                  </span>
                  <div className={styles.testInfo}>
                    <div className={styles.testDescription}>
                      {result.testCase.description || `Тест ${index + 1}`}
                    </div>
                    <div className={styles.testInput}>
                      <strong>Вход:</strong> {result.testCase.input}
                    </div>
                    <div className={styles.testExpected}>
                      <strong>Ожидалось:</strong> {result.testCase.expectedOutput}
                    </div>
                    {result.actualOutput && (
                      <div className={styles.testActual}>
                        <strong>Получено:</strong> {result.actualOutput}
                      </div>
                    )}
                    {result.errorMessage && (
                      <div className={styles.testError}>
                        <strong>Ошибка:</strong> {result.errorMessage}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IDE;
