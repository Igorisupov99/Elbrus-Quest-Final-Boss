const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Токен отсутствует'
    });
  }

  try {
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: userId };
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Невалидный токен'
    });
  }
};

module.exports = authMiddleware;