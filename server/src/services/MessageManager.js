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
}

module.exports = new MessageManager();
