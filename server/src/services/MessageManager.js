const yandexAxios = require('./axios.instance');
const systemPrompts = require('../config/system.prompt.config.json');

class MessageManager {
  constructor() {
    this.conversations = new Map(); // Хранилище диалогов по userId
    this.totalTokens = 0;
    this.tokenLimit = 100000; // в день
  }

  async sendMessage(userId, message, role = 'assistant', context = '') {
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
          maxTokens: 2000
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
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        stack: error.stack
      });
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

  // Генерация IDE задачи через AI
  async generateIDETask(language, difficulty, topic, userId) {
    try {
      const prompt = `Создай задачу по программированию для IDE.

Параметры:
- Язык: ${language}
- Сложность: ${difficulty}
- Тема: ${topic}

ВАЖНО: Ответь ТОЛЬКО валидным JSON без markdown, без дополнительного текста.

Формат:
{
  "title": "Краткое название",
  "description": "Краткое описание задачи",
  "language": "${language}",
  "difficulty": "${difficulty}",
  "topic": "${topic}",
  "initialCode": "function example() { // TODO }",
  "expectedOutput": "Краткое описание результата",
  "testCases": [{"input": "example([1,2,3])", "expectedOutput": "6", "description": "Тест"}],
  "hints": ["Подсказка 1", "Подсказка 2"],
  "solution": "function example(arr) { return arr.reduce((a,b) => a+b, 0); }"
}`;

      const response = await this.sendMessage(userId, prompt, 'ide_task_generator');
      
      // Очищаем ответ от markdown блоков кода
      let cleanResponse = response.message;
      
      // Убираем блоки кода markdown (```json ... ```)
      cleanResponse = cleanResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Убираем возможные префиксы до первой {
      cleanResponse = cleanResponse.replace(/^[^{]*/, '');
      
      // Находим последнюю закрывающую скобку и обрезаем после неё
      let lastBraceIndex = cleanResponse.lastIndexOf('}');
      if (lastBraceIndex !== -1) {
        cleanResponse = cleanResponse.substring(0, lastBraceIndex + 1);
      }
      
      // Проверяем, что JSON начинается с { и заканчивается на }
      if (!cleanResponse.startsWith('{') || !cleanResponse.endsWith('}')) {
        console.error('Invalid JSON structure - not starting with { or ending with }');
        console.error('Cleaned response:', cleanResponse);
        throw new Error('Неверный формат ответа от AI');
      }
      
      console.log('Cleaned response:', cleanResponse);
      
      try {
        const taskData = JSON.parse(cleanResponse);
        
        // Проверяем, что все обязательные поля присутствуют
        const requiredFields = ['title', 'description', 'language', 'difficulty', 'topic', 'initialCode', 'expectedOutput', 'testCases', 'hints', 'solution'];
        const missingFields = requiredFields.filter(field => !taskData[field]);
        
        if (missingFields.length > 0) {
          console.error('Missing required fields:', missingFields);
          throw new Error('Неполный ответ от AI - отсутствуют обязательные поля');
        }
        
        // Генерируем уникальный ID
        taskData.id = `ide_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        return taskData;
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Original response:', response.message);
        console.error('Cleaned response:', cleanResponse);
        throw new Error('Не удалось распарсить ответ от AI');
      }

    } catch (error) {
      console.error('IDE Task Generation Error:', error);
      throw new Error('Не удалось сгенерировать IDE задачу');
    }
  }

  // Генерация подсказки для IDE задачи
  async generateIDEHint(taskId, hintIndex, taskDescription, userCode, userId) {
    try {
      const prompt = `Пользователь работает над IDE задачей:
Описание: ${taskDescription}
Текущий код пользователя: ${userCode || 'Код еще не написан'}

Создай подсказку номер ${hintIndex + 1} для этой задачи. Подсказка должна:
- Быть полезной, но не раскрывать полное решение
- Учитывать текущий код пользователя
- Направлять к правильному решению
- Быть краткой и понятной

Ответь только текстом подсказки без дополнительных объяснений.`;

      const response = await this.sendMessage(userId, prompt, 'ide_hint_generator');
      return response.message.trim();

    } catch (error) {
      console.error('IDE Hint Generation Error:', error);
      throw new Error('Не удалось сгенерировать подсказку');
    }
  }

  // Валидация кода IDE задачи через AI
  async validateIDECode(taskId, userCode, taskDescription, testCases, userId) {
    try {
      const testCasesStr = testCases.map(tc => 
        `Вход: ${tc.input} -> Ожидаемый результат: ${tc.expectedOutput}`
      ).join('\n');

      const prompt = `Проверь код пользователя для IDE задачи.

Описание: ${taskDescription}
Код: ${userCode}

Тесты:
${testCasesStr}

ВАЖНО: Ответь ТОЛЬКО валидным JSON без markdown.

Формат:
{
  "isCorrect": true,
  "passedTests": 2,
  "totalTests": 3,
  "testResults": [
    {
      "testCase": {"input": "test(1,2)", "expectedOutput": "3", "description": "Тест 1"},
      "passed": true,
      "actualOutput": "3",
      "errorMessage": null
    }
  ],
  "errorMessage": null
}`;

      const response = await this.sendMessage(userId, prompt, 'ide_code_validator');
      
      // Очищаем ответ от markdown блоков кода
      let cleanResponse = response.message;
      
      // Убираем блоки кода markdown (```json ... ```)
      cleanResponse = cleanResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Убираем возможные префиксы до первой {
      cleanResponse = cleanResponse.replace(/^[^{]*/, '');
      
      // Находим последнюю закрывающую скобку и обрезаем после неё
      let lastBraceIndex = cleanResponse.lastIndexOf('}');
      if (lastBraceIndex !== -1) {
        cleanResponse = cleanResponse.substring(0, lastBraceIndex + 1);
      }
      
      // Проверяем, что JSON начинается с { и заканчивается на }
      if (!cleanResponse.startsWith('{') || !cleanResponse.endsWith('}')) {
        console.error('Invalid JSON structure in validation - not starting with { or ending with }');
        console.error('Cleaned response:', cleanResponse);
        throw new Error('Неверный формат ответа от AI');
      }
      
      console.log('Validation cleaned response:', cleanResponse);
      
      try {
        const validation = JSON.parse(cleanResponse);
        
        // Проверяем, что все обязательные поля присутствуют
        const requiredFields = ['isCorrect', 'passedTests', 'totalTests', 'testResults'];
        const missingFields = requiredFields.filter(field => validation[field] === undefined);
        
        if (missingFields.length > 0) {
          console.error('Missing required fields in validation:', missingFields);
          throw new Error('Неполный ответ от AI - отсутствуют обязательные поля');
        }
        
        return validation;
      } catch (parseError) {
        console.error('JSON Parse Error in validation:', parseError);
        console.error('Original response:', response.message);
        console.error('Cleaned response:', cleanResponse);
        throw new Error('Не удалось распарсить ответ от AI');
      }

    } catch (error) {
      console.error('IDE Code Validation Error:', error);
      return {
        isCorrect: false,
        passedTests: 0,
        totalTests: testCases.length,
        testResults: [],
        errorMessage: 'Ошибка валидации кода'
      };
    }
  }

  // Генерация решения IDE задачи
  async generateIDESolution(taskId, taskDescription, userId) {
    try {
      const prompt = `Создай правильное решение для IDE задачи.

Описание: ${taskDescription}

ВАЖНО: Ответь ТОЛЬКО кодом решения без markdown, без дополнительного текста.

Пример:
function example(arr) {
  return arr.reduce((a, b) => a + b, 0);
}`;

      const response = await this.sendMessage(userId, prompt, 'ide_solution_generator');
      
      // Очищаем ответ от markdown блоков кода
      let solution = response.message;
      
      // Убираем блоки кода markdown (``` ... ```)
      solution = solution.replace(/```\w*\s*/g, '').replace(/```\s*/g, '');
      
      // Убираем возможные префиксы
      solution = solution.replace(/^(РЕШЕНИЕ:|SOLUTION:|Код:|Code:)\s*/i, '');
      
      return solution.trim();

    } catch (error) {
      console.error('IDE Solution Generation Error:', error);
      throw new Error('Не удалось сгенерировать решение');
    }
  }
}

module.exports = new MessageManager();
