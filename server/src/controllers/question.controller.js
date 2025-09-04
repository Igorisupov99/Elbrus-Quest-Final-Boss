const { Phase, Topic, Question } = require("../../db/models");

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

      // Проверяем существование фазы
      const phase = await Phase.findByPk(phaseId, { attributes: ["id"] });
      if (!phase) {
        return res.status(404).json({ error: "Фаза не найдена" });
      }

      // Проверяем топик и принадлежность фазе
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

      // Считаем количество вопросов
      const questionsCount = await Question.count({ where: { topic_id: topicId } });

      if (questionsCount === 0) {
        return res.status(404).json({ error: "В данном топике нет вопросов" });
      }

      // Выбираем случайный вопрос
      const randomOffset = Math.floor(Math.random() * questionsCount);

      const randomQuestion = await Question.findOne({
        where: { topic_id: topicId },
        attributes: ["question_text", "id"],
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
      });
    } catch (error) {
      console.error("Ошибка на сервере:", error);
      return res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  }

  // ПРОВЕРКА КОРРЕКТНОСТИ ОТВЕТА
  async answerCheck(req, res) {
    try {
      const { question_id, answer } = req.body;

      if (!question_id || !answer) {
        return res.status(400).json({ error: "Параметры question_id и answer обязательны" });
      }

      const question = await Question.findByPk(question_id, {
        attributes: ["correct_answer"],
      });

      if (!question) {
        return res.status(404).json({ error: "Вопрос не найден" });
      }

      const normalizedClientAnswer = answer.trim().toLowerCase();
      const normalizedCorrectAnswer = question.correct_answer.trim().toLowerCase();

      const isCorrect = normalizedClientAnswer === normalizedCorrectAnswer;

      return res.json({ correct: isCorrect });
    } catch (error) {
      console.error("Ошибка на сервере:", error);
      return res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  }
}

module.exports = new QuestionController();