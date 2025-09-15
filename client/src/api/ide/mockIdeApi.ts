import type { 
  IDETask, 
  IDETaskValidation, 
  IDETaskGenerationRequest, 
  IDETaskGenerationResponse 
} from '../../types/ideTask';

// Mock данные для тестирования
const mockTasks: IDETask[] = [
  {
    id: '1',
    title: 'Сумма двух чисел',
    description: 'Напишите функцию, которая принимает два числа и возвращает их сумму.',
    language: 'javascript',
    difficulty: 'easy',
    topic: 'JavaScript',
    initialCode: 'function sum(a, b) {\n  // Ваш код здесь\n  return 0;\n}',
    expectedOutput: 'Функция должна возвращать сумму двух чисел',
    testCases: [
      { input: 'sum(2, 3)', expectedOutput: '5', description: 'Сложение положительных чисел' },
      { input: 'sum(-1, 1)', expectedOutput: '0', description: 'Сложение отрицательного и положительного' },
      { input: 'sum(0, 0)', expectedOutput: '0', description: 'Сложение нулей' }
    ],
    hints: [
      'Используйте оператор + для сложения',
      'Просто верните a + b'
    ],
    solution: 'function sum(a, b) {\n  return a + b;\n}'
  },
  {
    id: '4',
    title: 'Сумма двух чисел (TypeScript)',
    description: 'Напишите функцию на TypeScript, которая принимает два числа и возвращает их сумму.',
    language: 'typescript',
    difficulty: 'easy',
    topic: 'TypeScript',
    initialCode: 'function sum(a: number, b: number): number {\n  // Ваш код здесь\n  return 0;\n}',
    expectedOutput: 'Функция должна возвращать сумму двух чисел',
    testCases: [
      { input: 'sum(2, 3)', expectedOutput: '5', description: 'Сложение положительных чисел' },
      { input: 'sum(-1, 1)', expectedOutput: '0', description: 'Сложение отрицательного и положительного' },
      { input: 'sum(0, 0)', expectedOutput: '0', description: 'Сложение нулей' }
    ],
    hints: [
      'Используйте оператор + для сложения',
      'Просто верните a + b'
    ],
    solution: 'function sum(a: number, b: number): number {\n  return a + b;\n}'
  },
  {
    id: '2',
    title: 'Проверка четности',
    description: 'Напишите функцию, которая проверяет, является ли число четным.',
    language: 'javascript',
    difficulty: 'easy',
    topic: 'JavaScript',
    initialCode: 'function isEven(num) {\n  // Ваш код здесь\n  return false;\n}',
    expectedOutput: 'Функция должна возвращать true для четных чисел и false для нечетных',
    testCases: [
      { input: 'isEven(4)', expectedOutput: 'true', description: 'Четное число' },
      { input: 'isEven(7)', expectedOutput: 'false', description: 'Нечетное число' },
      { input: 'isEven(0)', expectedOutput: 'true', description: 'Ноль считается четным' }
    ],
    hints: [
      'Используйте оператор % (остаток от деления)',
      'Четное число имеет остаток 0 при делении на 2'
    ],
    solution: 'function isEven(num) {\n  return num % 2 === 0;\n}'
  },
  {
    id: '3',
    title: 'Поиск максимального элемента',
    description: 'Напишите функцию, которая находит максимальный элемент в массиве чисел.',
    language: 'javascript',
    difficulty: 'medium',
    topic: 'JavaScript',
    initialCode: 'function findMax(numbers) {\n  // Ваш код здесь\n  return 0;\n}',
    expectedOutput: 'Функция должна возвращать максимальное число из массива',
    testCases: [
      { input: 'findMax([1, 5, 3, 9, 2])', expectedOutput: '9', description: 'Массив с разными числами' },
      { input: 'findMax([-1, -5, -3])', expectedOutput: '-1', description: 'Массив с отрицательными числами' },
      { input: 'findMax([42])', expectedOutput: '42', description: 'Массив с одним элементом' }
    ],
    hints: [
      'Используйте цикл для прохода по массиву',
      'Сравнивайте каждый элемент с текущим максимумом',
      'Можно использовать Math.max(...numbers)'
    ],
    solution: 'function findMax(numbers) {\n  return Math.max(...numbers);\n}'
  },
  {
    id: '5',
    title: 'Подсчет символов',
    description: 'Напишите функцию, которая подсчитывает количество определенного символа в строке.',
    language: 'javascript',
    difficulty: 'easy',
    topic: 'JavaScript',
    initialCode: 'function countChar(str, char) {\n  // Ваш код здесь\n  return 0;\n}',
    expectedOutput: 'Функция должна возвращать количество вхождений символа в строку',
    testCases: [
      { input: 'countChar("hello", "l")', expectedOutput: '2', description: 'Подсчет буквы l в hello' },
      { input: 'countChar("javascript", "a")', expectedOutput: '2', description: 'Подсчет буквы a в javascript' },
      { input: 'countChar("test", "x")', expectedOutput: '0', description: 'Символ не найден' }
    ],
    hints: [
      'Используйте цикл для прохода по строке',
      'Сравнивайте каждый символ с искомым',
      'Можно использовать split и filter'
    ],
    solution: 'function countChar(str, char) {\n  return str.split(char).length - 1;\n}'
  },
  {
    id: '6',
    title: 'Обращение строки',
    description: 'Напишите функцию, которая переворачивает строку.',
    language: 'typescript',
    difficulty: 'easy',
    topic: 'TypeScript',
    initialCode: 'function reverseString(str: string): string {\n  // Ваш код здесь\n  return "";\n}',
    expectedOutput: 'Функция должна возвращать перевернутую строку',
    testCases: [
      { input: 'reverseString("hello")', expectedOutput: 'olleh', description: 'Переворот hello' },
      { input: 'reverseString("typescript")', expectedOutput: 'tpircsepyt', description: 'Переворот typescript' },
      { input: 'reverseString("a")', expectedOutput: 'a', description: 'Однобуквенная строка' }
    ],
    hints: [
      'Используйте split для разбиения на массив',
      'Примените reverse для переворота массива',
      'Используйте join для объединения обратно в строку'
    ],
    solution: 'function reverseString(str: string): string {\n  return str.split("").reverse().join("");\n}'
  },
  {
    id: '7',
    title: 'Проверка палиндрома',
    description: 'Напишите функцию, которая проверяет, является ли строка палиндромом.',
    language: 'typescript',
    difficulty: 'medium',
    topic: 'TypeScript',
    initialCode: 'function isPalindrome(str: string): boolean {\n  // Ваш код здесь\n  return false;\n}',
    expectedOutput: 'Функция должна возвращать true для палиндромов и false для остальных',
    testCases: [
      { input: 'isPalindrome("racecar")', expectedOutput: 'true', description: 'Палиндром racecar' },
      { input: 'isPalindrome("hello")', expectedOutput: 'false', description: 'Не палиндром hello' },
      { input: 'isPalindrome("a")', expectedOutput: 'true', description: 'Однобуквенная строка' }
    ],
    hints: [
      'Переверните строку и сравните с оригиналом',
      'Можно использовать функцию reverseString',
      'Учтите регистр букв'
    ],
    solution: 'function isPalindrome(str: string): boolean {\n  const reversed = str.split("").reverse().join("");\n  return str.toLowerCase() === reversed.toLowerCase();\n}'
  },
];

// Хранилище для соответствия новых ID и оригинальных задач
const taskIdMap = new Map<string, string>();

export const mockIdeApi = {
  // Генерация новой IDE задачи
  generateTask: async (request: IDETaskGenerationRequest): Promise<IDETaskGenerationResponse> => {
    // Имитация задержки API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Фильтруем задачи по языку и сложности
    const filteredTasks = mockTasks.filter(task => 
      task.language === request.language && 
      task.difficulty === request.difficulty
    );
    
    if (filteredTasks.length === 0) {
      throw new Error('Задачи с такими параметрами не найдены');
    }
    
    // Возвращаем случайную задачу
    const randomTask = filteredTasks[Math.floor(Math.random() * filteredTasks.length)];
    const newId = Date.now().toString();
    
    // Сохраняем соответствие между новым ID и оригинальным ID задачи
    taskIdMap.set(newId, randomTask.id);
    
    return { task: { ...randomTask, id: newId } };
  },

  // Валидация кода пользователя
  validateCode: async (taskId: string, userCode: string): Promise<IDETaskValidation> => {
    // Имитация задержки API
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Получаем оригинальный ID задачи
    const originalTaskId = taskIdMap.get(taskId) || taskId;
    const task = mockTasks.find(t => t.id === originalTaskId);
    if (!task) {
      throw new Error('Задача не найдена');
    }

    try {
      // Создаем функцию из пользовательского кода
      const userFunction = new Function('return ' + userCode)();
      
      const testResults = task.testCases.map(testCase => {
        try {
          // Извлекаем аргументы из строки теста
          const argsMatch = testCase.input.match(/\(([^)]+)\)/);
          if (!argsMatch) {
            return {
              testCase,
              passed: false,
              errorMessage: 'Неверный формат теста'
            };
          }
          
          const args = argsMatch[1].split(',').map(arg => {
            const trimmed = arg.trim();
            // Парсим числа
            if (!isNaN(Number(trimmed))) {
              return Number(trimmed);
            }
            // Парсим массивы
            if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
              return JSON.parse(trimmed);
            }
            // Парсим строки
            if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
              return trimmed.slice(1, -1);
            }
            return trimmed;
          });
          
          // Выполняем тест
          const result = userFunction(...args);
          const passed = String(result) === testCase.expectedOutput;
          
          return {
            testCase,
            passed,
            actualOutput: String(result)
          };
        } catch (error) {
          return {
            testCase,
            passed: false,
            errorMessage: error instanceof Error ? error.message : 'Неизвестная ошибка'
          };
        }
      });

      const passedTests = testResults.filter(result => result.passed).length;
      const isCorrect = passedTests === testResults.length;

      return {
        isCorrect,
        passedTests,
        totalTests: testResults.length,
        testResults
      };
    } catch (error) {
      return {
        isCorrect: false,
        passedTests: 0,
        totalTests: task.testCases.length,
        testResults: [],
        errorMessage: error instanceof Error ? error.message : 'Ошибка выполнения кода'
      };
    }
  },

  // Получение подсказки для задачи
  getHint: async (taskId: string, hintIndex: number): Promise<{ hint: string }> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Получаем оригинальный ID задачи
    const originalTaskId = taskIdMap.get(taskId) || taskId;
    const task = mockTasks.find(t => t.id === originalTaskId);
    if (!task || !task.hints[hintIndex]) {
      throw new Error('Подсказка не найдена');
    }
    
    return { hint: task.hints[hintIndex] };
  },

  // Получение решения задачи
  getSolution: async (taskId: string): Promise<{ solution: string }> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Получаем оригинальный ID задачи
    const originalTaskId = taskIdMap.get(taskId) || taskId;
    const task = mockTasks.find(t => t.id === originalTaskId);
    if (!task || !task.solution) {
      throw new Error('Решение не найдено');
    }
    
    return { solution: task.solution };
  }
};
