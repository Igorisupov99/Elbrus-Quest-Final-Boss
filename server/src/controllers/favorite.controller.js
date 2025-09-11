const { User, Question, Topic, UserFavoriteQuestion } = require("../../db/models");

class FavoriteController {
  // Добавить вопрос в избранное
  async addToFavorites(req, res) {
    try {
      const userId = req.user.id;
      const { questionId } = req.body;

      if (!questionId) {
        return res.status(400).json({ error: "Question ID обязателен" });
      }

      // Проверяем существование вопроса
      const question = await Question.findByPk(questionId);
      if (!question) {
        return res.status(404).json({ error: "Вопрос не найден" });
      }

      // Проверяем, не добавлен ли уже в избранное
      const existingFavorite = await UserFavoriteQuestion.findOne({
        where: {
          user_id: userId,
          question_id: questionId
        }
      });

      if (existingFavorite) {
        return res.status(409).json({ error: "Вопрос уже в избранном" });
      }

      // Добавляем в избранное
      const favorite = await UserFavoriteQuestion.create({
        user_id: userId,
        question_id: questionId
      });

      res.status(201).json({
        message: "Вопрос добавлен в избранное",
        favorite: {
          id: favorite.id,
          questionId: favorite.question_id,
          createdAt: favorite.createdAt
        }
      });
    } catch (error) {
      console.error("Ошибка при добавлении в избранное:", error);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  }

  // Удалить вопрос из избранного
  async removeFromFavorites(req, res) {
    try {
      const userId = req.user.id;
      const { questionId } = req.params;

      if (!questionId) {
        return res.status(400).json({ error: "Question ID обязателен" });
      }

      const deletedCount = await UserFavoriteQuestion.destroy({
        where: {
          user_id: userId,
          question_id: questionId
        }
      });

      if (deletedCount === 0) {
        return res.status(404).json({ error: "Вопрос не найден в избранном" });
      }

      res.json({ message: "Вопрос удален из избранного" });
    } catch (error) {
      console.error("Ошибка при удалении из избранного:", error);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  }

  // Получить все избранные вопросы пользователя
  async getUserFavorites(req, res) {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const { count, rows: favorites } = await UserFavoriteQuestion.findAndCountAll({
        where: { user_id: userId },
        include: [
          {
            model: Question,
            as: 'question',
            include: [
              {
                model: Topic,
                as: 'topic',
                attributes: ['id', 'title', 'phase_id']
              }
            ]
          }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      const formattedFavorites = favorites.map(favorite => ({
        id: favorite.id,
        questionId: favorite.question_id,
        question: {
          id: favorite.question.id,
          text: favorite.question.question_text,
          correctAnswer: favorite.question.correct_answer,
          questionType: favorite.question.question_type,
          mentorTip: favorite.question.mentor_tip,
          topic: {
            id: favorite.question.topic.id,
            title: favorite.question.topic.title,
            phaseId: favorite.question.topic.phase_id
          }
        },
        createdAt: favorite.createdAt
      }));

      res.json({
        favorites: formattedFavorites,
        pagination: {
          currentPage: page,
          totalPages: count > 0 ? Math.ceil(count / limit) : 1,
          totalItems: count,
          itemsPerPage: limit
        }
      });
    } catch (error) {
      console.error("Ошибка при получении избранных вопросов:", error);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  }

  // Проверить, находится ли вопрос в избранном
  async checkIfFavorite(req, res) {
    try {
      const userId = req.user.id;
      const { questionId } = req.params;

      if (!questionId) {
        return res.status(400).json({ error: "Question ID обязателен" });
      }

      const favorite = await UserFavoriteQuestion.findOne({
        where: {
          user_id: userId,
          question_id: questionId
        }
      });

      res.json({ isFavorite: !!favorite });
    } catch (error) {
      console.error("Ошибка при проверке избранного:", error);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  }
}

module.exports = new FavoriteController();
