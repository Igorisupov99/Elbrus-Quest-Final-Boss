const yandexAxios = require('./axios.instance');
const systemPrompts = require('../config/system.prompt.config.json');
const vm = require('vm');

class MessageManager {
  constructor() {
    this.conversations = new Map(); // Хранилище диалогов по userId
    this.totalTokens = 0;
    this.tokenLimit = 300000; // в день
  }

  async sendMessage(userId, message, role = 'assistant', context = '') {
    try {
      // Проверяем лимит токенов
      if (this.totalTokens > this.tokenLimit) {
        throw new Error('Превышен дневной лимит токенов');
      }

      // Проверяем, что вопрос связан с программированием
      if (!this.isProgrammingRelated(message)) {
        return {
          message: "Извините, я могу отвечать только на вопросы по программированию, разработке ПО и IT-технологиям. Задайте вопрос о JavaScript, React, TypeScript, Node.js, HTML, CSS, SQL, Git, алгоритмах, базах данных или других IT-темах.",
          usage: { totalTokens: 0 },
          modelVersion: "restricted"
        };
      }

      // Получаем или создаем диалог для пользователя
      if (!this.conversations.has(userId)) {
        this.conversations.set(userId, []);
      }

      const conversation = this.conversations.get(userId);
      
      // Добавляем системный промпт если диалог пустой
      if (conversation.length === 0) {
        conversation.push({
          role: 'system',
          text: systemPrompts[role] || systemPrompts.assistant
        });
      }

      // Добавляем контекст если есть
      if (context) {
        conversation.push({
          role: 'system',
          text: `Контекст: ${context}`
        });
      }

      // Добавляем сообщение пользователя
      conversation.push({
        role: 'user',
        text: message
      });

      // Отправляем запрос к Yandex GPT
      const response = await yandexAxios.post('', {
        modelUri: `gpt://${process.env.YANDEX_CATALOGUE_ID}/yandexgpt/latest`,
        completionOptions: {
          stream: false,
          temperature: 0.6,
          maxTokens: 200
        },
        messages: conversation.map(msg => ({
          role: msg.role === 'system' ? 'system' : msg.role,
          text: msg.text
        }))
      });

      const aiResponse = response.data.result.alternatives[0].message.text;
      
      // Добавляем ответ AI в диалог
      conversation.push({
        role: 'assistant',
        text: aiResponse
      });

      // Обновляем счетчик токенов
      this.totalTokens += parseInt(response.data.result.usage.totalTokens);

      return {
        message: aiResponse,
        usage: response.data.result.usage,
        modelVersion: response.data.result.modelVersion
      };

    } catch (error) {
      console.error('Yandex GPT Error:', error.response?.data || error.message);
      throw new Error('AI-сервис временно недоступен');
    }
  }

  async generateQuestion(topic, difficulty = 'medium') {
    try {
      const prompt = `Создай вопрос по теме "${topic}" уровня ${difficulty} для образовательной игры по программированию.
      
Формат ответа:
ВОПРОС: [текст вопроса]
ОТВЕТ: [правильный ответ]
ПОДСКАЗКА: [краткая подсказка]`;

      const response = await this.sendMessage('system', prompt, 'question_generator');
      return this.parseQuestion(response.message);

    } catch (error) {
      console.error('Question Generation Error:', error);
      throw new Error('Не удалось сгенерировать вопрос');
    }
  }

  async checkAnswer(userAnswer, correctAnswer, question) {
    try {
      const prompt = `Проверь правильность ответа:
      
Вопрос: ${question}
Правильный ответ: ${correctAnswer}
Ответ пользователя: ${userAnswer}

Ответь только: CORRECT, INCORRECT или PARTIAL`;

      const response = await this.sendMessage('system', prompt, 'answer_checker');
      return response.message.trim().toUpperCase();

    } catch (error) {
      console.error('Answer Check Error:', error);
      return 'INCORRECT';
    }
  }

  parseQuestion(text) {
    const lines = text.split('\n');
    const question = lines.find(line => line.startsWith('ВОПРОС:'))?.replace('ВОПРОС:', '').trim();
    const answer = lines.find(line => line.startsWith('ОТВЕТ:'))?.replace('ОТВЕТ:', '').trim();
    const hint = lines.find(line => line.startsWith('ПОДСКАЗКА:'))?.replace('ПОДСКАЗКА:', '').trim();
    
    return { question, answer, hint };
  }

  clearConversation(userId) {
    this.conversations.delete(userId);
  }

  getConversationHistory(userId) {
    return this.conversations.get(userId) || [];
  }

  getTokenUsage() {
    return {
      totalTokens: this.totalTokens,
      tokenLimit: this.tokenLimit,
      remainingTokens: this.tokenLimit - this.totalTokens
    };
  }

  resetTokenCounter() {
    this.totalTokens = 0;
  }

  // Генерация тестовых случаев на основе описания задачи
  generateTestCasesFromDescription(description, language, userCode = '') {
    const lowerDesc = description.toLowerCase();
    
    // Анализируем код пользователя, чтобы понять количество параметров
    let paramCount = 0;
    if (userCode) {
      const functionMatches = userCode.match(/function\s+(\w+)\s*\([^)]*\)/g) || 
                             userCode.match(/(?:const|let|var)\s+(\w+)\s*=\s*\([^)]*\)/g);
      if (functionMatches && functionMatches.length > 0) {
        const params = functionMatches[0].match(/\(([^)]*)\)/)[1].trim();
        paramCount = params ? params.split(',').length : 0;
      }
    }
    
    // Для задач с числами
    if (lowerDesc.includes('максимальн') || lowerDesc.includes('максимум') || lowerDesc.includes('наибольш')) {
      // Проверяем, работает ли с массивом или отдельными аргументами
      if (lowerDesc.includes('массив') || lowerDesc.includes('array') || lowerDesc.includes('элемент')) {
        return [
          { input: [1, 2, 3], expectedOutput: 3, description: 'Максимум из массива [1, 2, 3]' },
          { input: [10, 5, 8], expectedOutput: 10, description: 'Максимум из массива [10, 5, 8]' },
          { input: [-1, -5, -3], expectedOutput: -1, description: 'Максимум из массива отрицательных чисел' },
          { input: [0, 0, 0], expectedOutput: 0, description: 'Максимум из массива нулей' }
        ];
      } else {
        return [
          { input: [1, 2, 3], expectedOutput: 3, description: 'Максимум из 1, 2, 3' },
          { input: [10, 5, 8], expectedOutput: 10, description: 'Максимум из 10, 5, 8' },
          { input: [-1, -5, -3], expectedOutput: -1, description: 'Максимум из отрицательных чисел' },
          { input: [0, 0, 0], expectedOutput: 0, description: 'Максимум из нулей' }
        ];
      }
    }
    
    if (lowerDesc.includes('минимальн') || lowerDesc.includes('минимум') || lowerDesc.includes('наименьш')) {
      return [
        { input: [1, 2, 3], expectedOutput: 1, description: 'Минимум из 1, 2, 3' },
        { input: [10, 5, 8], expectedOutput: 5, description: 'Минимум из 10, 5, 8' },
        { input: [-1, -5, -3], expectedOutput: -5, description: 'Минимум из отрицательных чисел' }
      ];
    }
    
    if (lowerDesc.includes('сумм') || lowerDesc.includes('сложить')) {
      // Проверяем, работает ли с массивом или отдельными аргументами
      if (lowerDesc.includes('массив') || lowerDesc.includes('array') || lowerDesc.includes('элемент') || paramCount === 1) {
        return [
          { input: [1, 2, 3], expectedOutput: 6, description: 'Сумма массива [1, 2, 3]' },
          { input: [10, 20, 30], expectedOutput: 60, description: 'Сумма массива [10, 20, 30]' },
          { input: [-1, 1, 0], expectedOutput: 0, description: 'Сумма массива [-1, 1, 0]' }
        ];
      } else if (paramCount === 2) {
        return [
          { input: [5, 3], expectedOutput: 8, description: 'Сумма 5 + 3' },
          { input: [10, 20], expectedOutput: 30, description: 'Сумма 10 + 20' },
          { input: [-5, 5], expectedOutput: 0, description: 'Сумма -5 + 5' }
        ];
      } else if (paramCount === 3) {
        return [
          { input: [1, 2, 3], expectedOutput: 6, description: 'Сумма 1 + 2 + 3' },
          { input: [10, 20, 30], expectedOutput: 60, description: 'Сумма 10 + 20 + 30' },
          { input: [-1, 1, 0], expectedOutput: 0, description: 'Сумма -1 + 1 + 0' }
        ];
      } else {
        return [
          { input: [5, 3], expectedOutput: 8, description: 'Сумма 5 + 3' },
          { input: [10, 20], expectedOutput: 30, description: 'Сумма 10 + 20' },
          { input: [-5, 5], expectedOutput: 0, description: 'Сумма -5 + 5' }
        ];
      }
    }
    
    if (lowerDesc.includes('факториал')) {
      return [
        { input: 5, expectedOutput: 120, description: 'Факториал 5' },
        { input: 3, expectedOutput: 6, description: 'Факториал 3' },
        { input: 0, expectedOutput: 1, description: 'Факториал 0' }
      ];
    }
    
    if (lowerDesc.includes('фибоначчи')) {
      return [
        { input: 5, expectedOutput: 5, description: '5-е число Фибоначчи' },
        { input: 8, expectedOutput: 21, description: '8-е число Фибоначчи' },
        { input: 1, expectedOutput: 1, description: '1-е число Фибоначчи' }
      ];
    }
    
    if (lowerDesc.includes('прост') || lowerDesc.includes('prime')) {
      return [
        { input: 7, expectedOutput: true, description: '7 - простое число' },
        { input: 4, expectedOutput: false, description: '4 - не простое число' },
        { input: 2, expectedOutput: true, description: '2 - простое число' }
      ];
    }
    
    if (lowerDesc.includes('палиндром')) {
      return [
        { input: 'racecar', expectedOutput: true, description: 'racecar - палиндром' },
        { input: 'hello', expectedOutput: false, description: 'hello - не палиндром' },
        { input: 'level', expectedOutput: true, description: 'level - палиндром' }
      ];
    }
    
    if (lowerDesc.includes('сортировк') || lowerDesc.includes('sort')) {
      return [
        { input: [3, 1, 4, 1, 5], expectedOutput: [1, 1, 3, 4, 5], description: 'Сортировка [3, 1, 4, 1, 5]' },
        { input: [5, 2, 8, 1], expectedOutput: [1, 2, 5, 8], description: 'Сортировка [5, 2, 8, 1]' },
        { input: [1], expectedOutput: [1], description: 'Сортировка одного элемента' }
      ];
    }
    
    // Дефолтные тестовые случаи
    return [
      { input: 'test', expectedOutput: 'result', description: 'Тестовый случай' },
      { input: 42, expectedOutput: 42, description: 'Числовой тест' },
      { input: true, expectedOutput: true, description: 'Булевый тест' }
    ];
  }

  // Сравнение результатов тестирования
  compareResults(actual, expected) {
    // Если типы разные, сразу false
    if (typeof actual !== typeof expected) {
      return false;
    }

    // Для примитивных типов
    if (actual === expected) {
      return true;
    }

    // Для чисел (учитываем NaN и Infinity)
    if (typeof actual === 'number' && typeof expected === 'number') {
      if (isNaN(actual) && isNaN(expected)) return true;
      if (actual === Infinity && expected === Infinity) return true;
      if (actual === -Infinity && expected === -Infinity) return true;
      return Math.abs(actual - expected) < Number.EPSILON;
    }

    // Для массивов
    if (Array.isArray(actual) && Array.isArray(expected)) {
      if (actual.length !== expected.length) return false;
      return actual.every((item, index) => this.compareResults(item, expected[index]));
    }

    // Для объектов
    if (typeof actual === 'object' && actual !== null && expected !== null) {
      const actualKeys = Object.keys(actual);
      const expectedKeys = Object.keys(expected);
      
      if (actualKeys.length !== expectedKeys.length) return false;
      
      return actualKeys.every(key => 
        expectedKeys.includes(key) && 
        this.compareResults(actual[key], expected[key])
      );
    }

    // Для строк - нормализуем пробелы и регистр
    if (typeof actual === 'string' && typeof expected === 'string') {
      return actual.trim() === expected.trim();
    }

    // Fallback к JSON сравнению
    try {
      return JSON.stringify(actual) === JSON.stringify(expected);
    } catch (e) {
      return false;
    }
  }

  // Прямая отправка сообщения без валидации (для системных запросов)
  async sendMessageDirect(userId, message, role = 'assistant', context = '') {
    try {
      // Проверяем лимит токенов
      if (this.totalTokens > this.tokenLimit) {
        throw new Error('Превышен дневной лимит токенов');
      }

      // Получаем или создаем диалог для пользователя
      if (!this.conversations.has(userId)) {
        this.conversations.set(userId, []);
      }

      const conversation = this.conversations.get(userId);
      
      // Добавляем системный промпт если диалог пустой
      if (conversation.length === 0) {
        conversation.push({
          role: 'system',
          text: systemPrompts[role] || systemPrompts.assistant
        });
      }

      // Добавляем контекст если есть
      if (context) {
        conversation.push({
          role: 'system',
          text: `Контекст: ${context}`
        });
      }

      // Добавляем сообщение пользователя
      conversation.push({
        role: 'user',
        text: message
      });

      // Отправляем запрос к Yandex GPT
      const response = await yandexAxios.post('', {
        modelUri: `gpt://${process.env.YANDEX_CATALOGUE_ID}/yandexgpt/latest`,
        completionOptions: {
          stream: false,
          temperature: 0.6,
          maxTokens: 200
        },
        messages: conversation.map(msg => ({
          role: msg.role === 'system' ? 'system' : msg.role,
          text: msg.text
        }))
      });

      const aiResponse = response.data.result.alternatives[0].message.text;
      
      // Добавляем ответ AI в диалог
      conversation.push({
        role: 'assistant',
        text: aiResponse
      });

      // Обновляем счетчик токенов
      this.totalTokens += parseInt(response.data.result.usage.totalTokens);

      return {
        message: aiResponse,
        usage: response.data.result.usage,
        modelVersion: response.data.result.modelVersion
      };

    } catch (error) {
      console.error('Yandex GPT Direct Error:', error.response?.data || error.message);
      throw new Error('AI-сервис временно недоступен');
    }
  }

  // Генерация IDE задачи
  async generateIDETask(language, difficulty, topic) {
    try {
      const prompt = `Создай задачу для IDE по программированию:
      
Язык: ${language}
Сложность: ${difficulty}
Тема: ${topic}

Формат ответа:
ЗАГОЛОВОК: [название задачи]
ОПИСАНИЕ: [подробное описание задачи]
НАЧАЛЬНЫЙ_КОД: [код-заготовка для пользователя]
ОЖИДАЕМЫЙ_РЕЗУЛЬТАТ: [что должен получить пользователь]
ТЕСТ_КЕЙСЫ: [{"input": [1,2,3], "expectedOutput": 6, "description": "Тест 1"}, {"input": [4,5,6], "expectedOutput": 15, "description": "Тест 2"}]

ВАЖНО: ТЕСТ_КЕЙСЫ должен быть валидным JSON массивом с объектами, содержащими поля input, expectedOutput и description.`;

      const response = await this.sendMessageDirect('system', prompt, 'question_generator');
      return this.parseIDETask(response.message, language, difficulty, topic, '');

    } catch (error) {
      console.error('IDE Task Generation Error:', error);
      throw new Error('Не удалось сгенерировать IDE задачу');
    }
  }

  // Валидация кода пользователя
  async validateIDECode(taskId, userCode, taskDescription, testCases) {
    try {
      console.log('=== НАЧАЛО ВАЛИДАЦИИ КОДА ===');
      console.log('Код пользователя:', userCode);
      console.log('Тестовые случаи:', JSON.stringify(testCases, null, 2));
      
      // Выполняем код и проверяем результаты
      const results = await this.executeUserCode(userCode, testCases);
      
      console.log('Результаты валидации:', results);
      console.log('=== КОНЕЦ ВАЛИДАЦИИ КОДА ===');
      
      return {
        isCorrect: results.passedTests === results.totalTests,
        passedTests: results.passedTests,
        totalTests: results.totalTests,
        testResults: results.testResults,
        errorMessage: results.errorMessage
      };

    } catch (error) {
      console.error('IDE Code Validation Error:', error);
      return {
        isCorrect: false,
        passedTests: 0,
        totalTests: testCases.length,
        testResults: [],
        errorMessage: error.message || 'Ошибка выполнения кода'
      };
    }
  }

  // Выполнение кода пользователя
  async executeUserCode(userCode, testCases) {
    try {
      // Создаем контекст для выполнения кода
      const context = {
        console: {
          log: () => {}, // Отключаем console.log для безопасности
          error: () => {}
        }
      };

      // Выполняем код пользователя в контексте
      vm.createContext(context);
      vm.runInContext(userCode, context, { timeout: 5000 });

      // Ищем функции в коде (поддерживаем разные форматы)
      let functionName = null;
      
      // Обычные функции: function name()
      const functionMatches = userCode.match(/function\s+(\w+)\s*\(/g);
      if (functionMatches && functionMatches.length > 0) {
        functionName = functionMatches[0].match(/function\s+(\w+)\s*\(/)[1];
      }
      
      // Стрелочные функции: const name = () => или let name = () =>
      if (!functionName) {
        const arrowMatches = userCode.match(/(?:const|let|var)\s+(\w+)\s*=\s*\([^)]*\)\s*=>/g);
        if (arrowMatches && arrowMatches.length > 0) {
          functionName = arrowMatches[0].match(/(?:const|let|var)\s+(\w+)\s*=\s*\([^)]*\)\s*=>/)[1];
        }
      }
      
      // Функциональные выражения: const name = function()
      if (!functionName) {
        const exprMatches = userCode.match(/(?:const|let|var)\s+(\w+)\s*=\s*function/g);
        if (exprMatches && exprMatches.length > 0) {
          functionName = exprMatches[0].match(/(?:const|let|var)\s+(\w+)\s*=\s*function/)[1];
        }
      }
      
      if (!functionName) {
        return {
          passedTests: 0,
          totalTests: testCases.length,
          testResults: [],
          errorMessage: 'Функция не найдена в коде. Поддерживаются: function name(), const name = () =>, const name = function()'
        };
      }
      
      // Проверяем, что функция существует в контексте
      if (typeof context[functionName] !== 'function') {
        return {
          passedTests: 0,
          totalTests: testCases.length,
          testResults: [],
          errorMessage: `Функция ${functionName} не найдена или не является функцией`
        };
      }
      
      // Выполняем тесты
      const testResults = [];
      let passedTests = 0;

      for (const testCase of testCases) {
        try {
          // Выполняем функцию с тестовыми данными
          let result;
          
          // Анализируем сигнатуру функции, чтобы понять, как передавать аргументы
          const functionCode = userCode.match(new RegExp(`function\\s+${functionName}\\s*\\([^)]*\\)`)) || 
                              userCode.match(new RegExp(`(?:const|let|var)\\s+${functionName}\\s*=\\s*\\([^)]*\\)`));
          
          if (functionCode) {
            const params = functionCode[0].match(/\(([^)]*)\)/)[1].trim();
            const paramCount = params ? params.split(',').length : 0;
            
            console.log(`Функция ${functionName} принимает ${paramCount} параметров: ${params}`);
            
            // Если функция принимает один параметр и вход - массив, передаем массив как есть
            if (paramCount === 1 && Array.isArray(testCase.input)) {
              result = context[functionName](testCase.input);
            }
            // Если функция принимает несколько параметров и вход - массив, используем spread
            else if (paramCount > 1 && Array.isArray(testCase.input)) {
              result = context[functionName](...testCase.input);
            }
            // Иначе передаем как есть
            else {
              result = context[functionName](testCase.input);
            }
          } else {
            // Fallback: если не можем определить сигнатуру, пробуем оба варианта
            if (Array.isArray(testCase.input)) {
              try {
                result = context[functionName](testCase.input);
              } catch (e) {
                result = context[functionName](...testCase.input);
              }
            } else {
              result = context[functionName](testCase.input);
            }
          }
          
          const expected = testCase.expectedOutput;
          
          // Логируем для отладки
          console.log(`Тест: вход=${JSON.stringify(testCase.input)}, ожидалось=${JSON.stringify(expected)}, получено=${JSON.stringify(result)}`);
          
          // Улучшенное сравнение результатов
          const passed = this.compareResults(result, expected);
          
          console.log(`Результат сравнения: ${passed ? 'ПРОШЕЛ' : 'НЕ ПРОШЕЛ'}`);
          
          if (passed) passedTests++;

          testResults.push({
            testCase: {
              input: testCase.input,
              expectedOutput: testCase.expectedOutput,
              description: testCase.description || ''
            },
            passed: passed,
            actualOutput: result,
            expectedOutput: expected
          });
        } catch (testError) {
          testResults.push({
            testCase: {
              input: testCase.input,
              expectedOutput: testCase.expectedOutput,
              description: testCase.description || ''
            },
            passed: false,
            actualOutput: null,
            errorMessage: testError.message
          });
        }
      }

      return {
        passedTests: passedTests,
        totalTests: testCases.length,
        testResults: testResults,
        errorMessage: null
      };

    } catch (error) {
      return {
        passedTests: 0,
        totalTests: testCases.length,
        testResults: [],
        errorMessage: error.message
      };
    }
  }

  // Получение решения задачи
  async getIDESolution(taskId, taskDescription) {
    try {
      const prompt = `Дай решение для задачи по программированию:
      
Описание: ${taskDescription}

Покажи правильное решение с комментариями.`;

      const response = await this.sendMessageDirect('system', prompt, 'mentor');
      return {
        solution: response.message
      };

    } catch (error) {
      console.error('IDE Solution Error:', error);
      throw new Error('Не удалось получить решение');
    }
  }

  // Получение подсказки для задачи
  async getIDEHint(taskId, hintIndex, taskDescription, userCode) {
    try {
      const prompt = `Дай подсказку ${hintIndex + 1} для задачи по программированию:
      
Описание: ${taskDescription}
Код пользователя: ${userCode || 'Код не предоставлен'}

Дай полезную подсказку, которая поможет пользователю решить задачу.`;

      const response = await this.sendMessageDirect('system', prompt, 'mentor');
      return {
        hint: response.message
      };

    } catch (error) {
      console.error('IDE Hint Error:', error);
      throw new Error('Не удалось получить подсказку');
    }
  }

  // Парсинг IDE задачи
  parseIDETask(text, language, difficulty, topic, userCode = '') {
    const lines = text.split('\n');
    const title = lines.find(line => line.startsWith('ЗАГОЛОВОК:'))?.replace('ЗАГОЛОВОК:', '').trim() || `Задача по ${topic}`;
    const description = lines.find(line => line.startsWith('ОПИСАНИЕ:'))?.replace('ОПИСАНИЕ:', '').trim() || 'Описание задачи';
    const initialCode = lines.find(line => line.startsWith('НАЧАЛЬНЫЙ_КОД:'))?.replace('НАЧАЛЬНЫЙ_КОД:', '').trim() || '// Начните писать код здесь';
    const expectedOutput = lines.find(line => line.startsWith('ОЖИДАЕМЫЙ_РЕЗУЛЬТАТ:'))?.replace('ОЖИДАЕМЫЙ_РЕЗУЛЬТАТ:', '').trim() || 'Ожидаемый результат';
    
    let testCases = [];
    const testCasesLine = lines.find(line => line.startsWith('ТЕСТ_КЕЙСЫ:'));
    if (testCasesLine) {
      try {
        const testCasesJson = testCasesLine.replace('ТЕСТ_КЕЙСЫ:', '').trim();
        // Проверяем, что JSON не пустой
        if (testCasesJson && testCasesJson !== '') {
          testCases = JSON.parse(testCasesJson);
        } else {
          throw new Error('Empty JSON');
        }
      } catch (e) {
        console.error('Error parsing test cases:', e);
        // Генерируем тестовые случаи на основе описания задачи
        testCases = this.generateTestCasesFromDescription(description, language, userCode);
      }
    }

    // Если тестовые случаи все еще пустые, генерируем их
    if (testCases.length === 0) {
      testCases = this.generateTestCasesFromDescription(description, language, userCode);
    }

    return {
      id: Date.now().toString(),
      title,
      description,
      language,
      difficulty,
      topic,
      initialCode,
      expectedOutput,
      testCases
    };
  }

  // Парсинг результатов валидации
  parseIDEValidation(text, originalTestCases) {
    const lines = text.split('\n');
    const result = lines.find(line => line.startsWith('РЕЗУЛЬТАТ:'))?.replace('РЕЗУЛЬТАТ:', '').trim() || 'INCORRECT';
    const passedTests = parseInt(lines.find(line => line.startsWith('ПРОЙДЕНО_ТЕСТОВ:'))?.replace('ПРОЙДЕНО_ТЕСТОВ:', '').trim() || '0');
    const totalTests = parseInt(lines.find(line => line.startsWith('ВСЕГО_ТЕСТОВ:'))?.replace('ВСЕГО_ТЕСТОВ:', '').trim() || originalTestCases.length);
    const errorMessage = lines.find(line => line.startsWith('ОШИБКА:'))?.replace('ОШИБКА:', '').trim();

    let testResults = [];
    const testDetailsLine = lines.find(line => line.startsWith('ДЕТАЛИ_ТЕСТОВ:'));
    if (testDetailsLine) {
      try {
        const testDetailsJson = testDetailsLine.replace('ДЕТАЛИ_ТЕСТОВ:', '').trim();
        testResults = JSON.parse(testDetailsJson);
      } catch (e) {
        // Создаем базовые результаты тестов
        testResults = originalTestCases.map((testCase, index) => ({
          testCase,
          passed: index < passedTests,
          actualOutput: index < passedTests ? testCase.expectedOutput : 'Неверный результат'
        }));
      }
    }

    return {
      isCorrect: result === 'CORRECT',
      passedTests,
      totalTests,
      testResults,
      errorMessage
    };
  }

  // Проверяет, связан ли вопрос с программированием
  isProgrammingRelated(message) {
    const programmingKeywords = [
      // Языки программирования
      'javascript', 'js', 'typescript', 'ts', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin',
      'html', 'css', 'sql', 'bash', 'shell', 'powershell',
      
      // Фреймворки и библиотеки
      'react', 'vue', 'angular', 'node', 'express', 'next', 'nuxt', 'svelte', 'jquery', 'bootstrap', 'tailwind',
      'django', 'flask', 'spring', 'laravel', 'symfony', 'rails', 'asp.net',
      
      // Технологии и инструменты
      'git', 'github', 'gitlab', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'heroku', 'vercel',
      'webpack', 'vite', 'babel', 'eslint', 'prettier', 'jest', 'cypress', 'selenium',
      'mongodb', 'mysql', 'postgresql', 'redis', 'elasticsearch', 'firebase',
      'api', 'rest', 'graphql', 'websocket', 'jwt', 'oauth', 'cors',
      
      // Концепции программирования
      'алгоритм', 'структура данных', 'массив', 'объект', 'функция', 'класс', 'метод', 'переменная',
      'цикл', 'условие', 'рекурсия', 'паттерн', 'архитектура', 'рефакторинг', 'тестирование',
      'debug', 'отладка', 'ошибка', 'исключение', 'асинхронность', 'промис', 'async', 'await',
      'компонент', 'хук', 'состояние', 'пропс', 'роутинг', 'маршрутизация',
      
      // IT термины
      'программирование', 'разработка', 'код', 'кодинг', 'программист', 'разработчик',
      'frontend', 'backend', 'fullstack', 'devops', 'deployment', 'развертывание',
      'база данных', 'сервер', 'клиент', 'браузер', 'домен', 'хостинг',
      'версионирование', 'коммит', 'ветка', 'мерж', 'пулл реквест', 'pull request',
      'контейнер', 'микросервис', 'монолит', 'scalability', 'масштабируемость',
      
      // Английские термины
      'programming', 'coding', 'development', 'software', 'application', 'app',
      'framework', 'library', 'package', 'module', 'import', 'export',
      'variable', 'function', 'class', 'object', 'array', 'string', 'number',
      'boolean', 'null', 'undefined', 'callback', 'closure', 'scope',
      'inheritance', 'polymorphism', 'encapsulation', 'abstraction',
      'database', 'query', 'table', 'index', 'migration', 'schema',
      'authentication', 'authorization', 'security', 'encryption', 'hashing',
      'performance', 'optimization', 'caching', 'memory', 'cpu', 'bandwidth'
    ];

    const messageLower = message.toLowerCase();
    
    // Проверяем наличие ключевых слов программирования
    const hasProgrammingKeyword = programmingKeywords.some(keyword => 
      messageLower.includes(keyword.toLowerCase())
    );

    // Дополнительные паттерны для вопросов по программированию
    const programmingPatterns = [
      /как\s+(создать|написать|реализовать|использовать|настроить|подключить|установить)/i,
      /что\s+(такое|означает|делает|возвращает)\s+(в\s+)?(javascript|js|typescript|ts|react|node|html|css|git|api|код|программировании|разработке)/i,
      /почему\s+(не\s+работает|ошибка|падает)/i,
      /какой\s+(лучший|правильный|оптимальный)/i,
      /разница\s+между/i,
      /отличия\s+от/i,
      /преимущества\s+и\s+недостатки/i,
      /как\s+работает/i,
      /принцип\s+работы/i,
      /пример\s+кода/i,
      /синтаксис/i,
      /ошибка\s+в\s+коде/i,
      /не\s+компилируется/i,
      /не\s+работает/i,
      /как\s+исправить/i,
      /как\s+оптимизировать/i,
      /лучшие\s+практики/i,
      /best\s+practices/i,
      /code\s+review/i,
      /unit\s+test/i,
      /integration\s+test/i,
      /difference\s+between/i,
      /what\s+is\s+the\s+difference/i,
      /how\s+to\s+(create|write|implement|use|setup|install|configure)/i,
      /what\s+does\s+(it|this|that)\s+(do|mean|return)/i,
      /why\s+(doesn't|does\s+not)\s+(work|compile)/i
    ];

    // Паттерны для исключения непрограммистских вопросов
    const nonProgrammingPatterns = [
      /что\s+такое\s+(любовь|жизнь|счастье|красота|дружба|семья)/i,
      /как\s+(приготовить|готовить|сварить|сделать)\s+(борщ|суп|еду|пищу)/i,
      /как\s+(научиться|играть|танцевать|петь|рисовать)/i,
      /какая\s+(погода|температура)/i,
      /расскажи\s+(анекдот|шутку|историю)/i,
      /как\s+(похудеть|поправиться|заниматься\s+спортом)/i,
      /где\s+(купить|найти|взять)/i,
      /как\s+(ухаживать|заботиться)\s+(за\s+растениями|о\s+животных)/i,
      /расскажи\s+про\s+(историю|политику|экономику|культуру)/i,
      /what\s+is\s+(love|life|happiness|beauty)/i,
      /how\s+to\s+(cook|dance|sing|paint|learn)/i,
      /tell\s+me\s+(a\s+joke|about)/i,
      /what's\s+the\s+weather/i
    ];

    const hasProgrammingPattern = programmingPatterns.some(pattern => 
      pattern.test(message)
    );

    // Проверяем исключающие паттерны (непрограммистские вопросы)
    const hasNonProgrammingPattern = nonProgrammingPatterns.some(pattern => 
      pattern.test(message)
    );

    // Если есть исключающий паттерн, блокируем вопрос
    if (hasNonProgrammingPattern) {
      return false;
    }

    return hasProgrammingKeyword || hasProgrammingPattern;
  }
}

module.exports = new MessageManager();
