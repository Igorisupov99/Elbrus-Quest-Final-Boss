import React, { useState } from 'react';
import { debugValidation, validateTestCases, validateTaskData } from '../../utils/validationDebugger';
import type { IDETaskValidation } from '../../types/ideTask';
import styles from './ValidationTest.module.css';

const ValidationTest: React.FC = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [result, setResult] = useState<IDETaskValidation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [testType, setTestType] = useState<'return' | 'console' | 'both'>('return');

  const testValidation = async () => {
    try {
      setIsValidating(true);
      setError(null);
      setResult(null);
      setDebugInfo(null);
      
      // Тестовые данные для валидации
      let userCode = '';
      let taskDescription = '';
      
      switch (testType) {
        case 'return':
          userCode = `
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Возвращаем результат
fibonacci(5);
          `;
          taskDescription = 'Напишите функцию для вычисления n-го числа Фибоначчи. Функция должна возвращать число.';
          break;
        case 'console':
          userCode = `
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Выводим в консоль
console.log(fibonacci(5));
          `;
          taskDescription = 'Напишите функцию для вычисления n-го числа Фибоначчи. Выведите результат в консоль.';
          break;
        case 'both':
          userCode = `
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// И возвращаем, и выводим
const result = fibonacci(5);
console.log(result);
result;
          `;
          taskDescription = 'Напишите функцию для вычисления n-го числа Фибоначчи. И верните результат, и выведите в консоль.';
          break;
      }

      const testData = {
        taskId: 'test-task-123',
        userCode,
        taskDescription,
        testCases: [
          {
            input: '5',
            expectedOutput: '5',
            description: 'fibonacci(5) должно возвращать 5'
          },
          {
            input: '10',
            expectedOutput: '55',
            description: 'fibonacci(10) должно возвращать 55'
          }
        ]
      };

      // Валидация входных данных
      const taskErrors = validateTaskData(testData.taskId, testData.userCode, testData.taskDescription);
      const testErrors = validateTestCases(testData.testCases);
      
      if (taskErrors.length > 0 || testErrors.length > 0) {
        const allErrors = [...taskErrors, ...testErrors];
        setError(`Ошибки валидации данных: ${allErrors.join(', ')}`);
        return;
      }

      console.log('🔍 Начинаем отладку валидации...');
      
      const debugResult = await debugValidation(
        testData.taskId,
        testData.userCode,
        testData.taskDescription,
        testData.testCases
      );

      setDebugInfo(debugResult);

      if (debugResult.success && debugResult.validation) {
        setResult(debugResult.validation);
      } else {
        setError(debugResult.error || 'Неизвестная ошибка валидации');
      }
    } catch (err: any) {
      console.error('Критическая ошибка:', err);
      setError(`Критическая ошибка: ${err.message || 'Неизвестная ошибка'}`);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className={styles.container}>
      <h3>Тест валидации IDE задач</h3>
      
      <div className={styles.testOptions}>
        <label className={styles.optionLabel}>
          <input
            type="radio"
            name="testType"
            value="return"
            checked={testType === 'return'}
            onChange={(e) => setTestType(e.target.value as 'return' | 'console' | 'both')}
          />
          Только возврат значения
        </label>
        <label className={styles.optionLabel}>
          <input
            type="radio"
            name="testType"
            value="console"
            checked={testType === 'console'}
            onChange={(e) => setTestType(e.target.value as 'return' | 'console' | 'both')}
          />
          Только console.log
        </label>
        <label className={styles.optionLabel}>
          <input
            type="radio"
            name="testType"
            value="both"
            checked={testType === 'both'}
            onChange={(e) => setTestType(e.target.value as 'return' | 'console' | 'both')}
          />
          И возврат, и console.log
        </label>
      </div>
      
      <button 
        onClick={testValidation}
        disabled={isValidating}
        className={styles.testButton}
      >
        {isValidating ? 'Тестирую...' : 'Запустить тест валидации'}
      </button>

      {error && (
        <div className={styles.error}>
          <h4>Ошибка:</h4>
          <p>{error}</p>
        </div>
      )}

      {debugInfo && (
        <div className={styles.debugInfo}>
          <h4>Отладочная информация:</h4>
          <div className={styles.debugItem}>
            <strong>Успешно:</strong> {debugInfo.success ? 'Да' : 'Нет'}
          </div>
          {debugInfo.error && (
            <div className={styles.debugItem}>
              <strong>Ошибка:</strong> {debugInfo.error}
            </div>
          )}
          {debugInfo.requestData && (
            <div className={styles.debugItem}>
              <strong>Отправленный код:</strong>
              <pre className={styles.codeBlock}>
                {debugInfo.requestData.userCode}
              </pre>
            </div>
          )}
          {debugInfo.requestData && (
            <div className={styles.debugItem}>
              <strong>Описание задачи:</strong>
              <p>{debugInfo.requestData.taskDescription}</p>
            </div>
          )}
          {debugInfo.requestData && (
            <div className={styles.debugItem}>
              <strong>Тестовые случаи:</strong>
              <pre className={styles.codeBlock}>
                {JSON.stringify(debugInfo.requestData.testCases, null, 2)}
              </pre>
            </div>
          )}
          {debugInfo.responseData && (
            <div className={styles.debugItem}>
              <strong>Ответ сервера:</strong>
              <pre className={styles.codeBlock}>
                {JSON.stringify(debugInfo.responseData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {result && (
        <div className={styles.result}>
          <h4>Результат валидации:</h4>
          <div className={styles.resultItem}>
            <strong>Правильно:</strong> {result.isCorrect ? 'Да' : 'Нет'}
          </div>
          <div className={styles.resultItem}>
            <strong>Пройдено тестов:</strong> {result.passedTests}/{result.totalTests}
          </div>
          
          {result.testResults && result.testResults.length > 0 && (
            <div className={styles.testResults}>
              <h5>Детали тестов:</h5>
              {result.testResults.map((test, index) => (
                <div key={index} className={`${styles.testItem} ${test.passed ? styles.passed : styles.failed}`}>
                  <div className={styles.testStatus}>
                    {test.passed ? '✅' : '❌'}
                  </div>
                  <div className={styles.testInfo}>
                    <div><strong>Тест {index + 1}:</strong> {test.testCase.description}</div>
                    <div><strong>Вход:</strong> {test.testCase.input}</div>
                    <div><strong>Ожидалось:</strong> {test.testCase.expectedOutput}</div>
                    {test.actualOutput && (
                      <div><strong>Получено:</strong> {test.actualOutput}</div>
                    )}
                    {test.errorMessage && (
                      <div><strong>Ошибка:</strong> {test.errorMessage}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {result.errorMessage && (
            <div className={styles.errorMessage}>
              <strong>Сообщение об ошибке:</strong> {result.errorMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ValidationTest;
