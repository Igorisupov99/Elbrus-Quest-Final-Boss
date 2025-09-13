const { User, Achievement, UserAchievement, GameSession, UserSession } = require("../../db/models");
const { Op } = require('sequelize');

class AchievementController {
  // Получить все достижения пользователя
  async getUserAchievements(req, res) {
    try {
      const userId = req.user.id;

      const userAchievements = await UserAchievement.findAll({
        where: { user_id: userId },
        include: [
          {
            model: Achievement,
            as: 'achievement',
            attributes: ['id', 'key', 'title', 'description', 'icon', 'category', 'points', 'rarity']
          },
          {
            model: GameSession,
            as: 'game_session',
            attributes: ['id', 'room_name'],
            required: false
          }
        ],
        order: [['earned_at', 'DESC']]
      });

      const totalAchievements = await Achievement.count({ where: { is_active: true } });
      const earnedAchievements = userAchievements.length;
      const totalBonusPoints = userAchievements.reduce((sum, ua) => sum + ua.achievement.points, 0);

      res.json({
        success: true,
        data: {
          achievements: userAchievements,
          stats: {
            totalAchievements,
            earnedAchievements,
            totalBonusPoints,
            completionPercentage: totalAchievements > 0 ? Math.round((earnedAchievements / totalAchievements) * 100) : 0
          }
        }
      });
    } catch (error) {
      console.error("Ошибка при получении достижений пользователя:", error);
      res.status(500).json({ success: false, error: "Внутренняя ошибка сервера" });
    }
  }

  // Получить все достижения конкретного пользователя по ID
  async getUserAchievementsById(req, res) {
    try {
      const { userId } = req.params;

      const userAchievements = await UserAchievement.findAll({
        where: { user_id: userId },
        include: [
          {
            model: Achievement,
            as: 'achievement',
            attributes: ['id', 'key', 'title', 'description', 'icon', 'category', 'points', 'rarity']
          },
          {
            model: GameSession,
            as: 'game_session',
            attributes: ['id', 'room_name'],
            required: false
          }
        ],
        order: [['earned_at', 'DESC']]
      });

      const totalAchievements = await Achievement.count({ where: { is_active: true } });
      const earnedAchievements = userAchievements.length;
      const totalBonusPoints = userAchievements.reduce((sum, ua) => sum + ua.achievement.points, 0);

      res.json({
        success: true,
        data: {
          achievements: userAchievements,
          stats: {
            totalAchievements,
            earnedAchievements,
            totalBonusPoints,
            completionPercentage: totalAchievements > 0 ? Math.round((earnedAchievements / totalAchievements) * 100) : 0
          }
        }
      });
    } catch (error) {
      console.error("Ошибка при получении достижений пользователя:", error);
      res.status(500).json({ success: false, error: "Внутренняя ошибка сервера" });
    }
  }

  // Получить все доступные достижения
  async getAllAchievements(req, res) {
    try {
      const userId = req.user?.id;
      
      // Получаем все активные достижения
      const achievements = await Achievement.findAll({
        where: { is_active: true },
        attributes: ['id', 'key', 'title', 'description', 'icon', 'category', 'points', 'rarity'],
        order: [['category', 'ASC'], ['rarity', 'ASC'], ['points', 'ASC']]
      });

      // Если пользователь авторизован, отметим полученные достижения
      let earnedAchievementIds = [];
      if (userId) {
        const userAchievements = await UserAchievement.findAll({
          where: { user_id: userId },
          attributes: ['achievement_id', 'earned_at']
        });
        earnedAchievementIds = userAchievements.map(ua => ua.achievement_id);
      }

      // Добавляем флаг earned к каждому достижению
      const achievementsWithStatus = achievements.map(achievement => ({
        ...achievement.toJSON(),
        earned: earnedAchievementIds.includes(achievement.id)
      }));

      res.json({
        achievements: achievementsWithStatus,
        categories: ['knowledge', 'exam', 'speed', 'persistence', 'social', 'score', 'special'],
        rarities: ['common', 'rare', 'epic', 'legendary']
      });
    } catch (error) {
      console.error("Ошибка при получении списка достижений:", error);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  }

  // Проверить и выдать достижение пользователю
  async awardAchievement(userId, achievementKey, gameSessionId = null, metadata = null) {
    try {
      // Находим достижение по ключу
      const achievement = await Achievement.findOne({
        where: { key: achievementKey, is_active: true }
      });

      if (!achievement) {
        console.warn(`Достижение с ключом "${achievementKey}" не найдено`);
        return null;
      }

      // Проверяем, не получил ли пользователь уже это достижение
      const existingUserAchievement = await UserAchievement.findOne({
        where: {
          user_id: userId,
          achievement_id: achievement.id
        }
      });

      if (existingUserAchievement) {
        return null; // Достижение уже получено
      }

      // Создаем запись о получении достижения
      const userAchievement = await UserAchievement.create({
        user_id: userId,
        achievement_id: achievement.id,
        game_session_id: gameSessionId,
        metadata: metadata
      });

      // Добавляем бонусные очки пользователю
      if (achievement.points > 0) {
        const user = await User.findByPk(userId);
        if (user) {
          user.score = Number(user.score || 0) + achievement.points;
          await user.save();
        }
      }

      // Возвращаем информацию о полученном достижении
      return {
        id: achievement.id,
        key: achievement.key,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        category: achievement.category,
        points: achievement.points,
        rarity: achievement.rarity,
        earned_at: userAchievement.earned_at,
        metadata: metadata
      };
    } catch (error) {
      console.error(`Ошибка при выдаче достижения "${achievementKey}":`, error);
      return null;
    }
  }

  // Проверка достижений на основе статистики пользователя
  async checkUserAchievements(userId, gameSessionId = null) {
    try {
      const newAchievements = [];

      // Получаем статистику пользователя
      const user = await User.findByPk(userId);
      if (!user) return [];

      const userScore = Number(user.score || 0);
      const gamesCompleted = Number(user.games_completed || 0);

      // Проверяем достижения за очки
      if (userScore >= 100) {
        const achievement = await this.awardAchievement(userId, 'first_hundred', gameSessionId);
        if (achievement) newAchievements.push(achievement);
      }
      if (userScore >= 1000) {
        const achievement = await this.awardAchievement(userId, 'thousand_points', gameSessionId);
        if (achievement) newAchievements.push(achievement);
      }
      if (userScore >= 10000) {
        const achievement = await this.awardAchievement(userId, 'millionaire', gameSessionId);
        if (achievement) newAchievements.push(achievement);
      }

      // Проверяем достижения за количество игр
      if (gamesCompleted >= 10) {
        const achievement = await this.awardAchievement(userId, 'veteran', gameSessionId);
        if (achievement) newAchievements.push(achievement);
      }

      // Проверяем социальные достижения
      const friendsCount = await this.getFriendsCount(userId);
      if (friendsCount >= 1) {
        const achievement = await this.awardAchievement(userId, 'friend', gameSessionId);
        if (achievement) newAchievements.push(achievement);
      }
      if (friendsCount >= 5) {
        const achievement = await this.awardAchievement(userId, 'popular', gameSessionId);
        if (achievement) newAchievements.push(achievement);
      }

      return newAchievements;
    } catch (error) {
      console.error("Ошибка при проверке достижений пользователя:", error);
      return [];
    }
  }

  // Получить количество друзей пользователя
  async getFriendsCount(userId) {
    try {
      const { Friendship } = require("../../db/models");
      const friendsCount = await Friendship.count({
        where: {
          [Op.or]: [
            { user_id: userId, status: 'accepted' },
            { friend_id: userId, status: 'accepted' }
          ]
        }
      });
      return friendsCount;
    } catch (error) {
      console.error("Ошибка при подсчете друзей:", error);
      return 0;
    }
  }

  // Проверка достижений для конкретной сессии
  async checkSessionAchievements(userId, gameSessionId) {
    try {
      const newAchievements = [];

      // Получаем данные сессии
      const userSession = await UserSession.findOne({
        where: { user_id: userId, game_session_id: gameSessionId }
      });

      if (!userSession) return [];

      const sessionScore = Number(userSession.score || 0);

      // Достижение "Богач сессии"
      if (sessionScore >= 500) {
        const achievement = await this.awardAchievement(userId, 'session_rich', gameSessionId, {
          sessionScore,
          timestamp: new Date()
        });
        if (achievement) newAchievements.push(achievement);
      }

      // Проверяем, является ли пользователь лидером лобби
      const allSessions = await UserSession.findAll({
        where: { game_session_id: gameSessionId },
        order: [['score', 'DESC']]
      });

      if (allSessions.length > 1 && allSessions[0].user_id === userId) {
        const achievement = await this.awardAchievement(userId, 'lobby_leader', gameSessionId, {
          sessionScore,
          playersCount: allSessions.length,
          timestamp: new Date()
        });
        if (achievement) newAchievements.push(achievement);
      }

      // Проверяем достижение "Командный игрок"
      if (allSessions.length >= 4) {
        const achievement = await this.awardAchievement(userId, 'team_player', gameSessionId, {
          playersCount: allSessions.length,
          timestamp: new Date()
        });
        if (achievement) newAchievements.push(achievement);
      }

      return newAchievements;
    } catch (error) {
      console.error("Ошибка при проверке достижений сессии:", error);
      return [];
    }
  }
}

const achievementController = new AchievementController();
module.exports = achievementController;
