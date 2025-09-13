const messageManager = require('../services/MessageManager');

class AIController {
  async chatResponse(req, res) {
    try {
      const { message, context } = req.body;
      const userId = req.user.id;

      if (!message?.trim()) {
        return res.status(400).json({ error: 'Сообщение обязательно' });
      }

      const response = await messageManager.sendMessage(
        userId, 
        message, 
        'mentor', 
        context
      );
      
      res.json({ 
        message: response.message,
        timestamp: new Date().toISOString(),
        userId: 'ai',
        usage: response.usage
      });

    } catch (error) {
      console.error('AI Chat Error:', error);
      res.status(500).json({ error: 'AI-сервис временно недоступен' });
    }
  }

  async generateQuestion(req, res) {
    try {
      const { topic, difficulty } = req.body;

      if (!topic?.trim()) {
        return res.status(400).json({ error: 'Тема обязательна' });
      }

      const question = await messageManager.generateQuestion(topic, difficulty);
      
      res.json(question);

    } catch (error) {
      console.error('AI Question Error:', error);
      res.status(500).json({ error: 'Не удалось сгенерировать вопрос' });
    }
  }

  async checkAnswer(req, res) {
    try {
      const { userAnswer, correctAnswer, question } = req.body;

      if (!userAnswer || !correctAnswer || !question) {
        return res.status(400).json({ error: 'Все поля обязательны' });
      }

      const result = await messageManager.checkAnswer(userAnswer, correctAnswer, question);
      
      res.json({ 
        result: result,
        isCorrect: result === 'CORRECT',
        isPartial: result === 'PARTIAL'
      });

    } catch (error) {
      console.error('AI Check Error:', error);
      res.status(500).json({ error: 'Не удалось проверить ответ' });
    }
  }

  async clearHistory(req, res) {
    try {
      const userId = req.user.id;
      messageManager.clearConversation(userId);
      
      res.json({ message: 'История диалога очищена' });

    } catch (error) {
      console.error('Clear History Error:', error);
      res.status(500).json({ error: 'Ошибка очистки истории' });
    }
  }

  async getHistory(req, res) {
    try {
      const userId = req.user.id;
      const history = messageManager.getConversationHistory(userId);
      
      res.json({ history });

    } catch (error) {
      console.error('Get History Error:', error);
      res.status(500).json({ error: 'Ошибка получения истории' });
    }
  }

  async getTokenUsage(req, res) {
    try {
      const usage = messageManager.getTokenUsage();
      res.json(usage);

    } catch (error) {
      console.error('Token Usage Error:', error);
      res.status(500).json({ error: 'Ошибка получения статистики' });
    }
  }
}

module.exports = new AIController();
