const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const db = require('../../db/models');

function initSocket(httpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:5173',
            credentials: true,
        }
    });

    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token;

            if (!token) {
                return next(new Error('Нет токена'));
            }

            const payload = jwt.verify(token, process.env.JWT_SECRET);

            socket.data.user = {
                id: payload.id,
                username: payload.username,
            };

            next();
        } catch (error) {
            next(new Error('Невалидный токен'));
        }
    });

    io.on('connection', (socket) => {
        socket.on('joinLobby', async ({ lobbyId }) => {
            if (!lobbyId) {
                socket.emit('error', { message: 'Лобби не существует' });
                return;
            }

            const roomKey = `lobby:${lobbyId}`;

            await socket.join(roomKey);

            const lastMessages = await db.ChatGameSession.findAll({
                where: { game_session_id: lobbyId },
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

            socket.to(roomKey).emit('system', {
                type: 'join',
                userId: socket.data.user.id,
                username: socket.data.user.username,
            });
        });

        socket.on('chat:message', async ({ lobbyId, text }) => {
            if (!lobbyId || !text || typeof text !== 'string' || !text.trim()) {
                socket.emit('error', { message: 'Сообщение некорректно' });
                return;
            }

            const roomKey = `lobby:${lobbyId}`;

            const created = await db.ChatGameSession.create({
                game_session_id: lobbyId,
                user_id: socket.data.user.id,
                message: text.trim(),
            });

            const dto = {
                id: created.id,
                text: created.message,
                user: { id: socket.data.user.id, username: socket.data.user.username },
                createdAt: created.createdAt,
            };

            io.to(roomKey).emit('chat:message', dto);
        });

        socket.on('leaveLobby', ({ lobbyId }) => {
            const roomKey = `lobby:${lobbyId}`;
            socket.leave(roomKey);

            io.to(roomKey).emit('system', {
                type: 'leave',
                userId: socket.data.user.id,
                username: socket.data.user.username,
            });
        });

        socket.on('disconnect', (reason) => {
            console.log(`Socket disconnected: ${socket.id}, reason=${reason}`);
        });
    });
}

module.exports = { initSocket };
