const { Topic, Question, Phase } = require("../../db/models");

class ExamController {
  async getExamQuestions(req, res) {
    try {
      const phase_id = parseInt(req.query.phase_id, 10);
      const count = parseInt(req.query.count, 10);

      if (isNaN(phase_id) || isNaN(count) || count <= 0) {
        return res.status(400).json({ error: "Неверные параметры phase_id или count" });
      }

      // Получаем все топики для фазы
      const topics = await Topic.findAll({
        where: { phase_id },
        include: [{
          model: Question,
          as: 'questions',
          attributes: ['id', 'question_text'],
        }],
      });

      if (topics.length === 0) {
        return res.status(404).json({ error: "Топики для данной фазы не найдены" });
      }

      // Функция для перемешивания массива 
      function mixArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
      }

      // Перемешиваем топики
      const mixTopics = mixArray(topics);

      const selectedQuestions = [];

// Проходим по топикам и собираем вопросы
for (const topic of mixTopics) {
    if (selectedQuestions.length >= count) break;
  
    const questions = topic.questions;
    if (!questions || questions.length === 0) continue;
  
    // Перемешиваем вопросы топика
    const mixQuestions = mixArray(questions);
  
    // Сколько вопросов нужно взять из этого топика
    const needed = count - selectedQuestions.length;
  
    // Добавляем нужное количество вопросов
    const questionsToAdd = mixQuestions.slice(0, needed).map(q => ({
      id: q.id,
      question_text: q.question_text,
      topic_id: topic.id,  // добавляем id топика
      phase_id: phase_id,  // добавляем id фазы
      topic_title: topic.title
    }));
  
    selectedQuestions.push(...questionsToAdd);
  }
  
  if (selectedQuestions.length === 0) {
    return res.status(404).json({ error: "Вопросы для данной фазы не найдены" });
  }
  
  // Возвращаем вопросы с id, текстом и id топика
  
  return res.json({ questions: selectedQuestions });

    } catch (error) {
      console.error("Ошибка на сервере:", error);
      return res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  }

  // НАЧИСЛЕНИЕ ОЧКОВ ЗА УСПЕШНУЮ СДАЧУ ЭКЗАМЕНА
  async examReward(req, res) {
    try {
      const { lobby_id } = req.body;
      const userId = req.user.id;

      if (!lobby_id) {
        return res.status(400).json({ error: "Параметр lobby_id обязателен" });
      }

      const { User, UserSession } = require("../../db/models");
      const rewardPoints = 30;

      // Начисляем очки пользователю
      const user = await User.findByPk(userId);
      if (user) {
        user.score = Number(user.score || 0) + rewardPoints;
        await user.save();
      }

      // Начисляем очки в сессии лобби
      const userSession = await UserSession.findOne({
        where: { user_id: userId, game_session_id: lobby_id },
      });
      if (userSession) {
        userSession.score = Number(userSession.score || 0) + rewardPoints;
        await userSession.save();
      }

      // Пересчитываем общий счёт лобби
      const allSessions = await UserSession.findAll({ where: { game_session_id: lobby_id } });
      const lobbyTotalScore = allSessions.reduce((sum, s) => sum + Number(s.score || 0), 0);

      return res.json({
        success: true,
        rewardPoints,
        userScore: user.score,
        sessionScore: lobbyTotalScore,
      });
    } catch (error) {
      console.error("Ошибка при начислении очков за экзамен:", error);
      return res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  }

  // ПРОВЕРКА ПРАВИЛЬНОСТИ ОТВЕТА
  async examAnswerCheck(req, res) {
    try {
      const { phase_id, topic_id, question_id, answer } = req.body;

      // Проверяем наличие всех параметров
      if (
        !phase_id || !topic_id || !question_id ||
        typeof answer !== 'string' || answer.trim() === ''
      ) {
        return res.status(400).json({ error: "Отсутствуют необходимые параметры или ответ пустой" });
      }

      // Проверяем, что фаза существует
      const phase = await Phase.findByPk(phase_id);
      if (!phase) {
        return res.status(404).json({ error: "Фаза не найдена" });
      }

      // Проверяем, что топик существует и принадлежит фазе
      const topic = await Topic.findOne({
        where: { id: topic_id, phase_id }
      });
      if (!topic) {
        return res.status(404).json({ error: "Топик не найден или не принадлежит указанной фазе" });
      }

      // Проверяем, что вопрос существует и принадлежит топику
      const question = await Question.findOne({
        where: { id: question_id, topic_id }
      });
      if (!question) {
        return res.status(404).json({ error: "Вопрос не найден или не принадлежит указанному топику" });
      }

      // Сравниваем ответ пользователя с правильным ответом
    
      const correctAnswer = question.correct_answer.trim().toLowerCase();
      const userAnswer = answer.trim().toLowerCase();

      const isCorrect = correctAnswer === userAnswer;

      return res.json({
        question_id,
        topic_id,
        phase_id,
        correct: isCorrect,
        correct_answer: question.correct_answer
      });

    } catch (error) {
      console.error("Ошибка на сервере:", error);
      return res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  }

}

const examController = new ExamController();
module.exports = examController;