const jwt = require('jsonwebtoken');

const {
    JWT_SECRET,
    JWT_REFRESH_SECRET = JWT_SECRET,
    JWT_ACCESS_EXPIRES = '15m',
    JWT_REFRESH_EXPIRES = '7d',
} = process.env;

module.exports = function generateToken(userId) {
    const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRES });
    const refreshToken = jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES });
    return { accessToken, refreshToken };
};