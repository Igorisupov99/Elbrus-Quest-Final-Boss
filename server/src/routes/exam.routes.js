const express = require('express');
const examRouter = express.Router();
const examController = require('../controllers/exam.controller');
const authMiddleware = require('../middlewares/auth.middleware');

examRouter.get("/examQuestion", examController.getExamQuestions)  // отдать вопросы для экзамена

examRouter.post("/examAnswerCheck", examController.examAnswerCheck)  // проверить правильность ответа

examRouter.post("/examReward", authMiddleware, (req, res) => examController.examReward(req, res))  // начислить очки за успешную сдачу экзамена

module.exports = examRouter;