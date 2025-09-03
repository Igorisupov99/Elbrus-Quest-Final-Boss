// socketMainPage.js
const { Server } = require('socket.io');

function initSocketMainPage(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('✅ User connected:', socket.id);

    socket.on('chat:message', (msg) => {
      console.log('💬 message:', msg);
      // broadcast to all users
      io.emit('chat:message', msg);
    });

    socket.on('disconnect', () => {
      console.log('❌ User disconnected:', socket.id);
    });
  });

  return io;
}

module.exports = initSocketMainPage;
