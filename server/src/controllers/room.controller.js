const { Game_sessions } = require("../../db/models");

class RoomController {
  // отдать перечень всех комнат
  async getAllRooms(req, res) {
    try {
      const data = await Game_sessions.findAll();
      res.status(200).json({ message: "success", data });
      return;
    } catch (error) {
      console.log("ошибка на сервере", error);
      res.status(500).json(error);
      return;
    }
  }

  // отдать всех пользователей в комнате
  async getUsers(req, res) {}

  // создать новую комнату
  async createRoom(req, res) {
    try {
      const {
        phase_id,
        current_topic_id,
        current_question_id,
        room_code,
        is_active,
        room_mame,
      } = req.body;

      if (
        !phase_id ||
        !current_topic_id ||
        !current_question_id ||
        !room_code ||
        !is_active ||
        !room_mame
      ) {
        return res
          .status(400)
          .send("Не все обязательные поля переданы с клиента");
      }

      const room = await Game_sessions.create({
        phase_id,
        current_topic_id,
        current_question_id,
        room_code,
        is_active,
        room_mame,
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
      const data = await Game_sessions.update(
        {
          room_name
        },
        { where: { id: +id } }
      );
  
      const newData = await Game_sessions.findByPk(id);
  
      res.status(200).json({ message: "success", data: newData });
      return;
    } catch ({ message }) {
      console.log("ошибка на сервере", error);
      res.status(500).json(error);
      return;
    }
  }

  // удалить комнату
  async deleteRoom(req, res) {}
}

module.exports = new RoomController();
