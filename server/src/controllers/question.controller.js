const { Phase, Topic, Question, User, UserSession } = require("../../db/models");

// 👇 теперь ключ = lobbyId, а не userId_lobbyId
const incorrectAnswersMap = new Map();

class QuestionController {
  // ОТДАТЬ ТЕКСТ ВОПРОСА
  async getQuestion(req, res) {
    try {
      const phaseIdRaw = req.query.phase_id;
      const topicIdRaw = req.query.topic_id;

      const phaseId = phaseIdRaw ? Number(phaseIdRaw) : NaN;
      const topicId = topicIdRaw ? Number(topicIdRaw) : NaN;

      if (!phaseIdRaw || !topicIdRaw || Number.isNaN(phaseId) || Number.isNaN(topicId)) {
        return res.status(400).json({ error: "Параметры phase_id и topic_id обязательны и должны быть числами" });
      }

      if (!Number.isInteger(phaseId) || phaseId <= 0 || !Number.isInteger(topicId) || topicId <= 0) {
        return res.status(400).json({ error: "Параметры должны быть положительными целыми числами" });
      }

      const phase = await Phase.findByPk(phaseId, { attributes: ["id"] });
      if (!phase) {
        return res.status(404).json({ error: "Фаза не найдена" });
      }

      const topic = await Topic.findOne({
        where: { id: topicId },
        attributes: ["id", "phase_id", "title"],
      });

      if (!topic) {
        return res.status(404).json({ error: "Топик не найден" });
      }

      if (Number(topic.phase_id) !== phaseId) {
        return res.status(400).json({ error: "Топик не принадлежит указанной фазе" });
      }

      const questionsCount = await Question.count({ where: { topic_id: topicId } });
      if (questionsCount === 0) {
        return res.status(404).json({ error: "В данном топике нет вопросов" });
      }

      const randomOffset = Math.floor(Math.random() * questionsCount);
      const randomQuestion = await Question.findOne({
        where: { topic_id: topicId },
        attributes: ["question_text", "id", "mentor_tip"],
        order: [["id", "ASC"]],
        offset: randomOffset,
        limit: 1,
      });

      if (!randomQuestion) {
        return res.status(500).json({ error: "Не удалось выбрать случайный вопрос" });
      }

      return res.json({
        question_text: randomQuestion.question_text,
        question_id: randomQuestion.id,
        topic_title: topic.title,
        mentor_tip: randomQuestion.mentor_tip,
      });
    } catch (error) {
      console.error("Ошибка на сервере:", error);
      return res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  }

  // ПРОВЕРКА КОРРЕКТНОСТИ ОТВЕТА
  async answerCheck(req, res) {
    try {
      const { question_id, answer, lobby_id } = req.body;
      const userId = req.user.id;
      const io = req.io;

      if (!question_id) {
        return res.status(400).json({ error: "Параметр question_id обязателен" });
      }

      const question = await Question.findByPk(question_id, {
        attributes: ["correct_answer", "question_text"],
      });

      if (!question) {
        return res.status(404).json({ error: "Вопрос не найден" });
      }

      const normalizedClientAnswer = answer.trim().toLowerCase();
      const normalizedCorrectAnswer = question.correct_answer.trim().toLowerCase();
      const isCorrect = normalizedClientAnswer === normalizedCorrectAnswer;

      let updatedUser = null;
      let updatedSession = null;
      let lobbyTotalScore = 0;
      let incorrectAnswersCount = 0;

      if (isCorrect) {
        const points = 10;

        updatedUser = await User.findByPk(userId);
        if (updatedUser) {
          updatedUser.score = Number(updatedUser.score || 0) + points;
          await updatedUser.save();
        }

        if (lobby_id) {
          // Вернём актуальное значение счётчика неправильных ответов для этого лобби,
          // чтобы клиент не получал 0 и не сбрасывал локальное состояние
          incorrectAnswersCount = incorrectAnswersMap.get(lobby_id) || 0;
          updatedSession = await UserSession.findOne({
            where: { user_id: userId, game_session_id: lobby_id },
          });
          if (updatedSession) {
            updatedSession.score = Number(updatedSession.score || 0) + points;
            await updatedSession.save();
          }
          // Пересчитываем общий счёт лобби
          const allSessions = await UserSession.findAll({ where: { game_session_id: lobby_id } });
          lobbyTotalScore = allSessions.reduce((sum, s) => sum + Number(s.score || 0), 0);
        }

        
      } else {
        // Неправильный ответ - НЕ вычитаем баллы, только увеличиваем счетчик
        updatedUser = await User.findByPk(userId);

        if (lobby_id) {
          // 👇 увеличиваем общий счётчик ошибок лобби
          const current = incorrectAnswersMap.get(lobby_id) || 0;
          incorrectAnswersCount = current + 1;
          incorrectAnswersMap.set(lobby_id, incorrectAnswersCount);
          
          // НЕ вычитаем баллы из сессии лобби
          updatedSession = await UserSession.findOne({
            where: { user_id: userId, game_session_id: lobby_id },
          });
          
          // Пересчитываем общий счёт лобби
          const allSessions = await UserSession.findAll({ where: { game_session_id: lobby_id } });
          lobbyTotalScore = allSessions.reduce((sum, s) => sum + Number(s.score || 0), 0);
        }
      }

      if (lobby_id) {
        const roomName = `lobby:${lobby_id}`;

        if (updatedUser && updatedSession) {
          io.of("/lobby").to(roomName).emit("lobby:scores", {
            userId,
            userScore: updatedUser.score,
            sessionScore: lobbyTotalScore,
          });
          
          // Отправляем уведомление о правильном ответе только если ответ был правильным
          if (isCorrect) {
            io.of("/lobby").to(roomName).emit("lobby:correctAnswer", {
              userId,
              message: "✅ Правильный ответ! (+10 очков)",
            });
          }
          
          console.log("EMIT lobby:scores", {
            userId,
            userScore: updatedUser.score,
            sessionScore: lobbyTotalScore,
          });
        }

        // Убираем отправку lobby:incorrectAnswer при неправильном ответе через API
        // Уведомления о неправильных ответах показываются локально
      }

      return res.json({
        correct: isCorrect,
        correctAnswer: question.correct_answer, // Добавляем правильный ответ в ответ сервера
        scores: {
          userScore: updatedUser?.score || 0,
          sessionScore: lobbyTotalScore,
          incorrectAnswers: incorrectAnswersCount,
        },
      });
    } catch (error) {
      console.error("Ошибка на сервере:", error);
      return res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  }
}

const questionController = new QuestionController();

module.exports = {
  questionController,
  incorrectAnswersMap,
};
