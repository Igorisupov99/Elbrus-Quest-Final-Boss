const db = require('../../db/models');

const lobbyUsers = new Map();
const lobbyPoints = new Map();
const lobbyTimeouts = new Map();

function initLobbySockets(nsp) {
  nsp.on('connection', async (socket) => {
    const { lobbyId } = socket.handshake.auth;
    if (!lobbyId) {
      socket.emit('error', { message: 'Лобби не указано' });
      socket.disconnect();
      return;
    }

    if (lobbyTimeouts.has(lobbyId)) {
      clearTimeout(lobbyTimeouts.get(lobbyId));
      lobbyTimeouts.delete(lobbyId);
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

    // Функция для отправки списка пользователей и активного игрока
    async function emitUsersList() {
      try {
        const users = Array.from(lobbyUsers.get(lobbyId).values());
        
        // Получаем активного игрока из БД
        const activeUserSession = await db.UserSession.findOne({
          where: { 
            game_session_id: lobbyId,
            is_user_active: true 
          },
          include: [{ model: db.User, as: 'user' }]
        });
        
        const activePlayerId = activeUserSession ? activeUserSession.user.id : null;
        
        nsp.to(roomKey).emit('lobby:users', { 
          users, 
          activePlayerId 
        });
      } catch (err) {
        console.error('Ошибка при получении активного игрока:', err);
        const users = Array.from(lobbyUsers.get(lobbyId).values());
        const activePlayerId = users.length > 0 ? users[0].id : null;
        nsp.to(roomKey).emit('lobby:users', { users, activePlayerId });
      }
    }

    // Функция для передачи хода следующему игроку
    async function passTurnToNextPlayer() {
      try {
        // Получаем текущего активного игрока
        const currentActivePlayer = await db.UserSession.findOne({
          where: {
            game_session_id: lobbyId,
            is_user_active: true
          }
        });

        if (!currentActivePlayer) return;

        // Получаем всех игроков в лобби
        const allPlayers = await db.UserSession.findAll({
          where: {
            game_session_id: lobbyId
          },
          order: [['createdAt', 'ASC']],
          include: [{ model: db.User, as: 'user' }]
        });

        if (allPlayers.length <= 1) return; // Если только один игрок

        // Находим индекс текущего активного игрока
        const currentIndex = allPlayers.findIndex(player => 
          player.id === currentActivePlayer.id
        );

        // Вычисляем индекс следующего игрока
        const nextIndex = (currentIndex + 1) % allPlayers.length;
        const nextPlayer = allPlayers[nextIndex];

        // Обновляем активного игрока в БД
        await db.UserSession.update(
          { is_user_active: false },
          { where: { id: currentActivePlayer.id } }
        );

        await db.UserSession.update(
          { is_user_active: true },
          { where: { id: nextPlayer.id } }
        );

        console.log(`🎮 Ход передан от ${currentActivePlayer.player_name} к ${nextPlayer.player_name}`);

        // Отправляем обновление всем клиентам
        await emitUsersList();

      } catch (err) {
        console.error('Ошибка при передаче хода:', err);
      }
    }

    console.log(`Пользователь подключился  ${lobbyId}: ${socket.user.username}`);

    // Проверяем и создаем запись UserSession если нужно
    try {
      const userSession = await db.UserSession.findOne({
        where: {
          game_session_id: lobbyId,
          user_id: socket.user.id
        }
      });
      
      if (!userSession) {
        await db.UserSession.create({
          game_session_id: lobbyId,
          user_id: socket.user.id,
          score: 0,
          is_user_active: false,
          player_name: socket.user.username
        });
      }
    } catch (err) {
      console.error('Ошибка создания :', err);
    }

    // Инициализация активного игрока
    try {
      // Проверяем, есть ли уже активный игрок в этой сессии
      const existingActivePlayer = await db.UserSession.findOne({
        where: { 
          game_session_id: lobbyId,
          is_user_active: true 
        }
      });
      
      // Если активного игрока нет, делаем первого подключившегося активным
      if (!existingActivePlayer) {
        await db.UserSession.update(
          { is_user_active: true },
          { 
            where: { 
              game_session_id: lobbyId,
              user_id: socket.user.id 
            }
          }
        );
      }
    } catch (err) {
      console.error('Ошибка инициализации активного игрока:', err);
    }

    // Отправляем список пользователей
    await emitUsersList();

    // Загрузка истории сообщений
    (async () => {
      try {
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
      } catch (err) {
        console.error('Ошибка загрузки истории чата:', err);
      }
    })();

    // Инициализация точек
    if (!lobbyPoints.has(lobbyId)) {
      lobbyPoints.set(lobbyId, [
        { id: "1", status: "available" },
        { id: "2", status: "available" },
        { id: "3", status: "available" },
        { id: "4", status: "available" },
      ]);
    }
    socket.emit("lobby:initPoints", lobbyPoints.get(lobbyId));

    // Системное событие о подключении
    nsp.to(roomKey).emit('system', {
      type: 'join',
      userId: socket.user.id,
      username: socket.user.username,
    });

    // Обработчик сообщений чата
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
        console.error('Ошибка при сохранении сообщения:', err);
        socket.emit('error', { message: 'Не удалось сохранить сообщение' });
      }
    });

    // Обработчик выхода из лобби
    socket.on('leaveLobby', async () => {
      try {
        // Проверяем, был ли это активный игрок
        const wasActive = await db.UserSession.findOne({
          where: {
            game_session_id: lobbyId,
            user_id: socket.user.id,
            is_user_active: true
          }
        });
        
        if (wasActive) {
          // Находим следующего игрока
          const nextPlayer = await db.UserSession.findOne({
            where: {
              game_session_id: lobbyId,
              user_id: { [db.Sequelize.Op.ne]: socket.user.id }
            },
            order: [['createdAt', 'ASC']]
          });
          
          if (nextPlayer) {
            // Делаем следующего игрока активным
            await db.UserSession.update(
              { is_user_active: true },
              { where: { id: nextPlayer.id } }
            );
            
            // Сбрасываем предыдущего активного
            await db.UserSession.update(
              { is_user_active: false },
              { where: { id: wasActive.id } }
            );
          }
        }
      } catch (err) {
        console.error('Ошибка при обработке выхода активного игрока:', err);
      }

      socket.leave(roomKey);
      
      // Удаляем пользователя из списка
      if (lobbyUsers.has(lobbyId)) {
        lobbyUsers.get(lobbyId).delete(socket.id);
        await emitUsersList();
      }
      
      nsp.to(roomKey).emit('system', {
        type: 'leave',
        userId: socket.user.id,
        username: socket.user.username,
      });
    });

    // Обработчик ответа на вопрос
    socket.on('lobby:answer', async ({ pointId, correct }) => {
      const status = correct ? 'completed' : 'locked';

      // Обновляем состояние точки
      const points = lobbyPoints.get(lobbyId);
      if (points) {
        const point = points.find(p => p.id === pointId);
        if (point) point.status = status;
      }

      // Отправляем обновление состояния точки
      nsp.to(roomKey).emit('lobby:updatePointStatus', { pointId, status });

      // Если ответ правильный - передаем ход следующему игроку
      if (correct) {
        await passTurnToNextPlayer();
      }
    });

    // Обработчик отключения
    socket.on('disconnect', async (reason) => {
      console.log(`Сокет отключён: ${socket.id}, reason=${reason}`);
      
      try {
        // Проверяем, был ли это активный игрок
        const wasActive = await db.UserSession.findOne({
          where: {
            game_session_id: lobbyId,
            user_id: socket.user.id,
            is_user_active: true
          }
        });
        
        if (wasActive) {
          // Находим следующего игрока
          const nextPlayer = await db.UserSession.findOne({
            where: {
              game_session_id: lobbyId,
              user_id: { [db.Sequelize.Op.ne]: socket.user.id }
            },
            order: [['createdAt', 'ASC']]
          });
          
          if (nextPlayer) {
            // Делаем следующего игрока активным
            await db.UserSession.update(
              { is_user_active: true },
              { where: { id: nextPlayer.id } }
            );
            
            // Сбрасываем предыдущего активного
            await db.UserSession.update(
              { is_user_active: false },
              { where: { id: wasActive.id } }
            );

            // Отправляем обновление
            await emitUsersList();
          }
        }
      } catch (err) {
        console.error('Ошибка при обработке отключения активного игрока:', err);
      }
      
      // Удаляем пользователя из списка
      if (lobbyUsers.has(lobbyId)) {
        lobbyUsers.get(lobbyId).delete(socket.id);
        await emitUsersList();
      }

      // Устанавливаем таймаут на очистку точек если лобби пустое
      if (lobbyUsers.has(lobbyId) && lobbyUsers.get(lobbyId).size === 0) {
        const timeoutId = setTimeout(() => {
          lobbyPoints.delete(lobbyId);
          lobbyTimeouts.delete(lobbyId);
        }, 5 * 60 * 1000);

        lobbyTimeouts.set(lobbyId, timeoutId);
      }
    });
  });
}

module.exports = initLobbySockets;