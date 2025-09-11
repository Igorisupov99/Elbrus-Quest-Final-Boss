const jwt = require('jsonwebtoken');
const db = require('../../db/models');


function withAuth(nsp) {
  nsp.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error('Нет токена авторизации'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await db.User.findByPk(decoded.id, {
        attributes: ['id', 'username', 'email'],
      });

      if (!user) {
        return next(new Error('Пользователь не найден'));
      }

      socket.user = user;
      next();
    } catch (err) {
      console.error('Auth error:', err.message);
      next(new Error('Ошибка авторизации'));
    }
  });
}

module.exports = withAuth;
