const db = require('../../db/models');
const { incorrectAnswersMap } = require("../controllers/question.controller");

const lobbyUsers = new Map();
const lobbyPoints = new Map();
const lobbyTimeouts = new Map();
const lobbyExamState = new Map(); // lobbyId -> { questions: any[], index: number }

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

    // Обновление очков
    const user = await db.User.findByPk(socket.user.id);
    const session = await db.UserSession.findOne({
      where: { user_id: socket.user.id, game_session_id: lobbyId },
    });

    const incorrectAnswers = incorrectAnswersMap.get(lobbyId) || 0;
    // Общий счёт лобби — сумма по всем участникам
    const allSessions = await db.UserSession.findAll({ where: { game_session_id: lobbyId } });
    const lobbyTotalScore = allSessions.reduce((sum, s) => sum + Number(s.score || 0), 0);

    socket.emit("lobby:initScores", {
      userId: socket.user.id,
      userScore: user?.score ?? 0,
      sessionScore: lobbyTotalScore,
      incorrectAnswers, // общее значение для всей комнаты
    });
    

    // Функция для отправки списка пользователей и активного игрока
    async function emitUsersList() {
      try {
        const users = Array.from(lobbyUsers.get(lobbyId).values());

        const activeUserSession = await db.UserSession.findOne({
          where: {
            game_session_id: lobbyId,
            is_user_active: true,
          },
          include: [{ model: db.User, as: 'user' }],
        });

        const activePlayerId = activeUserSession ? activeUserSession.user.id : null;

        nsp.to(roomKey).emit('lobby:users', { users, activePlayerId });
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
        const currentActivePlayer = await db.UserSession.findOne({
          where: { game_session_id: lobbyId, is_user_active: true },
        });

        if (!currentActivePlayer) return;

        const allPlayers = await db.UserSession.findAll({
          where: { game_session_id: lobbyId },
          order: [['createdAt', 'ASC']],
          include: [{ model: db.User, as: 'user' }],
        });

        if (allPlayers.length <= 1) return;

        const currentIndex = allPlayers.findIndex(
          (player) => player.id === currentActivePlayer.id
        );
        const nextIndex = (currentIndex + 1) % allPlayers.length;
        const nextPlayer = allPlayers[nextIndex];

        await db.UserSession.update(
          { is_user_active: false },
          { where: { id: currentActivePlayer.id } }
        );
        await db.UserSession.update(
          { is_user_active: true },
          { where: { id: nextPlayer.id } }
        );

        console.log(
          `🎮 Ход передан от ${currentActivePlayer.player_name} к ${nextPlayer.player_name}`
        );

        await emitUsersList();
      } catch (err) {
        console.error('Ошибка при передаче хода:', err);
      }
    }

    console.log(`Пользователь подключился ${lobbyId}: ${socket.user.username}`);

    // --- создание / получение UserSession ---
    try {
      let userSession = await db.UserSession.findOne({
        where: { game_session_id: lobbyId, user_id: socket.user.id },
      });

      if (!userSession) {
        userSession = await db.UserSession.create({
          game_session_id: lobbyId,
          user_id: socket.user.id,
          score: 0,
          is_user_active: false,
          player_name: socket.user.username,
        });
      }

      // назначаем активного только если его ещё нет
      const existingActivePlayer = await db.UserSession.findOne({
        where: { game_session_id: lobbyId, is_user_active: true },
      });

      if (!existingActivePlayer) {
        await userSession.update({ is_user_active: true });
        console.log(
          `🎮 Первый активный игрок в лобби ${lobbyId}: ${socket.user.username}`
        );
      }
    } catch (err) {
      console.error('Ошибка инициализации UserSession:', err);
    }

    await emitUsersList();

    // загрузка истории чата
    (async () => {
      try {
        const lastMessages = await db.ChatGameSession.findAll({
          where: { game_session_id: lobbyId },
          include: [
            { model: db.User, as: 'user', attributes: ['id', 'username'] },
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
        console.error('Ошибка загрузки истории чата:', err);
      }
    })();

    // инициализация точек
    if (!lobbyPoints.has(lobbyId)) {
      lobbyPoints.set(lobbyId, [
      { id: '1', status: 'available', phase_id: 1, topic_id: 1 },
      { id: '2', status: 'available', phase_id: 1, topic_id: 2 },
      { id: '3', status: 'available', phase_id: 1, topic_id: 3 },
      { id: '4', status: 'available', phase_id: 1, topic_id: 4 },
      { id: 'exam', status: 'available', phase_id: 1, topic_id: 4 },
    ]);
    }
    socket.emit('lobby:initPoints', lobbyPoints.get(lobbyId));

    // системное событие о подключении
    nsp.to(roomKey).emit('system', {
      type: 'join',
      userId: socket.user.id,
      username: socket.user.username,
    });

    // --- обработчики ---
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

    socket.on('leaveLobby', async () => {
      try {
        const wasActive = await db.UserSession.findOne({
          where: {
            game_session_id: lobbyId,
            user_id: socket.user.id,
            is_user_active: true,
          },
        });

        if (wasActive) {
          const nextPlayer = await db.UserSession.findOne({
            where: {
              game_session_id: lobbyId,
              user_id: { [db.Sequelize.Op.ne]: socket.user.id },
            },
            order: [['createdAt', 'ASC']],
          });

          if (nextPlayer) {
            await db.UserSession.update(
              { is_user_active: true },
              { where: { id: nextPlayer.id } }
            );
            await db.UserSession.update(
              { is_user_active: false },
              { where: { id: wasActive.id } }
            );
            await emitUsersList();
          }
        }
      } catch (err) {
        console.error('Ошибка при обработке выхода активного игрока:', err);
      }

      socket.leave(roomKey);

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

    socket.on('lobby:answer', async ({ pointId, correct }) => {
      try {
        const activeUserSession = await db.UserSession.findOne({
          where: { game_session_id: lobbyId, is_user_active: true },
        });

        if (!activeUserSession || activeUserSession.user_id !== socket.user.id) {
          socket.emit('error', { message: 'Сейчас отвечает другой игрок' });
          return;
        }

        const status = correct ? 'completed' : 'available';
        const points = lobbyPoints.get(lobbyId);
        if (points) {
          const point = points.find((p) => p.id === pointId);
          if (point) point.status = status;
        }

        nsp.to(roomKey).emit('lobby:updatePointStatus', { pointId, status });
        await passTurnToNextPlayer();
      } catch (err) {
        console.error('Ошибка в обработке ответа:', err);
      }
    });

    socket.on('lobby:incorrectAnswer', (payload) => {
      console.log('📡 [SOCKET] Получено lobby:incorrectAnswer, пересылаю:', payload);
      console.log('📡 [SOCKET] Комната:', roomKey);
      
      // Проверьте есть ли комната и клиенты в ней
      const room = nsp.adapter.rooms.get(roomKey);
      console.log('📡 [SOCKET] Участники комнаты:', room ? Array.from(room) : 'Комната не существует');
      
      nsp.to(roomKey).emit('lobby:incorrectAnswer', payload);
      console.log('📡 [SOCKET] Событие переслано в комнату:', roomKey);
    });

    // Уведомление о истечении времени
    socket.on('lobby:timeout', async (payload) => {
      console.log('📡 [SOCKET] Получено lobby:timeout, пересылаю:', payload);
      
      // Проверяем, что timeout отправляет активный игрок
      const activeUserSession = await db.UserSession.findOne({
        where: { game_session_id: lobbyId, is_user_active: true },
      });

      if (activeUserSession && activeUserSession.user_id === socket.user.id) {
        console.log('⏰ [SOCKET] Timeout от активного игрока, передаем ход следующему');
        await passTurnToNextPlayer();
      }
      
      nsp.to(roomKey).emit('lobby:timeout', payload);
      console.log('📡 [SOCKET] Событие timeout переслано в комнату:', roomKey);
    });

    // Синхронное открытие модалки всем в лобби
    socket.on('lobby:openModal', (payload) => {
      try {
        if (!payload?.questionId || !payload?.question) return;
        nsp.to(roomKey).emit('lobby:openModal', payload);
      } catch (err) {
        console.error('Ошибка в lobby:openModal:', err);
      }
    });

    socket.on('lobby:openExam', (payload) => {
      try {
        const questions = payload?.questions || [];
        lobbyExamState.set(lobbyId, { questions, index: 0 });
        nsp.to(roomKey).emit('lobby:examStart', { questions, index: 0 });
      } catch (err) {
        console.error('Ошибка в lobby:openExam:', err);
      }
    });

    socket.on('lobby:examAnswer', async () => {
      try {
        const state = lobbyExamState.get(lobbyId);
        if (!state) return;
        const nextIndex = state.index + 1;
        if (nextIndex < state.questions.length) {
          state.index = nextIndex;
          lobbyExamState.set(lobbyId, state);
          nsp.to(roomKey).emit('lobby:examNext', { index: nextIndex });
          await passTurnToNextPlayer();
        } else {
          // Экзамен завершён
          lobbyExamState.delete(lobbyId);
          // Обновим точку экзамена как выполненную и известим всех
          const points = lobbyPoints.get(lobbyId);
          if (points) {
            const examPoint = points.find((p) => p.id === 'exam');
            if (examPoint) examPoint.status = 'completed';
          }
          nsp.to(roomKey).emit('lobby:updatePointStatus', { pointId: 'exam', status: 'completed' });
          nsp.to(roomKey).emit('lobby:examComplete');
          await passTurnToNextPlayer();
        }
      } catch (err) {
        console.error('Ошибка в lobby:examAnswer:', err);
      }
    });


    // Обработчик отключения
    socket.on('disconnect', async (reason) => {
      console.log(`Сокет отключён: ${socket.id}, reason=${reason}`);

      // Удаляем пользователя из памяти
      if (lobbyUsers.has(lobbyId)) {
        lobbyUsers.get(lobbyId).delete(socket.id);
        await emitUsersList();
      }

      // Если лобби пустое — ставим таймер на удаление данных
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