const express = require('express');
const examRouter = express.Router();
const examController = require('../controllers/exam.controller');

examRouter.get("/examQuestion", examController.getExamQuestions)  // отдать вопросы для экзамена

examRouter.post("/examAnswerCheck", examController.examAnswerCheck)  // проверить правильность ответа

module.exports = examRouter;