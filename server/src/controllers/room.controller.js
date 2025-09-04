const { GameSession } = require("../../db/models");

class RoomController {
  // отдать перечень всех комнат
  async getAllRooms(req, res) {
    try {
      const data = await GameSession.findAll();
      res.status(200).json({ message: "success", data });
      return;
    } catch (error) {
      console.log("ошибка на сервере", error);
      res.status(500).json(error);
      return;
    }
  }
// создать новую комнату
  async createRoom(req, res) {
    try {
      const {
        phase_id,
        current_topic_id,
        current_question_id,
        room_code,
        is_active,
        room_name,
        room_creator
      } = req.body;

      if (
        !phase_id ||
        !current_topic_id ||
        !current_question_id ||
        !room_code ||
        !is_active ||
        !room_name ||
        !room_creator
      ) {
        return res
          .status(400)
          .send("Не все обязательные поля переданы с клиента");
      }

      const room = await GameSession.create({
        phase_id,
        current_topic_id,
        current_question_id,
        room_code,
        is_active,
        room_name,
        room_creator
      });

      res.status(201).json({ message: "success", data: room });
    } catch (error) {
      console.log("Ошибка на сервере:", error);
      res.status(500).json({ message: "Ошибка сервера", error });
    }
  }

  // изменить название комнаты

  async changeRoomName(req, res) {
    try {
      const { id } = req.params;
      const { room_name } = req.body;
      const currentUserId = req.user.id;
  
      if (!room_name) {
        return res.status(400).json({ message: "Поле room_name обязательно" });
      }
  

      const room = await GameSession.findByPk(id);

  
      if (!room) {
        return res.status(404).json({ message: "Комната с таким id не найдена" });
      }

 
  
      if (room.room_creator !== currentUserId) {
        return res.status(403).json({ message: "Изменять название комнаты может только её создатель" });
      }
  
      room.room_name = room_name;
      await room.save();
  
      res.status(200).json({ message: "success", data: room });
    } catch (error) {
      console.log("ошибка на сервере", error);
      res.status(500).json({ message: "Ошибка сервера", error: error.message });
    }
  }

  // удалить комнату
  async deleteRoom(req, res) {
    try {
      const { id } = req.params;
      const currentUserId = req.user.id;  

  
      const room = await GameSession.findByPk(id);

      if (!room) {
        return res.status(404).json({ message: "Комната не найдена" });
      }


      if (room.room_creator !== currentUserId) {
        return res.status(403).json({ message: "Нет прав на удаление этой комнаты" });
      }

 
      await room.destroy();

      res.status(200).json({ message: "Комната успешно удалена" });
    } catch (error) {
      console.error("Ошибка на сервере:", error);
      res.status(500).json({ message: "Ошибка сервера", error: error.message });
    }
  }
}

module.exports = new RoomController();
