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

  // Генерация IDE задачи через AI
  async generateIDETask(req, res) {
    try {
      const { language, difficulty, topic } = req.body;
      const userId = req.user.id;

      console.log('Generate IDE Task request:', { language, difficulty, topic, userId });

      if (!language || !difficulty || !topic) {
        return res.status(400).json({ error: 'Язык, сложность и тема обязательны' });
      }

      const task = await messageManager.generateIDETask(language, difficulty, topic, userId);
      
      console.log('Generated task:', task);
      res.json({ task });

    } catch (error) {
      console.error('AI IDE Task Generation Error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
      res.status(500).json({ error: 'Не удалось сгенерировать IDE задачу' });
    }
  }

  // Получение подсказки для IDE задачи
  async getIDEHint(req, res) {
    try {
      const { taskId, hintIndex, taskDescription, userCode } = req.body;
      const userId = req.user.id;

      if (!taskId || hintIndex === undefined) {
        return res.status(400).json({ error: 'ID задачи и индекс подсказки обязательны' });
      }

      const hint = await messageManager.generateIDEHint(taskId, hintIndex, taskDescription, userCode, userId);
      
      res.json({ hint });

    } catch (error) {
      console.error('AI IDE Hint Error:', error);
      res.status(500).json({ error: 'Не удалось получить подсказку' });
    }
  }

  // Валидация кода IDE задачи через AI
  async validateIDECode(req, res) {
    try {
      const { taskId, userCode, taskDescription, testCases } = req.body;
      const userId = req.user.id;

      if (!taskId || !userCode) {
        return res.status(400).json({ error: 'ID задачи и код обязательны' });
      }

      const validation = await messageManager.validateIDECode(taskId, userCode, taskDescription, testCases, userId);
      
      res.json(validation);

    } catch (error) {
      console.error('AI IDE Validation Error:', error);
      res.status(500).json({ error: 'Не удалось проверить код' });
    }
  }

  // Получение решения IDE задачи
  async getIDESolution(req, res) {
    try {
      const { taskId, taskDescription } = req.body;
      const userId = req.user.id;

      if (!taskId) {
        return res.status(400).json({ error: 'ID задачи обязателен' });
      }

      const solution = await messageManager.generateIDESolution(taskId, taskDescription, userId);
      
      res.json({ solution });

    } catch (error) {
      console.error('AI IDE Solution Error:', error);
      res.status(500).json({ error: 'Не удалось получить решение' });
    }
  }
}

module.exports = new AIController();
