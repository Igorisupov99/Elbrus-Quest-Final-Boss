const express = require('express');
const questionRouter = express.Router();
const questionController = require('../controllers/question.controller');


questionRouter.get("/textQuestion", questionController.getQuestion)  // отдать текст вопроса

questionRouter.post("/answerCheck", questionController.answerCheck)  // отдать текст вопроса

module.exports = questionRouter;