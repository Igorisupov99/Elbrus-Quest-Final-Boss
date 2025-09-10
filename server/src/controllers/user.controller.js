const db = require('../../db/models');

class UserController {
  // Получить профиль пользователя
  async getProfile(req, res) {
    try {
      const user = await db.User.findByPk(req.user.id, {
        attributes: ['id', 'username', 'email', 'image_url', 'role', 'score', 'games_completed']
      });

      if (!user) {
        return res.status(404).json({ message: 'Пользователь не найден' });
      }

      res.json({ data: user });
    } catch (error) {
      console.error('Ошибка при получении профиля:', error);
      res.status(500).json({ message: 'Ошибка сервера', error: error.message });
    }
  }

  // Обновить профиль пользователя
  async updateProfile(req, res) {
    try {
      const { username, email, image_url } = req.body;
      const userId = req.user.id;

      const user = await db.User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: 'Пользователь не найден' });
      }

      // Обновляем только переданные поля
      const updateData = {};
      if (username !== undefined) updateData.username = username;
      if (email !== undefined) updateData.email = email;
      if (image_url !== undefined) updateData.image_url = image_url;

      await user.update(updateData);

      res.json({ 
        message: 'Профиль обновлен',
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          image_url: user.image_url,
          role: user.role,
          score: user.score,
          games_completed: user.games_completed
        }
      });
    } catch (error) {
      console.error('Ошибка при обновлении профиля:', error);
      res.status(500).json({ message: 'Ошибка сервера', error: error.message });
    }
  }

  // Увеличить счетчик законченных игр
  async incrementGamesCompleted(req, res) {
    try {
      const userId = req.user.id;

      const user = await db.User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: 'Пользователь не найден' });
      }

      // Увеличиваем счетчик на 1
      await user.increment('games_completed');

      // Получаем обновленного пользователя
      await user.reload();

      res.json({ 
        message: 'Счетчик игр обновлен',
        data: {
          id: user.id,
          username: user.username,
          games_completed: user.games_completed
        }
      });
    } catch (error) {
      console.error('Ошибка при обновлении счетчика игр:', error);
      res.status(500).json({ message: 'Ошибка сервера', error: error.message });
    }
  }

  // Получить статистику пользователя
  async getStats(req, res) {
    try {
      const userId = req.user.id;

      const user = await db.User.findByPk(userId, {
        attributes: ['id', 'username', 'score', 'games_completed', 'createdAt']
      });

      if (!user) {
        return res.status(404).json({ message: 'Пользователь не найден' });
      }

      // Можно добавить дополнительную статистику
      const stats = {
        id: user.id,
        username: user.username,
        score: user.score,
        games_completed: user.games_completed,
        member_since: user.createdAt,
        // Дополнительные вычисляемые поля
        average_score_per_game: user.games_completed > 0 ? Math.round(user.score / user.games_completed) : 0
      };

      res.json({ data: stats });
    } catch (error) {
      console.error('Ошибка при получении статистики:', error);
      res.status(500).json({ message: 'Ошибка сервера', error: error.message });
    }
  }

  // Получить топ пользователей по количеству игр
  async getTopPlayers(req, res) {
    try {
      const { limit = 10 } = req.query;

      const topPlayers = await db.User.findAll({
        attributes: ['id', 'username', 'image_url', 'score', 'games_completed'],
        order: [['games_completed', 'DESC'], ['score', 'DESC']],
        limit: parseInt(limit)
      });

      res.json({ data: topPlayers });
    } catch (error) {
      console.error('Ошибка при получении топ игроков:', error);
      res.status(500).json({ message: 'Ошибка сервера', error: error.message });
    }
  }
}

module.exports = new UserController();
