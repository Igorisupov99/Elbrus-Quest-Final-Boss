require('dotenv').config();
const http = require('http');
const { initSocket } = require('./src/socket')
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const db = require('./db/models');
const authRoutes = require('./src/routes/auth.routes');
const userRouter = require('./src/routes/user.routes');
const roomRouter = require('./src/routes/room.routes');

const app = express();
const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
initSocket(server);

app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use('/api/auth', authRoutes);
app.use('/api/user', userRouter);
app.use('/api/room', roomRouter);

// Глобальный обработчик ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Что-то пошло не так!'
  });
});

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log('✔ PostgreSQL connected');
    await db.sequelize.sync();
    console.log('✔ Models synchronized');
    server.listen(PORT, () => console.log(`🚀 Server on :${PORT}`));
  } catch (err) {
    console.error('✖ DB connection error:', err);
  }
})();

module.exports = app;