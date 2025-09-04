const express = require('express');
const questionRouter = express.Router();
const questionController = require('../controllers/question.controller');
const authMiddleware = require('../middlewares/auth.middleware');


questionRouter.get("/textQuestion", questionController.getQuestion)  // отдать текст вопроса

questionRouter.post("/answerCheck", authMiddleware, questionController.answerCheck)  // отдать текст вопроса

module.exports = questionRouter;