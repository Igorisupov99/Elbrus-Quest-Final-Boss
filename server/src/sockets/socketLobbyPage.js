const db = require('../../db/models');
const { incorrectAnswersMap } = require("../controllers/question.controller");

const lobbyUsers = new Map();
const lobbyPoints = new Map();
const lobbyTimeouts = new Map();
const lobbyExamState = new Map(); // lobbyId -> { questions: any[], index: number, correctAnswers: number, totalQuestions: number, examId: string, questionStartTime: number }
const lobbyQuestionState = new Map(); // lobbyId -> { questionId: number, topic: string, question: string, mentor_tip: string, pointId: string, timerStartTime: number, timerDuration: number }
const lobbyReconnectTimers = new Map(); // lobbyId -> { timerId: number, activePlayerId: number, activePlayerName: string }

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

        let activePlayerId = activeUserSession ? activeUserSession.user.id : null;

        // Если нет активного игрока, но есть подключенные пользователи, назначаем первого
        if (!activePlayerId && users.length > 0) {
          const firstUser = users[0];
          const userSession = await db.UserSession.findOne({
            where: { game_session_id: lobbyId, user_id: firstUser.id },
          });
          
          if (userSession) {
            await userSession.update({ is_user_active: true });
            activePlayerId = firstUser.id;
            console.log(
              `🎮 Автоматически назначен активный игрок в лобби ${lobbyId}: ${firstUser.username}`
            );
          }
        }

        nsp.to(roomKey).emit('lobby:users', { users, activePlayerId });
      } catch (err) {
        console.error('Ошибка при получении активного игрока:', err);
        const users = Array.from(lobbyUsers.get(lobbyId).values());
        const activePlayerId = users.length > 0 ? users[0].id : null;
        nsp.to(roomKey).emit('lobby:users', { users, activePlayerId });
      }
    }

    // Функция для запуска таймера ожидания переподключения
    function startReconnectTimer(activePlayerId, activePlayerName) {
      // Очищаем предыдущий таймер, если есть
      if (lobbyReconnectTimers.has(lobbyId)) {
        const existingTimer = lobbyReconnectTimers.get(lobbyId);
        clearTimeout(existingTimer.timerId);
        clearInterval(existingTimer.intervalId);
      }

      console.log(`⏳ [RECONNECT] Запускаем таймер ожидания для ${activePlayerName} (ID: ${activePlayerId})`);
      
      let timeLeft = 30;
      
      // Уведомляем всех игроков о начале ожидания
      nsp.to(roomKey).emit('lobby:reconnectWaiting', {
        activePlayerName,
        timeLeft
      });

      // Запускаем интервал для отправки обновлений каждую секунду
      const intervalId = setInterval(() => {
        timeLeft--;
        
        if (timeLeft > 0) {
          // Отправляем обновление времени всем игрокам
          nsp.to(roomKey).emit('lobby:reconnectTimerUpdate', {
            timeLeft
          });
        } else {
          // Время истекло
          clearInterval(intervalId);
        }
      }, 1000);

      // Основной таймер на 30 секунд
      const timerId = setTimeout(async () => {
        console.log(`⏰ [RECONNECT] Время ожидания истекло, передаем ход следующему игроку`);
        
        // Передаем ход следующему игроку
        await passTurnToNextPlayer();
        
        // Уведомляем всех игроков о завершении ожидания
        nsp.to(roomKey).emit('lobby:reconnectTimeout');
        
        // Удаляем таймер из Map
        lobbyReconnectTimers.delete(lobbyId);
      }, 30000); // 30 секунд

      // Сохраняем таймер в Map
      lobbyReconnectTimers.set(lobbyId, {
        timerId,
        intervalId,
        activePlayerId,
        activePlayerName
      });
    }

    // Функция для отмены таймера ожидания переподключения
    async function cancelReconnectTimer() {
      if (lobbyReconnectTimers.has(lobbyId)) {
        const timer = lobbyReconnectTimers.get(lobbyId);
        clearTimeout(timer.timerId);
        clearInterval(timer.intervalId);
        lobbyReconnectTimers.delete(lobbyId);
        
        console.log(`✅ [RECONNECT] Таймер ожидания отменен для лобби ${lobbyId}`);
        
        // Уведомляем всех игроков об отмене ожидания
        nsp.to(roomKey).emit('lobby:reconnectCanceled');
        
        // Проверяем, был ли активен экзамен и восстанавливаем его
        // ТОЛЬКО если это переподключение активного игрока (есть reconnectTimer для этого игрока)
        const examState = lobbyExamState.get(lobbyId);
        if (examState && reconnectTimer && reconnectTimer.activePlayerId === socket.user.id) {
          console.log(`🔄 [EXAM] Восстанавливаем экзамен для переподключившегося АКТИВНОГО игрока`);
          console.log(`📊 [EXAM] Состояние: вопрос ${examState.index + 1}/${examState.totalQuestions}, правильных ответов: ${examState.correctAnswers}`);
          
          // Вычисляем оставшееся время таймера
          const currentTime = Date.now();
          const elapsedTime = currentTime - examState.timerStartTime;
          const timeLeft = Math.max(0, Math.ceil((examState.timerDuration - elapsedTime) / 1000));
          
          console.log(`⏰ [EXAM] Восстанавливаем таймер: осталось ${timeLeft} секунд`);
          
          // Отправляем восстановление экзамена всем игрокам
          nsp.to(roomKey).emit('lobby:examRestore', {
            examId: examState.examId,
            questions: examState.questions,
            currentIndex: examState.index,
            correctAnswers: examState.correctAnswers,
            totalQuestions: examState.totalQuestions,
            currentQuestion: examState.questions[examState.index],
            timeLeft: timeLeft
          });
          
          // Отправляем актуальное время таймера
          nsp.to(roomKey).emit('lobby:examTimerReset', { timeLeft: timeLeft });
        }
        
        // Проверяем, был ли активен обычный вопрос и восстанавливаем его
        // ТОЛЬКО если это переподключение активного игрока (есть reconnectTimer для этого игрока)
        const questionState = lobbyQuestionState.get(lobbyId);
        if (questionState && reconnectTimer && reconnectTimer.activePlayerId === socket.user.id) {
          console.log(`🔄 [QUESTION] Восстанавливаем вопрос для переподключившегося АКТИВНОГО игрока`);
          console.log(`📝 [QUESTION] Вопрос ID: ${questionState.questionId}, тема: ${questionState.topic}`);
          
          // Вычисляем оставшееся время таймера
          const currentTime = Date.now();
          const elapsedTime = currentTime - questionState.timerStartTime;
          const timeLeft = Math.max(0, Math.ceil((questionState.timerDuration - elapsedTime) / 1000));
          
          console.log(`⏰ [QUESTION] Восстанавливаем таймер: осталось ${timeLeft} секунд`);
          
          // Если время еще есть - восстанавливаем вопрос
          if (timeLeft > 0) {
            // Отправляем восстановление вопроса всем игрокам
            nsp.to(roomKey).emit('lobby:questionRestore', {
              questionId: questionState.questionId,
              topic: questionState.topic,
              question: questionState.question,
              mentor_tip: questionState.mentor_tip,
              pointId: questionState.pointId,
              timeLeft: timeLeft
            });
          } else {
            // Время истекло во время отключения - очищаем состояние и передаем ход
            console.log(`⏰ [QUESTION] Время истекло во время отключения, передаем ход`);
            lobbyQuestionState.delete(lobbyId);
            await passTurnToNextPlayer();
          }
        }
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

        // Очищаем состояние экзамена и вопроса при смене игрока
        // Это предотвращает ситуацию, когда новый активный игрок получает старое состояние
        if (lobbyExamState.has(lobbyId)) {
          lobbyExamState.delete(lobbyId);
          console.log(`🗑️ [EXAM] Очищено состояние экзамена при смене игрока для лобби ${lobbyId}`);
        }
        
        if (lobbyQuestionState.has(lobbyId)) {
          lobbyQuestionState.delete(lobbyId);
          console.log(`🗑️ [QUESTION] Очищено состояние вопроса при смене игрока для лобби ${lobbyId}`);
        }

        // Уведомляем всех игроков о сбросе активного поинта
        nsp.to(roomKey).emit('lobby:activePointChanged', {
          activePointId: null
        });

        await emitUsersList();
      } catch (err) {
        console.error('Ошибка при передаче хода:', err);
      }
    }

    console.log(`Пользователь подключился ${lobbyId}: ${socket.user.username}`);

    // Проверяем, есть ли активный таймер ожидания переподключения для этого игрока
    const reconnectTimer = lobbyReconnectTimers.get(lobbyId);
    if (reconnectTimer && reconnectTimer.activePlayerId === socket.user.id) {
      console.log(`✅ [RECONNECT] Игрок ${socket.user.username} вернулся, отменяем таймер ожидания`);
      await cancelReconnectTimer();
    }

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

      // Проверяем, есть ли активный игрок в базе данных
      if (!existingActivePlayer) {
        await userSession.update({ is_user_active: true });
        console.log(
          `🎮 Первый активный игрок в лобби ${lobbyId}: ${socket.user.username}`
        );
      } else {
        // Дополнительная проверка: если активный игрок есть в БД, но не подключен к лобби
        const activePlayerInLobby = Array.from(lobbyUsers.get(lobbyId).values())
          .find(user => user.id === existingActivePlayer.user_id);
        
        if (!activePlayerInLobby) {
          // Активный игрок не подключен, делаем текущего игрока активным
          await db.UserSession.update(
            { is_user_active: false },
            { where: { id: existingActivePlayer.id } }
          );
          await userSession.update({ is_user_active: true });
          console.log(
            `🎮 Активный игрок не подключен, новый активный игрок в лобби ${lobbyId}: ${socket.user.username}`
          );
        }
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
        { id: 'exam', status: 'locked', phase_id: 1, topic_id: 0 },
        // Фаза 2 (заблокировано до завершения экзамена 1)
        { id: '5', status: 'locked', phase_id: 2, topic_id: 6 },
        { id: '6', status: 'locked', phase_id: 2, topic_id: 7 },
        { id: '7', status: 'locked', phase_id: 2, topic_id: 8 },
        { id: '8', status: 'locked', phase_id: 2, topic_id: 9 },
        { id: 'exam2', status: 'locked', phase_id: 2, topic_id: 0 },
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

    socket.on('lobby:answer', async ({ pointId, correct, answer }) => {
      try {
        console.log(`🎯 [SOCKET] Получен lobby:answer: pointId=${pointId}, correct=${correct}, userId=${socket.user.id}`);
        
        const activeUserSession = await db.UserSession.findOne({
          where: { game_session_id: lobbyId, is_user_active: true },
        });

        if (!activeUserSession || activeUserSession.user_id !== socket.user.id) {
          console.log(`❌ [SOCKET] Неправильный игрок пытается ответить: active=${activeUserSession?.user_id}, current=${socket.user.id}`);
          socket.emit('error', { message: 'Сейчас отвечает другой игрок' });
          return;
        }

        console.log(`✅ [SOCKET] Активный игрок отвечает: ${socket.user.username}`);

        // Синхронизируем ответ активного игрока со всеми игроками
        if (answer !== undefined) {
          nsp.to(roomKey).emit('lobby:answerSync', { 
            answer: answer,
            activePlayerName: socket.user.username 
          });
        }

        const status = correct ? 'completed' : 'available';
        const points = lobbyPoints.get(lobbyId);
        if (points) {
          const point = points.find((p) => p.id === pointId);
          if (point) point.status = status;
        }

        // Если ответ неправильный, увеличиваем счетчик неправильных ответов
        if (!correct) {
          const current = incorrectAnswersMap.get(lobbyId) || 0;
          const newCount = current + 1;
          incorrectAnswersMap.set(lobbyId, newCount);
          
          console.log(`📊 [SOCKET] Увеличиваем счетчик неправильных ответов: ${current} -> ${newCount}`);
          
          // Отправляем обновленный счетчик всем игрокам
          const allSessions = await db.UserSession.findAll({ where: { game_session_id: lobbyId } });
          const lobbyTotalScore = allSessions.reduce((sum, s) => sum + Number(s.score || 0), 0);
          
          const payload = {
            userId: socket.user.id,
            userScore: activeUserSession.score || 0,
            sessionScore: lobbyTotalScore,
            incorrectAnswers: newCount,
          };
          
          console.log(`📡 [SOCKET] Отправляем lobby:incorrectAnswer:`, payload);
          nsp.to(roomKey).emit('lobby:incorrectAnswer', payload);
        }

        nsp.to(roomKey).emit('lobby:updatePointStatus', { pointId, status });
        
        // Очищаем состояние вопроса после ответа
        if (lobbyQuestionState.has(lobbyId)) {
          lobbyQuestionState.delete(lobbyId);
          console.log(`🗑️ [QUESTION] Очищено состояние вопроса после ответа для лобби ${lobbyId}`);
        }
        
        // Уведомляем всех игроков о сбросе активного поинта
        nsp.to(roomKey).emit('lobby:activePointChanged', {
          activePointId: null
        });
        
        console.log(`🔄 [SOCKET] Передаем ход следующему игроку`);
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
        
        // Очищаем состояние вопроса при таймауте
        if (lobbyQuestionState.has(lobbyId)) {
          lobbyQuestionState.delete(lobbyId);
          console.log(`🗑️ [QUESTION] Очищено состояние вопроса после таймаута для лобби ${lobbyId}`);
        }
        
        // Уведомляем всех игроков о сбросе активного поинта
        nsp.to(roomKey).emit('lobby:activePointChanged', {
          activePointId: null
        });
        
        await passTurnToNextPlayer();
      }
      
      nsp.to(roomKey).emit('lobby:timeout', payload);
      console.log('📡 [SOCKET] Событие timeout переслано в комнату:', roomKey);
    });

    // Синхронное закрытие модалки всем в лобби
    socket.on('lobby:closeModal', () => {
      console.log('🔒 [SOCKET] Получено lobby:closeModal, пересылаю всем игрокам');
      
      // Очищаем состояние вопроса при закрытии
      if (lobbyQuestionState.has(lobbyId)) {
        lobbyQuestionState.delete(lobbyId);
        console.log(`🗑️ [QUESTION] Очищено состояние вопроса для лобби ${lobbyId}`);
      }
      
      // Уведомляем всех игроков о сбросе активного поинта
      nsp.to(roomKey).emit('lobby:activePointChanged', {
        activePointId: null
      });
      
      nsp.to(roomKey).emit('lobby:closeModal');
      console.log('🔒 [SOCKET] Событие closeModal переслано в комнату:', roomKey);
    });

    // Синхронное открытие модалки всем в лобби
    socket.on('lobby:openModal', (payload) => {
      try {
        if (!payload?.questionId || !payload?.question) return;
        
        // Сохраняем состояние вопроса
        lobbyQuestionState.set(lobbyId, {
          questionId: payload.questionId,
          topic: payload.topic || '',
          question: payload.question,
          mentor_tip: payload.mentor_tip || '',
          pointId: payload.pointId || String(payload.questionId),
          timerStartTime: Date.now(),
          timerDuration: 30000 // 30 секунд в миллисекундах
        });
        
        console.log(`📝 [QUESTION] Сохранено состояние вопроса ${payload.questionId} для лобби ${lobbyId}`);
        
        // Уведомляем всех игроков об активном поинте
        nsp.to(roomKey).emit('lobby:activePointChanged', {
          activePointId: payload.pointId || String(payload.questionId)
        });
        
        nsp.to(roomKey).emit('lobby:openModal', payload);
      } catch (err) {
        console.error('Ошибка в lobby:openModal:', err);
      }
    });

    socket.on('lobby:openExam', (payload) => {
      try {
        const questions = payload?.questions || [];
        const examId = payload?.examId === 'exam2' ? 'exam2' : 'exam';
        lobbyExamState.set(lobbyId, { 
          questions, 
          index: 0, 
          correctAnswers: 0, 
          totalQuestions: questions.length, 
          examId,
          timerStartTime: Date.now(),
          timerDuration: 30000 // 30 секунд в миллисекундах
        });
        nsp.to(roomKey).emit('lobby:examStart', { questions, index: 0 });
      } catch (err) {
        console.error('Ошибка в lobby:openExam:', err);
      }
    });

    socket.on('lobby:passTurn', async () => {
      try {
        console.log(`🎮 [SOCKET] Передаем ход следующему игроку по запросу`);
        await passTurnToNextPlayer();
      } catch (err) {
        console.error('Ошибка при передаче хода:', err);
      }
    });

    socket.on('lobby:passTurnNotification', () => {
      console.log('📢 [SOCKET] Отправляем уведомление о передаче хода всем игрокам');
      nsp.to(roomKey).emit('lobby:passTurnNotification');
    });

    socket.on('lobby:incorrectCountUpdate', async ({ incorrectAnswers }) => {
      try {
        console.log(`📊 [SOCKET] Обновляем глобальный счетчик неправильных ответов: ${incorrectAnswers}`);
        
        // Обновляем глобальный счетчик неправильных ответов
        incorrectAnswersMap.set(lobbyId, incorrectAnswers);
        
        // Отправляем обновленный счетчик всем игрокам в лобби
        nsp.to(roomKey).emit('lobby:incorrectCountUpdate', { incorrectAnswers });
      } catch (err) {
        console.error('Ошибка при обновлении счетчика неправильных ответов:', err);
      }
    });

    // Обработчик синхронизации ввода в обычных вопросах
    socket.on('lobby:answerInput', ({ answer, activePlayerName }) => {
      console.log('🔄 [SOCKET] Синхронизация ввода в вопросе:', { answer, activePlayerName });
      nsp.to(roomKey).emit('lobby:answerInput', { answer, activePlayerName });
    });

    // Обработчик синхронизации ввода в экзамене
    socket.on('lobby:examAnswerInput', ({ answer, activePlayerName }) => {
      console.log('🔄 [SOCKET] Синхронизация ввода в экзамене:', { answer, activePlayerName });
      nsp.to(roomKey).emit('lobby:examAnswerInput', { answer, activePlayerName });
    });

    socket.on('lobby:examAnswer', async (payload) => {
      try {
        const state = lobbyExamState.get(lobbyId);
        if (!state) return;
        const isCorrect = Boolean(payload && payload.correct);
        const isExamClosedByUser = payload.answer === 'exam_closed_by_user';
        
        // Синхронизируем ответ активного игрока со всеми игроками
        if (payload.answer !== undefined && !isExamClosedByUser) {
          nsp.to(roomKey).emit('lobby:examAnswerSync', { 
            answer: payload.answer,
            activePlayerName: socket.user.username 
          });
        }

        // Если экзамен закрыт пользователем - проваливаем его
        if (isExamClosedByUser) {
          console.log('❌ [EXAM] Экзамен провален при закрытии пользователем');
          
          // Проваливаем экзамен - сбрасываем фазу для повторного прохождения
          lobbyExamState.delete(lobbyId);
          
          // Обнуляем счётчик неправильных ответов при провале экзамена
          incorrectAnswersMap.set(lobbyId, 0);
          console.log(`🎯 [SOCKET] Счётчик неправильных ответов обнулён при провале экзамена для лобби ${lobbyId}`);
          
          // Сбрасываем фазу - делаем все точки текущей фазы доступными для повторного прохождения
          const points = lobbyPoints.get(lobbyId);
          if (points) {
            const currentPhaseId = state.examId === 'exam2' ? 2 : 1;
            
            // Сбрасываем все точки текущей фазы в состояние "доступно" для повторного прохождения
            points.forEach(p => {
              if (p.phase_id === currentPhaseId) {
                p.status = 'available';
              }
            });
            
            // Обновляем статусы точек на клиентах
            points.forEach(p => {
              if (p.phase_id === currentPhaseId) {
                nsp.to(roomKey).emit('lobby:updatePointStatus', { pointId: p.id, status: p.status });
              }
            });
          }
          
          // Отправляем уведомление о провале экзамена
          nsp.to(roomKey).emit('lobby:examFailed', {
            message: `❌ Экзамен провален! Экзамен был закрыт пользователем. Фаза ${state.examId === 'exam2' ? '2' : '1'} сброшена для повторного прохождения.`,
            correctAnswers: state.correctAnswers,
            totalQuestions: state.totalQuestions,
            successRate: state.correctAnswers / state.totalQuestions,
            phaseId: state.examId === 'exam2' ? 2 : 1
          });
          
          // Отправляем обновление счётчика неправильных ответов (обнуляем при провале)
          nsp.to(roomKey).emit('lobby:incorrectCountUpdate', { incorrectAnswers: 0 });
          
          // Закрываем модалку экзамена
          nsp.to(roomKey).emit('lobby:closeExamModal');
          
          // Передаем ход следующему игроку
          await passTurnToNextPlayer();
          return;
        }

        if (isCorrect) {
          // Увеличиваем счетчик правильных ответов
          state.correctAnswers += 1;
          lobbyExamState.set(lobbyId, state);
          
          // Показываем уведомление всем игрокам
          nsp.to(roomKey).emit('lobby:examCorrectAnswer', {
            message: '✅ Правильный ответ! Ход переходит следующему игроку'
          });
          
          // Ждем 2 секунды, затем переходим к следующему вопросу
          setTimeout(async () => {
            const nextIndex = state.index + 1;
            if (nextIndex < state.questions.length) {
              state.index = nextIndex;
              // Обновляем время начала таймера для нового вопроса
              state.timerStartTime = Date.now();
              state.timerDuration = 30000;
              lobbyExamState.set(lobbyId, state);
              const nextQuestion = state.questions[nextIndex];
              nsp.to(roomKey).emit('lobby:examNext', { index: nextIndex, question: nextQuestion });
              
              // Синхронизируем таймер для всех игроков
              nsp.to(roomKey).emit('lobby:examTimerReset', { timeLeft: 30 });
            } else {
              // Экзамен завершён - проверяем успешность
              const successRate = state.correctAnswers / state.totalQuestions;
              const isExamPassed = successRate >= 0.6; // 60% минимум
              
              console.log(`📊 [EXAM] Результат экзамена: ${state.correctAnswers}/${state.totalQuestions} (${(successRate * 100).toFixed(1)}%)`);
              
              if (isExamPassed) {
                // Экзамен сдан успешно
                lobbyExamState.delete(lobbyId);
                
                // Обнуляем счётчик неправильных ответов после успешной сдачи экзамена
                incorrectAnswersMap.set(lobbyId, 0);
                console.log(`🎯 [SOCKET] Счётчик неправильных ответов обнулён для лобби ${lobbyId}`);
                
                // Начисляем 30 очков каждому игроку в лобби за успешную сдачу экзамена
                try {
                  const { User, UserSession } = require("../../db/models");
                  const rewardPoints = 30;
                  
                  // Получаем всех игроков в лобби
                  const allSessions = await UserSession.findAll({ 
                    where: { game_session_id: lobbyId } 
                  });
                  
                  // Начисляем очки каждому игроку
                  for (const session of allSessions) {
                    const user = await User.findByPk(session.user_id);
                    if (user) {
                      user.score = Number(user.score || 0) + rewardPoints;
                      await user.save();
                    }
                    
                    session.score = Number(session.score || 0) + rewardPoints;
                    await session.save();
                  }
                  
                  // Пересчитываем общий счёт лобби
                  const updatedSessions = await UserSession.findAll({ 
                    where: { game_session_id: lobbyId } 
                  });
                  const lobbyTotalScore = updatedSessions.reduce((sum, s) => sum + Number(s.score || 0), 0);
                  
                  // Получаем обновленные очки пользователей из базы данных
                  const userScores = [];
                  for (const session of updatedSessions) {
                    const user = await User.findByPk(session.user_id);
                    if (user) {
                      console.log(`🎯 Пользователь ${session.user_id}: session.score=${session.score}, user.score=${user.score}`);
                      userScores.push({
                        userId: session.user_id,
                        userScore: user.score
                      });
                    }
                  }
                  
                  // Отправляем обновленные очки всем игрокам
                  nsp.to(roomKey).emit('lobby:examReward', {
                    message: '🎉 Экзамен успешно сдан! Каждый игрок получил +30 очков!',
                    rewardPoints,
                    sessionScore: lobbyTotalScore,
                    userScores: userScores
                  });
                  
                  // Отправляем обновление счётчика неправильных ответов (обнуляем после экзамена)
                  nsp.to(roomKey).emit('lobby:incorrectCountUpdate', { incorrectAnswers: 0 });
                  
                } catch (error) {
                  console.error('Ошибка при начислении очков за экзамен:', error);
                }
                
                // Обновим точку экзамена как выполненную и известим всех
                const points = lobbyPoints.get(lobbyId);
                if (points) {
                  const examKey = state.examId === 'exam2' ? 'exam2' : 'exam';
                  const examPoint = points.find((p) => p.id === examKey);
                  if (examPoint) examPoint.status = 'completed';
                  if (examKey === 'exam') {
                    // Разблокируем темы фазы 2 только после первого экзамена
                    points.forEach(p => {
                      if (p.phase_id === 2 && p.id !== 'exam2' && p.status === 'locked') {
                        p.status = 'available';
                      }
                    });
                  }
                }
                const examKey = state.examId === 'exam2' ? 'exam2' : 'exam';
                nsp.to(roomKey).emit('lobby:updatePointStatus', { pointId: examKey, status: 'completed' });
                // Разослать новые статусы по фазе 2
                const updatedPoints = lobbyPoints.get(lobbyId) || [];
                updatedPoints.forEach(p => {
                  if (p.phase_id === 2 && p.id !== 'exam2') {
                    nsp.to(roomKey).emit('lobby:updatePointStatus', { pointId: p.id, status: p.status });
                  }
                });
                nsp.to(roomKey).emit('lobby:examComplete');
                // На всякий случай синхронно закроем любые открытые модалки
                nsp.to(roomKey).emit('lobby:closeModal');
              } else {
                // Экзамен провален - сбрасываем фазу для повторного прохождения
                console.log(`❌ [EXAM] Экзамен провален! Сбрасываем фазу ${state.examId} для повторного прохождения`);
                lobbyExamState.delete(lobbyId);
                
                // Обнуляем счётчик неправильных ответов при провале экзамена
                incorrectAnswersMap.set(lobbyId, 0);
                console.log(`🎯 [SOCKET] Счётчик неправильных ответов обнулён при провале экзамена для лобби ${lobbyId}`);
                
                // Сбрасываем фазу - делаем все точки текущей фазы доступными для повторного прохождения
                const points = lobbyPoints.get(lobbyId);
                if (points) {
                  const currentPhaseId = state.examId === 'exam2' ? 2 : 1;
                  
                  // Сбрасываем все точки текущей фазы в состояние "доступно" для повторного прохождения
                  points.forEach(p => {
                    if (p.phase_id === currentPhaseId) {
                      p.status = 'available';
                    }
                  });
                  
                  // Обновляем статусы точек на клиентах
                  points.forEach(p => {
                    if (p.phase_id === currentPhaseId) {
                      nsp.to(roomKey).emit('lobby:updatePointStatus', { pointId: p.id, status: p.status });
                    }
                  });
                }
                
                // Отправляем уведомление о провале экзамена
                nsp.to(roomKey).emit('lobby:examFailed', {
                  message: `❌ Экзамен провален! Правильных ответов: ${state.correctAnswers}/${state.totalQuestions} (${(successRate * 100).toFixed(1)}%). Фаза ${state.examId === 'exam2' ? '2' : '1'} сброшена для повторного прохождения.`,
                  correctAnswers: state.correctAnswers,
                  totalQuestions: state.totalQuestions,
                  successRate: successRate,
                  phaseId: state.examId === 'exam2' ? 2 : 1
                });
                
                // Отправляем обновление счётчика неправильных ответов (обнуляем при провале)
                nsp.to(roomKey).emit('lobby:incorrectCountUpdate', { incorrectAnswers: 0 });
                
                // Закрываем модалку экзамена
                nsp.to(roomKey).emit('lobby:closeModal');
              }
            }
            
            // Передаем ход следующему игроку после показа уведомления
            await passTurnToNextPlayer();
          }, 2000); // 2 секунды задержки
        } else {
          // При неправильном ответе в экзамене показываем уведомление всем игрокам
          const isTimeout = payload && payload.isTimeout;
          const message = isTimeout 
            ? '⏰ Время истекло. Ответ засчитан как неправильный.'
            : '❌ Неправильный ответ! Ход переходит следующему игроку';
            
          nsp.to(roomKey).emit('lobby:examIncorrectAnswer', {
            message
          });
          
          // При неправильном ответе в экзамене переходим к следующему вопросу
          const nextIndex = state.index + 1;
          if (nextIndex < state.questions.length) {
            state.index = nextIndex;
            // Обновляем время начала таймера для нового вопроса
            state.timerStartTime = Date.now();
            state.timerDuration = 30000;
            lobbyExamState.set(lobbyId, state);
            const nextQuestion = state.questions[nextIndex];
            nsp.to(roomKey).emit('lobby:examNext', { index: nextIndex, question: nextQuestion });
            
            // Синхронизируем таймер для всех игроков
            nsp.to(roomKey).emit('lobby:examTimerReset', { timeLeft: 30 });
          } else {
            // Экзамен завершён - проверяем успешность
            const successRate = state.correctAnswers / state.totalQuestions;
            const isExamPassed = successRate >= 0.6; // 60% минимум
            
            console.log(`📊 [EXAM] Результат экзамена: ${state.correctAnswers}/${state.totalQuestions} (${(successRate * 100).toFixed(1)}%)`);
            
            if (isExamPassed) {
              // Экзамен сдан успешно
              lobbyExamState.delete(lobbyId);
              
              // Обнуляем счётчик неправильных ответов после успешной сдачи экзамена
              incorrectAnswersMap.set(lobbyId, 0);
              console.log(`🎯 [SOCKET] Счётчик неправильных ответов обнулён для лобби ${lobbyId}`);
              
              // Начисляем 30 очков каждому игроку в лобби за успешную сдачу экзамена
              try {
                const { User, UserSession } = require("../../db/models");
                const rewardPoints = 30;
                
                // Получаем всех игроков в лобби
                const allSessions = await UserSession.findAll({ 
                  where: { game_session_id: lobbyId } 
                });
                
                // Начисляем очки каждому игроку
                for (const session of allSessions) {
                  const user = await User.findByPk(session.user_id);
                  if (user) {
                    user.score = Number(user.score || 0) + rewardPoints;
                    await user.save();
                  }
                  
                  session.score = Number(session.score || 0) + rewardPoints;
                  await session.save();
                }
                
                // Пересчитываем общий счёт лобби
                const updatedSessions = await UserSession.findAll({ 
                  where: { game_session_id: lobbyId } 
                });
                const lobbyTotalScore = updatedSessions.reduce((sum, s) => sum + Number(s.score || 0), 0);
                
                // Получаем обновленные очки пользователей из базы данных
                const userScores = [];
                for (const session of updatedSessions) {
                  const user = await User.findByPk(session.user_id);
                  if (user) {
                    console.log(`🎯 Пользователь ${session.user_id}: session.score=${session.score}, user.score=${user.score}`);
                    userScores.push({
                      userId: session.user_id,
                      userScore: user.score
                    });
                  }
                }
                
                // Отправляем обновленные очки всем игрокам
                nsp.to(roomKey).emit('lobby:examReward', {
                  message: '🎉 Экзамен успешно сдан! Каждый игрок получил +30 очков!',
                  rewardPoints,
                  sessionScore: lobbyTotalScore,
                  userScores: userScores
                });
                
                // Отправляем обновление счётчика неправильных ответов (обнуляем после экзамена)
                nsp.to(roomKey).emit('lobby:incorrectCountUpdate', { incorrectAnswers: 0 });
                
              } catch (error) {
                console.error('Ошибка при начислении очков за экзамен:', error);
              }
              
              // Обновим точку экзамена как выполненную и известим всех
              const points = lobbyPoints.get(lobbyId);
              if (points) {
                const examKey = state.examId === 'exam2' ? 'exam2' : 'exam';
                const examPoint = points.find((p) => p.id === examKey);
                if (examPoint) examPoint.status = 'completed';
                if (examKey === 'exam') {
                  // Разблокируем темы фазы 2 только после первого экзамена
                  points.forEach(p => {
                    if (p.phase_id === 2 && p.id !== 'exam2' && p.status === 'locked') {
                      p.status = 'available';
                    }
                  });
                }
              }
              const examKey = state.examId === 'exam2' ? 'exam2' : 'exam';
              nsp.to(roomKey).emit('lobby:updatePointStatus', { pointId: examKey, status: 'completed' });
              // Разослать новые статусы по фазе 2
              const updatedPoints = lobbyPoints.get(lobbyId) || [];
              updatedPoints.forEach(p => {
                if (p.phase_id === 2 && p.id !== 'exam2') {
                  nsp.to(roomKey).emit('lobby:updatePointStatus', { pointId: p.id, status: p.status });
                }
              });
              nsp.to(roomKey).emit('lobby:examComplete');
              // На всякий случай синхронно закроем любые открытые модалки
              nsp.to(roomKey).emit('lobby:closeModal');
            } else {
              // Экзамен провален - сбрасываем фазу для повторного прохождения
              console.log(`❌ [EXAM] Экзамен провален! Сбрасываем фазу ${state.examId} для повторного прохождения`);
              lobbyExamState.delete(lobbyId);
              
              // Обнуляем счётчик неправильных ответов при провале экзамена
              incorrectAnswersMap.set(lobbyId, 0);
              console.log(`🎯 [SOCKET] Счётчик неправильных ответов обнулён при провале экзамена для лобби ${lobbyId}`);
              
              // Сбрасываем фазу - делаем все точки текущей фазы доступными для повторного прохождения
              const points = lobbyPoints.get(lobbyId);
              if (points) {
                const currentPhaseId = state.examId === 'exam2' ? 2 : 1;
                
                // Сбрасываем все точки текущей фазы в состояние "доступно" для повторного прохождения
                points.forEach(p => {
                  if (p.phase_id === currentPhaseId) {
                    p.status = 'available';
                  }
                });
                
                // Обновляем статусы точек на клиентах
                points.forEach(p => {
                  if (p.phase_id === currentPhaseId) {
                    nsp.to(roomKey).emit('lobby:updatePointStatus', { pointId: p.id, status: p.status });
                  }
                });
              }
              
              // Отправляем уведомление о провале экзамена
              nsp.to(roomKey).emit('lobby:examFailed', {
                message: `❌ Экзамен провален! Правильных ответов: ${state.correctAnswers}/${state.totalQuestions} (${(successRate * 100).toFixed(1)}%). Фаза ${state.examId === 'exam2' ? '2' : '1'} сброшена для повторного прохождения.`,
                correctAnswers: state.correctAnswers,
                totalQuestions: state.totalQuestions,
                successRate: successRate,
                phaseId: state.examId === 'exam2' ? 2 : 1
              });
              
              // Отправляем обновление счётчика неправильных ответов (обнуляем при провале)
              nsp.to(roomKey).emit('lobby:incorrectCountUpdate', { incorrectAnswers: 0 });
              
              // Закрываем модалку экзамена
              nsp.to(roomKey).emit('lobby:closeExamModal');
            }
          }
          
          // Передаем ход следующему игроку
          await passTurnToNextPlayer();
        }
      } catch (err) {
        console.error('Ошибка в lobby:examAnswer:', err);
      }
    });

    // Обработчик добавления/удаления из избранного
    // Проверка активного вопроса для неактивных игроков
    socket.on('lobby:checkActiveQuestion', (payload) => {
      try {
        const requestedPointId = payload?.pointId;
        const questionState = lobbyQuestionState.get(lobbyId);
        
        if (questionState) {
          console.log(`🔍 [QUESTION] Неактивный игрок запрашивает вопрос для поинта: ${requestedPointId}, активный поинт: ${questionState.pointId}`);
          
          // Проверяем, соответствует ли запрашиваемый поинт активному вопросу
          if (requestedPointId === questionState.pointId) {
            // Вычисляем оставшееся время таймера
            const currentTime = Date.now();
            const elapsedTime = currentTime - questionState.timerStartTime;
            const timeLeft = Math.max(0, Math.ceil((questionState.timerDuration - elapsedTime) / 1000));
            
            console.log(`✅ [QUESTION] Поинты совпадают! Отправляем активный вопрос`);
            
            // Отправляем активный вопрос только этому игроку
            socket.emit('lobby:activeQuestion', {
              questionId: questionState.questionId,
              topic: questionState.topic,
              question: questionState.question,
              mentor_tip: questionState.mentor_tip,
              pointId: questionState.pointId,
              timeLeft: timeLeft
            });
          } else {
            console.log(`❌ [QUESTION] Поинты не совпадают! Запрошен: ${requestedPointId}, активный: ${questionState.pointId}`);
            // Отправляем уведомление о том, что это не тот поинт
            socket.emit('lobby:wrongPoint', { 
              requestedPointId, 
              activePointId: questionState.pointId 
            });
          }
        } else {
          console.log(`❌ [QUESTION] Нет активного вопроса`);
          // Нет активного вопроса
          socket.emit('lobby:noActiveQuestion');
        }
      } catch (error) {
        console.error('Ошибка при проверке активного вопроса:', error);
      }
    });

    // Проверка активного экзамена для неактивных игроков
    socket.on('lobby:checkActiveExam', (payload) => {
      try {
        const requestedExamId = payload?.examId;
        const examState = lobbyExamState.get(lobbyId);
        
        if (examState) {
          console.log(`🔍 [EXAM] Неактивный игрок запрашивает экзамен для поинта: ${requestedExamId}, активный экзамен: ${examState.examId}`);
          
          // Проверяем, соответствует ли запрашиваемый экзамен активному
          if (requestedExamId === examState.examId) {
            // Вычисляем оставшееся время таймера
            const currentTime = Date.now();
            const elapsedTime = currentTime - examState.timerStartTime;
            const timeLeft = Math.max(0, Math.ceil((examState.timerDuration - elapsedTime) / 1000));
            
            console.log(`✅ [EXAM] Экзамены совпадают! Отправляем активный экзамен`);
            
            // Отправляем активный экзамен только этому игроку
            socket.emit('lobby:activeExam', {
              examId: examState.examId,
              questions: examState.questions,
              currentIndex: examState.index,
              correctAnswers: examState.correctAnswers,
              totalQuestions: examState.totalQuestions,
              currentQuestion: examState.questions[examState.index],
              timeLeft: timeLeft
            });
          } else {
            console.log(`❌ [EXAM] Экзамены не совпадают! Запрошен: ${requestedExamId}, активный: ${examState.examId}`);
            // Отправляем уведомление о том, что это не тот экзамен
            socket.emit('lobby:wrongExam', { 
              requestedExamId, 
              activeExamId: examState.examId 
            });
          }
        } else {
          console.log(`❌ [EXAM] Нет активного экзамена`);
          // Нет активного экзамена
          socket.emit('lobby:noActiveExam');
        }
      } catch (error) {
        console.error('Ошибка при проверке активного экзамена:', error);
      }
    });

    socket.on('lobby:favoriteToggle', async (payload) => {
      try {
        console.log('⭐ [FAVORITE] Получен запрос на изменение избранного:', payload);
        
        const { questionId, isFavorite } = payload;
        const userId = socket.user.id;
        const username = socket.user.username;

        // Проверяем существование вопроса
        const question = await db.Question.findByPk(questionId);
        if (!question) {
          socket.emit('error', { message: 'Вопрос не найден' });
          return;
        }

        if (isFavorite) {
          // Добавляем в избранное
          try {
            await db.UserFavoriteQuestion.create({
              user_id: userId,
              question_id: questionId
            });
            console.log(`✅ Вопрос ${questionId} добавлен в избранное пользователем ${username}`);
          } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
              console.log(`ℹ️ Вопрос ${questionId} уже в избранном у пользователя ${username}`);
            } else {
              throw error;
            }
          }
        } else {
          // Удаляем из избранного
          await db.UserFavoriteQuestion.destroy({
            where: {
              user_id: userId,
              question_id: questionId
            }
          });
          console.log(`❌ Вопрос ${questionId} удален из избранного пользователем ${username}`);
        }

        // Уведомляем всех игроков в лобби о изменении избранного
        const eventPayload = {
          userId,
          questionId,
          isFavorite,
          username
        };
        
        nsp.to(roomKey).emit('lobby:favoriteToggled', eventPayload);
        
      } catch (error) {
        console.error('Ошибка при изменении избранного:', error);
        socket.emit('error', { message: 'Ошибка при изменении избранного' });
      }
    });


    // Обработчик отключения
    socket.on('disconnect', async (reason) => {
      console.log(`Сокет отключён: ${socket.id}, reason=${reason}`);

      // Проверяем, был ли отключившийся игрок активным
      const wasActive = await db.UserSession.findOne({
        where: {
          game_session_id: lobbyId,
          user_id: socket.user.id,
          is_user_active: true,
        },
      });

      // Удаляем пользователя из памяти
      if (lobbyUsers.has(lobbyId)) {
        lobbyUsers.get(lobbyId).delete(socket.id);
        await emitUsersList();
      }

      // Если отключился активный игрок - запускаем таймер ожидания
      if (wasActive) {
        console.log(`⚠️ [RECONNECT] Активный игрок ${socket.user.username} отключился`);
        startReconnectTimer(socket.user.id, socket.user.username);
      }

      // Если лобби пустое — ставим таймер на удаление данных
      if (lobbyUsers.has(lobbyId) && lobbyUsers.get(lobbyId).size === 0) {
        const timeoutId = setTimeout(() => {
          lobbyPoints.delete(lobbyId);
          lobbyTimeouts.delete(lobbyId);
          lobbyReconnectTimers.delete(lobbyId);
          lobbyQuestionState.delete(lobbyId);
        }, 5 * 60 * 1000);
        lobbyTimeouts.set(lobbyId, timeoutId);
      }
    });
  });
}

module.exports = initLobbySockets;