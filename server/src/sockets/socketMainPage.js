const db = require('../../db/models');

function initMainPageSockets(nsp) {
  nsp.on('connection', async (socket) => {
    console.log(`✅ User connected to main page: ${socket.user.username}`);

    try {
      const lastMessages = await db.ChatMessage.findAll({
        include: [
          {
            model: db.User,
            as: 'user',
            attributes: ['id', 'username'],
          },
        ],
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
    } catch (err) {
      console.error('❌ Ошибка при загрузке истории чата:', err);
      socket.emit('error', { message: 'Не удалось загрузить историю чата' });
    }

    socket.on('chat:message', async (text) => {
      try {
        if (!text || typeof text !== 'string' || !text.trim()) {
          socket.emit('error', { message: 'Сообщение некорректно' });
          return;
        }

        const created = await db.ChatMessage.create({
          user_id: socket.user.id,
          message: text.trim(),
        });

        const dto = {
          id: created.id,
          text: created.message,
          user: { id: socket.user.id, username: socket.user.username },
          createdAt: created.createdAt,
        };

        nsp.emit('chat:message', dto);
      } catch (err) {
        console.error('❌ Ошибка при сохранении сообщения (main):', err);
        socket.emit('error', { message: 'Не удалось сохранить сообщение' });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`❌ Main page socket disconnected: ${socket.id}, reason=${reason}`);
    });
  });
}

module.exports = initMainPageSockets;
