const { GameSession } = require('../../db/models');

class RoomController {
  // отдать перечень всех комнат
  async getAllRooms(req, res) {
    try {
      const data = await GameSession.findAll();
      res.status(200).json({ message: 'success', data });
      return;
    } catch (error) {
      console.log('ошибка на сервере', error);
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
      } = req.body;

      if (
        !phase_id ||
        !current_topic_id ||
        !current_question_id ||
        !is_active ||
        !room_name
      ) {
        return res
          .status(400)
          .send('Не все обязательные поля переданы с клиента');
      }

      // берем id из авторизации
      const room_creator = req.user.id;

      const room = await GameSession.create({
        phase_id,
        current_topic_id,
        current_question_id,
        room_code,
        is_active,
        room_name,
        room_creator,
      });

      // Emit room creation event to all connected clients
      console.log('🏠 Room created, attempting to emit socket event...');
      if (global.emitRoomUpdate && global.io) {
        console.log('✅ Socket functions available, emitting...');
        global.emitRoomUpdate(global.io, 'created', {
          id: room.id,
          title: room.room_name,
          room_creator: room.room_creator,
          room_code: room.room_code,
        });
      } else {
        console.log('❌ Socket functions not available:', {
          emitRoomUpdate: !!global.emitRoomUpdate,
          io: !!global.io,
        });
      }

      res.status(201).json({ message: 'success', data: room });
    } catch (error) {
      console.log('Ошибка на сервере:', error);
      res.status(500).json({ message: 'Ошибка сервера', error });
    }
  }

  // изменить название комнаты

  async changeRoomName(req, res) {
    try {
      const { id } = req.params;
      const { room_name } = req.body;
      const currentUserId = req.user.id;

      if (!room_name) {
        return res.status(400).json({ message: 'Поле room_name обязательно' });
      }

      const room = await GameSession.findByPk(id);

      if (!room) {
        return res
          .status(404)
          .json({ message: 'Комната с таким id не найдена' });
      }

      if (room.room_creator !== currentUserId) {
        return res.status(403).json({
          message: 'Изменять название комнаты может только её создатель',
        });
      }

      room.room_name = room_name;
      await room.save();

      // Emit room update event to all connected clients
      console.log('✏️ Room updated, attempting to emit socket event...');
      if (global.emitRoomUpdate && global.io) {
        console.log('✅ Socket functions available, emitting...');
        global.emitRoomUpdate(global.io, 'updated', {
          id: room.id,
          title: room.room_name,
          room_creator: room.room_creator,
          room_code: room.room_code,
        });
      } else {
        console.log('❌ Socket functions not available:', {
          emitRoomUpdate: !!global.emitRoomUpdate,
          io: !!global.io,
        });
      }

      res.status(200).json({ message: 'success', data: room });
    } catch (error) {
      console.log('ошибка на сервере', error);
      res.status(500).json({ message: 'Ошибка сервера', error: error.message });
    }
  }

  // удалить комнату
  async deleteRoom(req, res) {
    try {
      const { id } = req.params;
      const currentUserId = req.user.id;

      const room = await GameSession.findByPk(id);

      if (!room) {
        return res.status(404).json({ message: 'Комната не найдена' });
      }

      if (room.room_creator !== currentUserId) {
        return res
          .status(403)
          .json({ message: 'Нет прав на удаление этой комнаты' });
      }

      // Store room data before deletion for socket emission
      const roomData = {
        id: room.id,
        title: room.room_name,
        room_creator: room.room_creator,
      };

      await room.destroy();

      // Emit room deletion event to all connected clients
      console.log('🗑️ Room deleted, attempting to emit socket event...');
      if (global.emitRoomUpdate && global.io) {
        console.log('✅ Socket functions available, emitting...');
        global.emitRoomUpdate(global.io, 'deleted', roomData);
      } else {
        console.log('❌ Socket functions not available:', {
          emitRoomUpdate: !!global.emitRoomUpdate,
          io: !!global.io,
        });
      }

      res.status(200).json({ message: 'Комната успешно удалена' });
    } catch (error) {
      console.error('Ошибка на сервере:', error);
      res.status(500).json({ message: 'Ошибка сервера', error: error.message });
    }
  }
  //Проверить, защищена ли комната паролем (нужна ли модалка)
  async checkAccess(req, res) {
    try {
      const { id } = req.params;
      const room = await GameSession.findByPk(id, {
        attributes: ['id', 'room_name', 'room_code', 'is_active'],
      });

      if (!room) {
        return res
          .status(404)
          .json({ success: false, message: 'Комната не найдена' });
      }

      const requiresPassword = !!room.room_code; // null/'' -> false, иначе true
      return res.status(200).json({
        success: true,
        data: { roomId: room.id, requiresPassword },
      });
    } catch (error) {
      console.error('Ошибка checkAccess:', error);
      return res
        .status(500)
        .json({ success: false, message: 'Ошибка сервера' });
    }
  }
  // 2) (на потом) Проверить введённый пароль
  async verifyRoomCode(req, res) {
    try {
      const { id } = req.params;
      const { code } = req.body; // { code: '...' }

      const room = await GameSession.findByPk(id, {
        attributes: ['id', 'room_code'],
      });

      if (!room) {
        return res
          .status(404)
          .json({ success: false, message: 'Комната не найдена' });
      }

      if (!room.room_code) {
        return res
          .status(200)
          .json({ success: true, message: 'Пароль не требуется' });
      }

      if (String(code) === String(room.room_code)) {
        return res
          .status(200)
          .json({ success: true, message: 'Пароль верный' });
      }

      return res
        .status(403)
        .json({ success: false, message: 'Неверный пароль' });
    } catch (error) {
      console.error('Ошибка verifyRoomCode:', error);
      return res
        .status(500)
        .json({ success: false, message: 'Ошибка сервера' });
    }
  }

  // Проверить, является ли текущий пользователь создателем комнаты

  async checkCreator(req, res) {
    try {
      const currentUserId = req.user.id;

      const rooms = await GameSession.findAll({
        where: { room_creator: currentUserId },
        attributes: ['id', 'room_name', 'room_creator'],
      });

      return res.status(200).json({
        success: true,
        data: rooms,
      });
    } catch (error) {
      console.error('Ошибка getUserRooms:', error);
      return res.status(500).json({
        success: false,
        message: 'Ошибка сервера',
      });
    }
  }
}

module.exports = new RoomController();
