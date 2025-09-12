const db = require('../../db/models');
const { incorrectAnswersMap } = require("../controllers/question.controller");

const lobbyUsers = new Map();
const lobbyPoints = new Map();
const lobbyTimeouts = new Map();
const lobbyExamState = new Map(); // lobbyId -> { questions: any[], index: number, correctAnswers: number, totalQuestions: number, examId: string }
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

        const activePlayerId = activeUserSession ? activeUserSession.user.id : null;

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
      }

      console.log(`⏳ [RECONNECT] Запускаем таймер ожидания для ${activePlayerName} (ID: ${activePlayerId})`);
      
      // Уведомляем всех игроков о начале ожидания
      nsp.to(roomKey).emit('lobby:reconnectWaiting', {
        activePlayerName,
        timeLeft: 30
      });

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
        activePlayerId,
        activePlayerName
      });
    }

    // Функция для отмены таймера ожидания переподключения
    function cancelReconnectTimer() {
      if (lobbyReconnectTimers.has(lobbyId)) {
        const timer = lobbyReconnectTimers.get(lobbyId);
        clearTimeout(timer.timerId);
        lobbyReconnectTimers.delete(lobbyId);
        
        console.log(`✅ [RECONNECT] Таймер ожидания отменен для лобби ${lobbyId}`);
        
        // Уведомляем всех игроков об отмене ожидания
        nsp.to(roomKey).emit('lobby:reconnectCanceled');
        
        // Проверяем, был ли активен экзамен и восстанавливаем его
        const examState = lobbyExamState.get(lobbyId);
        if (examState) {
          console.log(`🔄 [EXAM] Восстанавливаем экзамен для переподключившегося игрока`);
          console.log(`📊 [EXAM] Состояние: вопрос ${examState.index + 1}/${examState.totalQuestions}, правильных ответов: ${examState.correctAnswers}`);
          
          // Отправляем восстановление экзамена всем игрокам
          nsp.to(roomKey).emit('lobby:examRestore', {
            examId: examState.examId,
            questions: examState.questions,
            currentIndex: examState.index,
            correctAnswers: examState.correctAnswers,
            totalQuestions: examState.totalQuestions,
            currentQuestion: examState.questions[examState.index]
          });
          
          // Сбрасываем таймер для восстановленного экзамена
          nsp.to(roomKey).emit('lobby:examTimerReset', { timeLeft: 30 });
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
      cancelReconnectTimer();
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
        await passTurnToNextPlayer();
      }
      
      nsp.to(roomKey).emit('lobby:timeout', payload);
      console.log('📡 [SOCKET] Событие timeout переслано в комнату:', roomKey);
    });

    // Синхронное закрытие модалки всем в лобби
    socket.on('lobby:closeModal', () => {
      console.log('🔒 [SOCKET] Получено lobby:closeModal, пересылаю всем игрокам');
      nsp.to(roomKey).emit('lobby:closeModal');
      console.log('🔒 [SOCKET] Событие closeModal переслано в комнату:', roomKey);
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
        const examId = payload?.examId === 'exam2' ? 'exam2' : 'exam';
        lobbyExamState.set(lobbyId, { 
          questions, 
          index: 0, 
          correctAnswers: 0, 
          totalQuestions: questions.length, 
          examId 
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
        }, 5 * 60 * 1000);
        lobbyTimeouts.set(lobbyId, timeoutId);
      }
    });
  });
}

module.exports = initLobbySockets;