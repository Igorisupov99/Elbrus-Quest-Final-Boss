const express = require('express');
const roomRouter = express.Router();
const {Game_sessions} = require('../../db/models')

// создать новую комнату

roomRouter.post("/new", async (req, res) => {
    try {
      const { phase_id, current_topic_id, current_question_id, room_code, is_active, room_mame } = req.body;
      
      if (!phase_id || !current_topic_id || !current_question_id || !room_code || !is_active || !room_mame) {
        return res.status(400).send("Не все обязательные поля переданы с клиента");
      }
      
      const room = await Game_sessions.create({ phase_id, current_topic_id, current_question_id, room_code, is_active, room_mame });
  
      res.status(201).json({ message: "success", data: room });
    } catch (error) {
      console.log("Ошибка на сервере:", error);
      res.status(500).json({ message: "Ошибка сервера", error });
    }
  });

module.exports = roomRouter;