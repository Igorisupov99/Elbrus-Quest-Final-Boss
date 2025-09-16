import React, { useState } from 'react';
import { debugValidation, validateTestCases, validateTaskData } from '../../utils/validationDebugger';
import type { IDETaskValidation } from '../../types/ideTask';
import styles from './ValidationTest.module.css';

const ValidationTest: React.FC = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [result, setResult] = useState<IDETaskValidation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [testType, setTestType] = useState<'return' | 'console' | 'both' | 'unique' | 'string' | 'boolean' | 'object' | 'universal'>('return');

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
        case 'unique':
          userCode = `
function findUnique(arr) {
  // Создаем пустой массив для хранения уникальных элементов
  let uniqueArray = [];

  // Проходим по каждому элементу исходного массива
  for (let i = 0; i < arr.length; i++) {
    // Проверяем, сколько раз текущий элемент встречается в массиве
    if (arr.filter(item => item === arr[i]).length === 1) {
      // Если элемент встречается только один раз, добавляем его в массив уникальных элементов
      uniqueArray.push(arr[i]);
    }
  }

  // Возвращаем массив уникальных элементов
  return uniqueArray;
}

// Возвращаем результат
findUnique([1, 2, 3, 2, 1, 4]);
          `;
          taskDescription = 'Напишите функцию findUnique, которая принимает массив и возвращает массив уникальных элементов (элементов, которые встречаются только один раз).';
          break;
        case 'string':
          userCode = `
function toUpperCase(str) {
  return str.toUpperCase();
}

// Возвращаем результат
toUpperCase('hello');
          `;
          taskDescription = 'Напишите функцию toUpperCase, которая принимает строку и возвращает ее в верхнем регистре.';
          break;
        case 'boolean':
          userCode = `
function isEven(num) {
  return num % 2 === 0;
}

// Возвращаем результат
isEven(4);
          `;
          taskDescription = 'Напишите функцию isEven, которая принимает число и возвращает true, если число четное, и false, если нечетное.';
          break;
        case 'object':
          userCode = `
function getKeys(obj) {
  return Object.keys(obj);
}

// Возвращаем результат
getKeys({a: 1, b: 2, c: 3});
          `;
          taskDescription = 'Напишите функцию getKeys, которая принимает объект и возвращает массив его ключей.';
          break;
        case 'universal':
          userCode = `
function processData(input) {
  // Универсальная функция, которая обрабатывает разные типы данных
  if (Array.isArray(input)) {
    return input.length;
  } else if (typeof input === 'string') {
    return input.length;
  } else if (typeof input === 'number') {
    return input * 2;
  } else if (typeof input === 'boolean') {
    return !input;
  } else if (typeof input === 'object' && input !== null) {
    return Object.keys(input).length;
  }
  return input;
}

// Возвращаем результат
processData([1, 2, 3]);
          `;
          taskDescription = 'Напишите универсальную функцию processData, которая обрабатывает разные типы данных: для массивов возвращает длину, для строк - длину, для чисел - удвоенное значение, для булевых - инвертированное значение, для объектов - количество ключей.';
          break;
      }

      let testCases = [];
      
      if (testType === 'unique') {
        testCases = [
          {
            input: [1, 2, 3, 2, 1, 4],
            expectedOutput: [3, 4],
            description: 'Уникальные элементы из [1, 2, 3, 2, 1, 4]'
          },
          {
            input: [1, 2, 3, 4, 5],
            expectedOutput: [1, 2, 3, 4, 5],
            description: 'Все элементы уникальны'
          },
          {
            input: [1, 1, 1, 1],
            expectedOutput: [],
            description: 'Все элементы одинаковые'
          }
        ];
      } else if (testType === 'string') {
        testCases = [
          {
            input: 'hello',
            expectedOutput: 'HELLO',
            description: 'Преобразование hello в верхний регистр'
          },
          {
            input: 'world',
            expectedOutput: 'WORLD',
            description: 'Преобразование world в верхний регистр'
          },
          {
            input: '',
            expectedOutput: '',
            description: 'Пустая строка'
          }
        ];
      } else if (testType === 'boolean') {
        testCases = [
          {
            input: 4,
            expectedOutput: true,
            description: '4 - четное число'
          },
          {
            input: 7,
            expectedOutput: false,
            description: '7 - нечетное число'
          },
          {
            input: 0,
            expectedOutput: true,
            description: '0 - четное число'
          }
        ];
      } else if (testType === 'object') {
        testCases = [
          {
            input: {a: 1, b: 2, c: 3},
            expectedOutput: ['a', 'b', 'c'],
            description: 'Ключи объекта {a: 1, b: 2, c: 3}'
          },
          {
            input: {x: 10, y: 20},
            expectedOutput: ['x', 'y'],
            description: 'Ключи объекта {x: 10, y: 20}'
          },
          {
            input: {},
            expectedOutput: [],
            description: 'Пустой объект'
          }
        ];
      } else if (testType === 'universal') {
        testCases = [
          {
            input: [1, 2, 3],
            expectedOutput: 3,
            description: 'Массив [1, 2, 3] - длина 3'
          },
          {
            input: 'hello',
            expectedOutput: 5,
            description: 'Строка hello - длина 5'
          },
          {
            input: 5,
            expectedOutput: 10,
            description: 'Число 5 - удвоенное значение 10'
          },
          {
            input: true,
            expectedOutput: false,
            description: 'Булево true - инвертированное false'
          },
          {
            input: {a: 1, b: 2},
            expectedOutput: 2,
            description: 'Объект {a: 1, b: 2} - количество ключей 2'
          }
        ];
      } else {
        testCases = [
          {
            input: 5,
            expectedOutput: 5,
            description: 'fibonacci(5) должно возвращать 5'
          },
          {
            input: 10,
            expectedOutput: 55,
            description: 'fibonacci(10) должно возвращать 55'
          }
        ];
      }

      const testData = {
        taskId: 'test-task-123',
        userCode,
        taskDescription,
        testCases
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
            onChange={(e) => setTestType(e.target.value as 'return' | 'console' | 'both' | 'unique' | 'string' | 'boolean' | 'object' | 'universal')}
          />
          Только возврат значения
        </label>
        <label className={styles.optionLabel}>
          <input
            type="radio"
            name="testType"
            value="console"
            checked={testType === 'console'}
            onChange={(e) => setTestType(e.target.value as 'return' | 'console' | 'both' | 'unique' | 'string' | 'boolean' | 'object' | 'universal')}
          />
          Только console.log
        </label>
        <label className={styles.optionLabel}>
          <input
            type="radio"
            name="testType"
            value="both"
            checked={testType === 'both'}
            onChange={(e) => setTestType(e.target.value as 'return' | 'console' | 'both' | 'unique' | 'string' | 'boolean' | 'object' | 'universal')}
          />
          И возврат, и console.log
        </label>
        <label className={styles.optionLabel}>
          <input
            type="radio"
            name="testType"
            value="unique"
            checked={testType === 'unique'}
            onChange={(e) => setTestType(e.target.value as 'return' | 'console' | 'both' | 'unique' | 'string' | 'boolean' | 'object' | 'universal')}
          />
          Функция findUnique (массивы)
        </label>
        <label className={styles.optionLabel}>
          <input
            type="radio"
            name="testType"
            value="string"
            checked={testType === 'string'}
            onChange={(e) => setTestType(e.target.value as 'return' | 'console' | 'both' | 'unique' | 'string' | 'boolean' | 'object' | 'universal')}
          />
          Строковые функции
        </label>
        <label className={styles.optionLabel}>
          <input
            type="radio"
            name="testType"
            value="boolean"
            checked={testType === 'boolean'}
            onChange={(e) => setTestType(e.target.value as 'return' | 'console' | 'both' | 'unique' | 'string' | 'boolean' | 'object' | 'universal')}
          />
          Булевы функции
        </label>
        <label className={styles.optionLabel}>
          <input
            type="radio"
            name="testType"
            value="object"
            checked={testType === 'object'}
            onChange={(e) => setTestType(e.target.value as 'return' | 'console' | 'both' | 'unique' | 'string' | 'boolean' | 'object' | 'universal')}
          />
          Функции с объектами
        </label>
        <label className={styles.optionLabel}>
          <input
            type="radio"
            name="testType"
            value="universal"
            checked={testType === 'universal'}
            onChange={(e) => setTestType(e.target.value as 'return' | 'console' | 'both' | 'unique' | 'string' | 'boolean' | 'object' | 'universal')}
          />
          Универсальные функции
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
