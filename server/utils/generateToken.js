const jwt = require('jsonwebtoken');

const {
    JWT_SECRET,
    JWT_REFRESH_SECRET = JWT_SECRET,
    JWT_ACCESS_EXPIRES = '15m',
    JWT_REFRESH_EXPIRES = '7d',
} = process.env;

module.exports = function generateToken(user) {
    // access токен с id и username
    const accessToken = jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: JWT_ACCESS_EXPIRES }
    );

    // refresh токен можно хранить с userId (чтобы было проще)
    const refreshToken = jwt.sign(
        { id: user.id },
        JWT_REFRESH_SECRET,
        { expiresIn: JWT_REFRESH_EXPIRES }
    );

    return { accessToken, refreshToken };
};
