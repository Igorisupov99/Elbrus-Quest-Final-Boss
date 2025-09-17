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
      const prompt = `Создай теоретический вопрос по теме "${topic}" уровня ${difficulty} для образовательной игры по программированию.

ВАЖНО: 
- Вопрос должен быть ТЕОРЕТИЧЕСКИМ, без требования написания кода
- Фокус на понимании концепций, принципов, определений
- Избегай вопросов типа "напишите функцию", "создайте код", "реализуйте"
- Вместо этого задавай вопросы о том, как что-то работает, что означает, в чем разница

Примеры хороших вопросов:
- "Что такое замыкание в JavaScript?"
- "В чем разница между let и var?"
- "Как работает event loop в Node.js?"
- "Что такое REST API?"

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

  // Улучшенная генерация тестовых случаев на основе описания задачи
  generateTestCasesFromDescription(description, language, userCode = '') {
    const lowerDesc = description.toLowerCase();
    
    // Анализируем код пользователя, чтобы понять количество параметров
    const functionInfo = this.findFunctionInCode(userCode);
    const paramCount = functionInfo ? functionInfo.paramCount : 0;
    
    // Для задач с числами
    if (lowerDesc.includes('максимальн') || lowerDesc.includes('максимум') || lowerDesc.includes('наибольш')) {
      return this.generateMaxMinTestCases('max', paramCount);
    }
    
    if (lowerDesc.includes('минимальн') || lowerDesc.includes('минимум') || lowerDesc.includes('наименьш')) {
      return this.generateMaxMinTestCases('min', paramCount);
    }
    
    if (lowerDesc.includes('сумм') || lowerDesc.includes('сложить')) {
      return this.generateSumTestCases(paramCount);
    }
    
    if (lowerDesc.includes('факториал')) {
      return this.generateFactorialTestCases();
    }
    
    if (lowerDesc.includes('фибоначчи')) {
      return this.generateFibonacciTestCases();
    }
    
    if (lowerDesc.includes('прост') || lowerDesc.includes('prime')) {
      return this.generatePrimeTestCases();
    }
    
    if (lowerDesc.includes('палиндром')) {
      return this.generatePalindromeTestCases();
    }
    
    if (lowerDesc.includes('сортировк') || lowerDesc.includes('sort')) {
      return this.generateSortTestCases();
    }
    
    if (lowerDesc.includes('фильтр') || lowerDesc.includes('filter') || 
        lowerDesc.includes('отфильтровать') || lowerDesc.includes('предикат')) {
      return this.generateFilterTestCases();
    }
    
    if (lowerDesc.includes('уникальн') || lowerDesc.includes('unique') || 
        lowerDesc.includes('неповторяющ') || lowerDesc.includes('distinct') ||
        lowerDesc.includes('дубликат') || lowerDesc.includes('duplicate')) {
      return this.generateUniqueTestCases();
    }
    
    if (lowerDesc.includes('строк') || lowerDesc.includes('string') || 
        lowerDesc.includes('текст') || lowerDesc.includes('символ') ||
        lowerDesc.includes('букв') || lowerDesc.includes('слово')) {
      return this.generateStringTestCases();
    }
    
    if (lowerDesc.includes('четн') || lowerDesc.includes('нечетн') || 
        lowerDesc.includes('even') || lowerDesc.includes('odd') ||
        lowerDesc.includes('делится') || lowerDesc.includes('кратн')) {
      return this.generateEvenOddTestCases();
    }
    
    if (lowerDesc.includes('объект') || lowerDesc.includes('object') || 
        lowerDesc.includes('ключ') || lowerDesc.includes('значение') ||
        lowerDesc.includes('свойств') || lowerDesc.includes('property')) {
      return this.generateObjectTestCases();
    }
    
    if (lowerDesc.includes('карта') || lowerDesc.includes('map') || 
        lowerDesc.includes('преобразовать') || lowerDesc.includes('трансформировать')) {
      return this.generateMapTestCases();
    }
    
    if (lowerDesc.includes('редукц') || lowerDesc.includes('reduce') || 
        lowerDesc.includes('свертк') || lowerDesc.includes('аккумулятор')) {
      return this.generateReduceTestCases();
    }
    
    if (lowerDesc.includes('обратн') || lowerDesc.includes('reverse') || 
        lowerDesc.includes('переверн') || lowerDesc.includes('разверн')) {
      return this.generateReverseTestCases();
    }
    
    if (lowerDesc.includes('подсчет') || lowerDesc.includes('количество') || 
        lowerDesc.includes('count') || lowerDesc.includes('размер') ||
        lowerDesc.includes('длина') || lowerDesc.includes('length')) {
      return this.generateCountTestCases();
    }
    
    if (lowerDesc.includes('пуст') || lowerDesc.includes('empty') || 
        lowerDesc.includes('провер') || lowerDesc.includes('check')) {
      return this.generateEmptyTestCases();
    }
    
    // Дефолтные тестовые случаи на основе количества параметров
    return this.generateDefaultTestCases(paramCount);
  }

  // Генерация тестов для поиска максимума/минимума
  generateMaxMinTestCases(type, paramCount) {
    const testCases = [
      { input: [1, 2, 3], expectedOutput: type === 'max' ? 3 : 1, description: `${type === 'max' ? 'Максимум' : 'Минимум'} из [1, 2, 3]` },
      { input: [10, 5, 8], expectedOutput: type === 'max' ? 10 : 5, description: `${type === 'max' ? 'Максимум' : 'Минимум'} из [10, 5, 8]` },
      { input: [-1, -5, -3], expectedOutput: type === 'max' ? -1 : -5, description: `${type === 'max' ? 'Максимум' : 'Минимум'} из отрицательных чисел` },
      { input: [0, 0, 0], expectedOutput: 0, description: `${type === 'max' ? 'Максимум' : 'Минимум'} из нулей` }
    ];
    
    // Если функция принимает несколько параметров, добавляем тесты с отдельными аргументами
    if (paramCount > 1) {
      testCases.push(
        { input: [1, 2, 3], expectedOutput: type === 'max' ? 3 : 1, description: `${type === 'max' ? 'Максимум' : 'Минимум'} из 1, 2, 3` },
        { input: [10, 5, 8], expectedOutput: type === 'max' ? 10 : 5, description: `${type === 'max' ? 'Максимум' : 'Минимум'} из 10, 5, 8` }
      );
    }
    
    return testCases;
  }

  // Генерация тестов для суммирования
  generateSumTestCases(paramCount) {
    if (paramCount === 1) {
      return [
        { input: [1, 2, 3], expectedOutput: 6, description: 'Сумма массива [1, 2, 3]' },
        { input: [10, 20, 30], expectedOutput: 60, description: 'Сумма массива [10, 20, 30]' },
        { input: [-1, 1, 0], expectedOutput: 0, description: 'Сумма массива [-1, 1, 0]' },
        { input: [], expectedOutput: 0, description: 'Сумма пустого массива' }
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

  // Генерация тестов для факториала
  generateFactorialTestCases() {
    return [
      { input: 5, expectedOutput: 120, description: 'Факториал 5' },
      { input: 3, expectedOutput: 6, description: 'Факториал 3' },
      { input: 0, expectedOutput: 1, description: 'Факториал 0' },
      { input: 1, expectedOutput: 1, description: 'Факториал 1' }
    ];
  }

  // Генерация тестов для чисел Фибоначчи
  generateFibonacciTestCases() {
    return [
      { input: 5, expectedOutput: 5, description: '5-е число Фибоначчи' },
      { input: 8, expectedOutput: 21, description: '8-е число Фибоначчи' },
      { input: 1, expectedOutput: 1, description: '1-е число Фибоначчи' },
      { input: 2, expectedOutput: 1, description: '2-е число Фибоначчи' }
    ];
  }

  // Генерация тестов для простых чисел
  generatePrimeTestCases() {
    return [
      { input: 7, expectedOutput: true, description: '7 - простое число' },
      { input: 4, expectedOutput: false, description: '4 - не простое число' },
      { input: 2, expectedOutput: true, description: '2 - простое число' },
      { input: 1, expectedOutput: false, description: '1 - не простое число' }
    ];
  }

  // Генерация тестов для палиндромов
  generatePalindromeTestCases() {
    return [
      { input: 'racecar', expectedOutput: true, description: 'racecar - палиндром' },
      { input: 'hello', expectedOutput: false, description: 'hello - не палиндром' },
      { input: 'level', expectedOutput: true, description: 'level - палиндром' },
      { input: 'a', expectedOutput: true, description: 'a - палиндром' }
    ];
  }

  // Генерация тестов для сортировки
  generateSortTestCases() {
    return [
      { input: [3, 1, 4, 1, 5], expectedOutput: [1, 1, 3, 4, 5], description: 'Сортировка [3, 1, 4, 1, 5]' },
      { input: [5, 2, 8, 1], expectedOutput: [1, 2, 5, 8], description: 'Сортировка [5, 2, 8, 1]' },
      { input: [1], expectedOutput: [1], description: 'Сортировка одного элемента' },
      { input: [], expectedOutput: [], description: 'Сортировка пустого массива' }
    ];
  }

  // Генерация тестов для фильтрации
  generateFilterTestCases() {
    return [
      { 
        input: [[1, 2, 3, 4, 5], (x) => x > 2], 
        expectedOutput: [3, 4, 5], 
        description: 'Фильтрация чисел больше 2' 
      },
      { 
        input: [[10, 20, 30, 40], (x) => x < 25], 
        expectedOutput: [10, 20], 
        description: 'Фильтрация чисел меньше 25' 
      },
      { 
        input: [[1, 3, 5, 7, 9], (x) => x % 2 === 0], 
        expectedOutput: [], 
        description: 'Фильтрация четных чисел из нечетных' 
      }
    ];
  }

  // Генерация тестов для уникальных элементов
  generateUniqueTestCases() {
    return [
      { input: [1, 2, 3, 2, 1, 4], expectedOutput: [3, 4], description: 'Уникальные элементы из [1, 2, 3, 2, 1, 4]' },
      { input: [1, 2, 3, 4, 5], expectedOutput: [1, 2, 3, 4, 5], description: 'Все элементы уникальны' },
      { input: [1, 1, 1, 1], expectedOutput: [], description: 'Все элементы одинаковые' },
      { input: [], expectedOutput: [], description: 'Пустой массив' }
    ];
  }

  // Генерация тестов для строк
  generateStringTestCases() {
    return [
      { input: 'hello', expectedOutput: 'HELLO', description: 'Преобразование в верхний регистр' },
      { input: 'WORLD', expectedOutput: 'world', description: 'Преобразование в нижний регистр' },
      { input: 'test', expectedOutput: 4, description: 'Длина строки' },
      { input: '', expectedOutput: 0, description: 'Пустая строка' }
    ];
  }

  // Генерация тестов для четности/нечетности
  generateEvenOddTestCases() {
    return [
      { input: 4, expectedOutput: true, description: '4 - четное число' },
      { input: 7, expectedOutput: false, description: '7 - нечетное число' },
      { input: 0, expectedOutput: true, description: '0 - четное число' },
      { input: -2, expectedOutput: true, description: '-2 - четное число' }
    ];
  }

  // Генерация тестов для объектов
  generateObjectTestCases() {
    return [
      { input: {a: 1, b: 2, c: 3}, expectedOutput: ['a', 'b', 'c'], description: 'Ключи объекта' },
      { input: {x: 10, y: 20}, expectedOutput: [10, 20], description: 'Значения объекта' },
      { input: {}, expectedOutput: [], description: 'Пустой объект' }
    ];
  }

  // Генерация тестов для map
  generateMapTestCases() {
    return [
      { 
        input: [[1, 2, 3, 4], (x) => x * 2], 
        expectedOutput: [2, 4, 6, 8], 
        description: 'Умножение каждого элемента на 2' 
      },
      { 
        input: [[1, 2, 3], (x) => x * x], 
        expectedOutput: [1, 4, 9], 
        description: 'Возведение в квадрат' 
      }
    ];
  }

  // Генерация тестов для reduce
  generateReduceTestCases() {
    return [
      { 
        input: [[1, 2, 3, 4], (acc, x) => acc + x, 0], 
        expectedOutput: 10, 
        description: 'Сумма элементов массива' 
      },
      { 
        input: [[1, 2, 3, 4], (acc, x) => acc * x, 1], 
        expectedOutput: 24, 
        description: 'Произведение элементов массива' 
      }
    ];
  }

  // Генерация тестов для реверса
  generateReverseTestCases() {
    return [
      { input: [1, 2, 3, 4], expectedOutput: [4, 3, 2, 1], description: 'Реверс массива [1, 2, 3, 4]' },
      { input: 'hello', expectedOutput: 'olleh', description: 'Реверс строки hello' },
      { input: [], expectedOutput: [], description: 'Реверс пустого массива' },
      { input: '', expectedOutput: '', description: 'Реверс пустой строки' }
    ];
  }

  // Генерация тестов для подсчета
  generateCountTestCases() {
    return [
      { input: [1, 2, 3, 4, 5], expectedOutput: 5, description: 'Количество элементов в массиве' },
      { input: [], expectedOutput: 0, description: 'Пустой массив' },
      { input: 'hello', expectedOutput: 5, description: 'Длина строки' },
      { input: '', expectedOutput: 0, description: 'Пустая строка' }
    ];
  }

  // Генерация тестов для проверки пустоты
  generateEmptyTestCases() {
    return [
      { input: [], expectedOutput: true, description: 'Пустой массив' },
      { input: [1, 2, 3], expectedOutput: false, description: 'Непустой массив' },
      { input: '', expectedOutput: true, description: 'Пустая строка' },
      { input: 'hello', expectedOutput: false, description: 'Непустая строка' }
    ];
  }

  // Генерация дефолтных тестовых случаев
  generateDefaultTestCases(paramCount) {
    if (paramCount === 1) {
      return [
        { input: [1, 2, 3], expectedOutput: [1, 2, 3], description: 'Массив [1, 2, 3]' },
        { input: [5, 10, 15], expectedOutput: [5, 10, 15], description: 'Массив [5, 10, 15]' },
        { input: [], expectedOutput: [], description: 'Пустой массив' }
      ];
    } else if (paramCount === 2) {
      return [
        { input: [5, 3], expectedOutput: 8, description: 'Тест с двумя параметрами' },
        { input: [10, 20], expectedOutput: 30, description: 'Второй тест с двумя параметрами' },
        { input: [1, 1], expectedOutput: 2, description: 'Третий тест с двумя параметрами' }
      ];
    } else if (paramCount === 3) {
      return [
        { input: [1, 2, 3], expectedOutput: 6, description: 'Тест с тремя параметрами' },
        { input: [5, 5, 5], expectedOutput: 15, description: 'Второй тест с тремя параметрами' }
      ];
    } else {
      return [
        { input: 5, expectedOutput: 5, description: 'Числовой тест' },
        { input: 'hello', expectedOutput: 'hello', description: 'Строковый тест' },
        { input: true, expectedOutput: true, description: 'Булевый тест' }
      ];
    }
  }

  // Вспомогательный метод для сравнения чисел
  compareNumbers(actual, expected) {
    if (isNaN(actual) && isNaN(expected)) return true;
    if (actual === Infinity && expected === Infinity) return true;
    if (actual === -Infinity && expected === -Infinity) return true;
    return Math.abs(actual - expected) < Number.EPSILON;
  }

  // Сравнение результатов тестирования
  compareResults(actual, expected) {
    // Для примитивных типов
    if (actual === expected) {
      return true;
    }

    // Проверяем на null и undefined
    if (actual === null && expected === null) return true;
    if (actual === undefined && expected === undefined) return true;
    if (actual === null && expected === undefined) return false;
    if (actual === undefined && expected === null) return false;

    // Приведение типов для сравнения чисел и строк
    // Если один из аргументов - число, а другой - строка, пытаемся привести к числу
    if (typeof actual === 'number' && typeof expected === 'string') {
      const expectedAsNumber = Number(expected);
      if (!isNaN(expectedAsNumber)) {
        return this.compareNumbers(actual, expectedAsNumber);
      }
    }
    
    if (typeof actual === 'string' && typeof expected === 'number') {
      const actualAsNumber = Number(actual);
      if (!isNaN(actualAsNumber)) {
        return this.compareNumbers(actualAsNumber, expected);
      }
    }

    // Приведение булевых значений
    if (typeof actual === 'boolean' && typeof expected === 'string') {
      const expectedAsBool = expected.toLowerCase() === 'true';
      return actual === expectedAsBool;
    }
    
    if (typeof actual === 'string' && typeof expected === 'boolean') {
      const actualAsBool = actual.toLowerCase() === 'true';
      return actualAsBool === expected;
    }

    // Для массивов - более гибкое сравнение
    if (Array.isArray(actual) && Array.isArray(expected)) {
      if (actual.length !== expected.length) return false;
      return actual.every((item, index) => this.compareResults(item, expected[index]));
    }

    // Если один из аргументов - массив, а другой - нет, пробуем привести к массиву
    if (Array.isArray(actual) && !Array.isArray(expected)) {
      if (actual.length === 1) {
        return this.compareResults(actual[0], expected);
      }
      return false;
    }
    
    if (!Array.isArray(actual) && Array.isArray(expected)) {
      if (expected.length === 1) {
        return this.compareResults(actual, expected[0]);
      }
      return false;
    }

    // Для объектов - более гибкое сравнение
    if (typeof actual === 'object' && actual !== null && typeof expected === 'object' && expected !== null) {
      // Если один из объектов - массив, а другой - нет, пробуем преобразовать
      if (Array.isArray(actual) && !Array.isArray(expected)) {
        return false;
      }
      if (!Array.isArray(actual) && Array.isArray(expected)) {
        return false;
      }
      
      const actualKeys = Object.keys(actual);
      const expectedKeys = Object.keys(expected);
      
      if (actualKeys.length !== expectedKeys.length) return false;
      
      return actualKeys.every(key => 
        expectedKeys.includes(key) && 
        this.compareResults(actual[key], expected[key])
      );
    }

    // Если типы разные после попытки приведения, возвращаем false
    if (typeof actual !== typeof expected) {
      return false;
    }

    // Для чисел (учитываем NaN и Infinity)
    if (typeof actual === 'number' && typeof expected === 'number') {
      return this.compareNumbers(actual, expected);
    }

    // Для строк - нормализуем пробелы и регистр
    if (typeof actual === 'string' && typeof expected === 'string') {
      return actual.trim() === expected.trim();
    }

    // Для булевых значений
    if (typeof actual === 'boolean' && typeof expected === 'boolean') {
      return actual === expected;
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
      const prompt = `Создай ПРАКТИЧЕСКУЮ задачу для IDE с кодом по программированию:

Язык: ${language}
Сложность: ${difficulty}
Тема: ${topic}

ЗАДАЧА ДОЛЖНА БЫТЬ ПРАКТИЧЕСКОЙ - пользователь должен написать код, а не отвечать на теоретические вопросы.

Формат ответа:
ЗАГОЛОВОК: [название практической задачи]
ОПИСАНИЕ: [описание того, что нужно реализовать в коде]
НАЧАЛЬНЫЙ_КОД: [код-заготовка с комментариями TODO или пустыми функциями]
ОЖИДАЕМЫЙ_РЕЗУЛЬТАТ: [конкретный результат выполнения кода]
ТЕСТ_КЕЙСЫ: [{"input": [1,2,3], "expectedOutput": 6, "description": "Тест 1"}, {"input": [4,5,6], "expectedOutput": 15, "description": "Тест 2"}]

ПРИМЕРЫ ПРАВИЛЬНЫХ ЗАДАЧ:
- "Напишите функцию для сортировки массива"
- "Создайте класс для работы с банковским счетом"
- "Реализуйте алгоритм поиска в бинарном дереве"
- "Напишите функцию для валидации email"

НЕ СОЗДАВАЙТЕ ТЕОРЕТИЧЕСКИЕ ВОПРОСЫ типа "объясните что такое..." или "опишите принцип..."

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
      
      // Валидация входных данных
      if (!userCode || !userCode.trim()) {
        return {
          isCorrect: false,
          passedTests: 0,
          totalTests: testCases.length,
          testResults: [],
          errorMessage: 'Код не может быть пустым'
        };
      }

      if (!testCases || testCases.length === 0) {
        return {
          isCorrect: false,
          passedTests: 0,
          totalTests: 0,
          testResults: [],
          errorMessage: 'Нет тестовых случаев для проверки'
        };
      }
      
      // Выполняем код и проверяем результаты
      const results = await this.executeUserCode(userCode, testCases);
      
      console.log('Результаты валидации:', results);
      console.log('=== КОНЕЦ ВАЛИДАЦИИ КОДА ===');
      
      // Детальная обработка результатов
      const validationResult = {
        isCorrect: results.passedTests === results.totalTests,
        passedTests: results.passedTests,
        totalTests: results.totalTests,
        testResults: results.testResults,
        errorMessage: results.errorMessage
      };

      // Добавляем дополнительную информацию об ошибках
      if (!validationResult.isCorrect && results.testResults) {
        const failedTests = results.testResults.filter(test => !test.passed);
        if (failedTests.length > 0) {
          const errorDetails = failedTests.map(test => {
            if (test.errorMessage) {
              return `Тест "${test.testCase.description}": ${test.errorMessage}`;
            } else {
              return `Тест "${test.testCase.description}": ожидалось ${JSON.stringify(test.expectedOutput)}, получено ${JSON.stringify(test.actualOutput)}`;
            }
          }).join('; ');
          
          validationResult.errorMessage = validationResult.errorMessage 
            ? `${validationResult.errorMessage}. Детали: ${errorDetails}`
            : errorDetails;
        }
      }
      
      return validationResult;

    } catch (error) {
      console.error('IDE Code Validation Error:', error);
      
      // Детальная обработка ошибок
      let errorMessage = 'Неизвестная ошибка валидации';
      
      if (error.message) {
        if (error.message.includes('timeout')) {
          errorMessage = 'Превышено время выполнения кода (5 секунд)';
        } else if (error.message.includes('SyntaxError')) {
          errorMessage = 'Синтаксическая ошибка в коде';
        } else if (error.message.includes('ReferenceError')) {
          errorMessage = 'Ошибка ссылки на несуществующую переменную или функцию';
        } else if (error.message.includes('TypeError')) {
          errorMessage = 'Ошибка типа данных';
        } else {
          errorMessage = `Ошибка выполнения: ${error.message}`;
        }
      }
      
      return {
        isCorrect: false,
        passedTests: 0,
        totalTests: testCases.length,
        testResults: [],
        errorMessage: errorMessage
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

      // Упрощенный поиск функций
      const functionInfo = this.findFunctionInCode(userCode);
      
      if (!functionInfo) {
        return {
          passedTests: 0,
          totalTests: testCases.length,
          testResults: [],
          errorMessage: 'Функция не найдена в коде. Поддерживаются: function name(), const name = () =>, const name = function()'
        };
      }
      
      const { functionName, paramCount } = functionInfo;
      
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
          const result = this.executeFunctionWithArgs(context[functionName], testCase.input, paramCount);
          const expected = testCase.expectedOutput;
          
          // Логируем для отладки
          console.log(`Тест: вход=${JSON.stringify(testCase.input)}, ожидалось=${JSON.stringify(expected)}, получено=${JSON.stringify(result)}`);
          
          // Упрощенное сравнение результатов
          const passed = this.simpleCompareResults(result, expected);
          
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
        errorMessage: `Ошибка выполнения кода: ${error.message}`
      };
    }
  }

  // Упрощенный поиск функции в коде
  findFunctionInCode(userCode) {
    // Обычные функции: function name()
    const functionMatch = userCode.match(/function\s+(\w+)\s*\(([^)]*)\)/);
    if (functionMatch) {
      const paramCount = functionMatch[2].trim() ? functionMatch[2].split(',').length : 0;
      return { functionName: functionMatch[1], paramCount };
    }
    
    // Стрелочные функции: const name = () => или let name = () =>
    const arrowMatch = userCode.match(/(?:const|let|var)\s+(\w+)\s*=\s*\(([^)]*)\)\s*=>/);
    if (arrowMatch) {
      const paramCount = arrowMatch[2].trim() ? arrowMatch[2].split(',').length : 0;
      return { functionName: arrowMatch[1], paramCount };
    }
    
    // Функциональные выражения: const name = function()
    const exprMatch = userCode.match(/(?:const|let|var)\s+(\w+)\s*=\s*function\s*\(([^)]*)\)/);
    if (exprMatch) {
      const paramCount = exprMatch[2].trim() ? exprMatch[2].split(',').length : 0;
      return { functionName: exprMatch[1], paramCount };
    }
    
    return null;
  }

  // Упрощенное выполнение функции с аргументами
  executeFunctionWithArgs(func, input, paramCount) {
    // Если функция принимает один параметр и вход - массив, передаем массив как есть
    if (paramCount === 1 && Array.isArray(input)) {
      return func(input);
    }
    // Если функция принимает несколько параметров и вход - массив, используем spread
    else if (paramCount > 1 && Array.isArray(input)) {
      return func(...input);
    }
    // Иначе передаем как есть
    else {
      return func(input);
    }
  }

  // Упрощенное сравнение результатов
  simpleCompareResults(actual, expected) {
    // Строгое сравнение для примитивов
    if (actual === expected) {
      return true;
    }

    // Проверка на null и undefined
    if (actual === null && expected === null) return true;
    if (actual === undefined && expected === undefined) return true;
    if (actual === null || expected === null) return false;
    if (actual === undefined || expected === undefined) return false;

    // Приведение типов для чисел и строк
    if (typeof actual === 'number' && typeof expected === 'string') {
      const expectedAsNumber = Number(expected);
      return !isNaN(expectedAsNumber) && actual === expectedAsNumber;
    }
    
    if (typeof actual === 'string' && typeof expected === 'number') {
      const actualAsNumber = Number(actual);
      return !isNaN(actualAsNumber) && actualAsNumber === expected;
    }

    // Приведение булевых значений
    if (typeof actual === 'boolean' && typeof expected === 'string') {
      return actual === (expected.toLowerCase() === 'true');
    }
    
    if (typeof actual === 'string' && typeof expected === 'boolean') {
      return (actual.toLowerCase() === 'true') === expected;
    }

    // Для массивов
    if (Array.isArray(actual) && Array.isArray(expected)) {
      if (actual.length !== expected.length) return false;
      return actual.every((item, index) => this.simpleCompareResults(item, expected[index]));
    }

    // Для объектов
    if (typeof actual === 'object' && actual !== null && typeof expected === 'object' && expected !== null) {
      const actualKeys = Object.keys(actual);
      const expectedKeys = Object.keys(expected);
      
      if (actualKeys.length !== expectedKeys.length) return false;
      
      return actualKeys.every(key => 
        expectedKeys.includes(key) && 
        this.simpleCompareResults(actual[key], expected[key])
      );
    }

    // Для чисел (учитываем NaN и Infinity)
    if (typeof actual === 'number' && typeof expected === 'number') {
      if (isNaN(actual) && isNaN(expected)) return true;
      if (actual === Infinity && expected === Infinity) return true;
      if (actual === -Infinity && expected === -Infinity) return true;
      return Math.abs(actual - expected) < Number.EPSILON;
    }

    // Для строк - нормализуем пробелы
    if (typeof actual === 'string' && typeof expected === 'string') {
      return actual.trim() === expected.trim();
    }

    return false;
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
    console.log('🔍 Парсинг IDE задачи:', text);
    
    const lines = text.split('\n');
    const title = lines.find(line => line.startsWith('ЗАГОЛОВОК:'))?.replace('ЗАГОЛОВОК:', '').trim() || `Задача по ${topic}`;
    const description = lines.find(line => line.startsWith('ОПИСАНИЕ:'))?.replace('ОПИСАНИЕ:', '').trim() || 'Описание задачи';
    let initialCode = lines.find(line => line.startsWith('НАЧАЛЬНЫЙ_КОД:'))?.replace('НАЧАЛЬНЫЙ_КОД:', '').trim() || '// Начните писать код здесь';
    const expectedOutput = lines.find(line => line.startsWith('ОЖИДАЕМЫЙ_РЕЗУЛЬТАТ:'))?.replace('ОЖИДАЕМЫЙ_РЕЗУЛЬТАТ:', '').trim() || 'Ожидаемый результат';
    
    // Проверяем, не является ли это теоретическим вопросом
    if (initialCode === '(не применимо)' || initialCode === 'не применимо' || 
        description.toLowerCase().includes('опишите') || 
        description.toLowerCase().includes('объясните') ||
        description.toLowerCase().includes('что такое')) {
      
      console.log('⚠️ Обнаружен теоретический вопрос, генерируем практическую задачу');
      
      // Генерируем практическую задачу на основе темы
      const practicalTask = this.generatePracticalTask(topic, language, difficulty);
      return practicalTask;
    }
    
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

  // Генерация практической задачи на основе темы
  generatePracticalTask(topic, language, difficulty) {
    const tasks = {
      'JavaScript': {
        easy: {
          title: 'Функция для подсчета суммы массива',
          description: 'Напишите функцию sumArray, которая принимает массив чисел и возвращает их сумму.',
          initialCode: `function sumArray(numbers) {
  // TODO: Реализуйте функцию для подсчета суммы массива
  // Пример: sumArray([1, 2, 3, 4]) должно вернуть 10
}`,
          expectedOutput: 'Функция должна возвращать сумму всех элементов массива',
          testCases: [
            { input: '[1, 2, 3, 4]', expectedOutput: '10', description: 'Массив положительных чисел' },
            { input: '[-1, 0, 1]', expectedOutput: '0', description: 'Массив с отрицательными числами' },
            { input: '[]', expectedOutput: '0', description: 'Пустой массив' }
          ]
        },
        medium: {
          title: 'Функция для поиска уникальных элементов',
          description: 'Напишите функцию getUniqueElements, которая принимает массив и возвращает новый массив с уникальными элементами.',
          initialCode: `function getUniqueElements(arr) {
  // TODO: Реализуйте функцию для получения уникальных элементов
  // Пример: getUniqueElements([1, 2, 2, 3, 3, 3]) должно вернуть [1, 2, 3]
}`,
          expectedOutput: 'Функция должна возвращать массив без дубликатов',
          testCases: [
            { input: '[1, 2, 2, 3, 3, 3]', expectedOutput: '[1, 2, 3]', description: 'Массив с дубликатами' },
            { input: '["a", "b", "a", "c"]', expectedOutput: '["a", "b", "c"]', description: 'Массив строк с дубликатами' },
            { input: '[1, 2, 3]', expectedOutput: '[1, 2, 3]', description: 'Массив без дубликатов' }
          ]
        },
        hard: {
          title: 'Реализация простого Promise',
          description: 'Создайте класс SimplePromise, который реализует базовую функциональность Promise с методами then и catch.',
          initialCode: `class SimplePromise {
  constructor(executor) {
    // TODO: Реализуйте конструктор Promise
    // executor - функция с параметрами resolve и reject
  }
  
  then(onFulfilled) {
    // TODO: Реализуйте метод then
    // onFulfilled - функция, которая вызывается при успешном выполнении
  }
  
  catch(onRejected) {
    // TODO: Реализуйте метод catch
    // onRejected - функция, которая вызывается при ошибке
  }
}`,
          expectedOutput: 'Класс должен работать как стандартный Promise',
          testCases: [
            { input: 'new SimplePromise((resolve) => resolve(42))', expectedOutput: 'Promise resolved with 42', description: 'Успешное выполнение' },
            { input: 'new SimplePromise((resolve, reject) => reject("error"))', expectedOutput: 'Promise rejected with error', description: 'Обработка ошибки' }
          ]
        }
      },
      'React': {
        easy: {
          title: 'Компонент счетчика',
          description: 'Создайте React компонент Counter, который отображает число и кнопки для увеличения/уменьшения.',
          initialCode: `import React, { useState } from 'react';

function Counter() {
  // TODO: Реализуйте компонент счетчика
  // Используйте useState для хранения значения счетчика
  // Добавьте кнопки + и - для изменения значения
  // Отобразите текущее значение счетчика
  
  return (
    <div>
      {/* Ваш код здесь */}
    </div>
  );
}

export default Counter;`,
          expectedOutput: 'Компонент должен отображать счетчик с кнопками управления',
          testCases: [
            { input: 'Initial render', expectedOutput: 'Counter shows 0', description: 'Начальное состояние' },
            { input: 'Click + button', expectedOutput: 'Counter increases by 1', description: 'Увеличение счетчика' },
            { input: 'Click - button', expectedOutput: 'Counter decreases by 1', description: 'Уменьшение счетчика' }
          ]
        }
      }
    };

    const topicTasks = tasks[topic] || tasks['JavaScript'];
    const difficultyTasks = topicTasks[difficulty] || topicTasks['easy'];
    
    return {
      id: Date.now().toString(),
      title: difficultyTasks.title,
      description: difficultyTasks.description,
      language,
      difficulty,
      topic,
      initialCode: difficultyTasks.initialCode,
      expectedOutput: difficultyTasks.expectedOutput,
      testCases: difficultyTasks.testCases
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
          testCase: {
            input: testCase.input || null,
            expectedOutput: testCase.expectedOutput || null,
            description: testCase.description || `Тест ${index + 1}`
          },
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
