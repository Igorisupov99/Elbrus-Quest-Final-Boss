const db = require('../../db/models');

const lobbyUsers = new Map(); // ключ — lobbyId, значение — Set(socket.user)

function initLobbySockets(nsp) {
  nsp.on('connection', (socket) => {
    const { lobbyId } = socket.handshake.auth;
    if (!lobbyId) {
      socket.emit('error', { message: 'Лобби не указано' });
      socket.disconnect();
      return;
    }

    socket.lobbyId = lobbyId;
    const roomKey = `lobby:${lobbyId}`;
    socket.join(roomKey);

    // Добавляем пользователя в список
    if (!lobbyUsers.has(lobbyId)) {
      lobbyUsers.set(lobbyId, new Map());
    }
    lobbyUsers.get(lobbyId).set(socket.id, {
      id: socket.user.id,
      username: socket.user.username,
    });

    // Отправляем обновленный список пользователей в комнате всем участникам
    function emitUsersList() {
      const users = Array.from(lobbyUsers.get(lobbyId).values());
      nsp.to(roomKey).emit('lobby:users', users);
    }

    console.log(`✅ User connected to lobby ${lobbyId}: ${socket.user.username}`);

    emitUsersList();

    (async () => {
      const lastMessages = await db.ChatGameSession.findAll({
        where: { game_session_id: lobbyId },
        include: [{ model: db.User, as: 'user', attributes: ['id', 'username'] }],
        order: [['createdAt', 'ASC']],
        limit: 20,
      });

      const history = lastMessages.map((m) => ({
        id: m.id,
        text: m.message,
        user: { id: m.user.id, username: m.user.username },
        createdAt: m.createdAt,
      }));

      socket.emit('chat:history', history);
    })();

    nsp.to(roomKey).emit('system', {
      type: 'join',
      userId: socket.user.id,
      username: socket.user.username,
    });

    socket.on('chat:message', async ({ text }) => {
      try {
        if (!text?.trim()) {
          socket.emit('error', { message: 'Сообщение некорректно' });
          return;
        }

        const created = await db.ChatGameSession.create({
          game_session_id: lobbyId,
          user_id: socket.user.id,
          message: text.trim(),
        });

        const dto = {
          id: created.id,
          text: created.message,
          user: { id: socket.user.id, username: socket.user.username },
          createdAt: created.createdAt,
        };

        nsp.to(roomKey).emit('chat:message', dto);
      } catch (err) {
        console.error('❌ Ошибка при сохранении сообщения (lobby):', err);
        socket.emit('error', { message: 'Не удалось сохранить сообщение' });
      }
    });

    socket.on('leaveLobby', () => {
      socket.leave(roomKey);
      // Удаляем пользователя из списка
      if (lobbyUsers.has(lobbyId)) {
        lobbyUsers.get(lobbyId).delete(socket.id);
        emitUsersList();
      }
      nsp.to(roomKey).emit('system', {
        type: 'leave',
        userId: socket.user.id,
        username: socket.user.username,
      });
    });

    socket.on('disconnect', (reason) => {
      console.log(`❌ Lobby socket disconnected: ${socket.id}, reason=${reason}`);
      if (lobbyUsers.has(lobbyId)) {
        lobbyUsers.get(lobbyId).delete(socket.id);
        emitUsersList();
      }
    });
  });
}

module.exports = initLobbySockets;
