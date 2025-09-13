require('dotenv').config();

const http = require('http');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');

const db = require('./db/models');
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'https://questcode.ru',
    credentials: true,
  },
});

const authRoutes = require('./src/routes/auth.routes');
const userRouter = require('./src/routes/user.routes');
const roomRouter = require('./src/routes/room.routes');
const questionRouter = require('./src/routes/question.routes');
const examRouter = require('./src/routes/exam.routes');
const friendshipRouter = require('./src/routes/friendship.routes');
const achievementRouter = require('./src/routes/achievement.routes');
const favoriteRouter = require('./src/routes/favorite.routes');
const avatarRouter = require('./src/routes/avatar.routes');
const aiRouter = require('./src/routes/ai.routes');

const initLobbySockets = require('./src/sockets/socketLobbyPage');
const {
  initMainPageSockets,
  emitRoomUpdate,
} = require('./src/sockets/socketMainPage');
const withAuth = require('./src/sockets/withAuth');

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'https://questcode.ru',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Handle preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', process.env.CLIENT_URL || 'https://questcode.ru');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

app.use('/api/auth', authRoutes);
app.use('/api/user', userRouter);
app.use('/api/room', roomRouter);
app.use('/api/question', questionRouter);
app.use('/api/exam', examRouter);
app.use('/api/friendship', friendshipRouter);
app.use('/api/achievement', achievementRouter);
app.use('/api/favorites', favoriteRouter);
app.use('/api/avatars', avatarRouter);
app.use('/api/ai', aiRouter);

const mainNsp = io.of('/');
withAuth(mainNsp);
initMainPageSockets(mainNsp);

// Make io and emitRoomUpdate available globally for room updates
global.io = io;
global.emitRoomUpdate = emitRoomUpdate;

const lobbyNsp = io.of('/lobby');
withAuth(lobbyNsp);
initLobbySockets(lobbyNsp);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Что-то пошло не так!' });
});

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log('✔ PostgreSQL connected');
    await db.sequelize.sync();
    console.log('✔ Models synchronized');

    server.listen(PORT, () => {
      console.log(`🚀 Server on :${PORT}`);
    });
  } catch (err) {
    console.error('✖ DB connection error:', err);
    process.exit(1);
  }
})();
