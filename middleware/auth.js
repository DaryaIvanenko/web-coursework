const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');

const authenticateToken = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Токен не передан' });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    console.error('❌ [AUTH CHECK] Ошибка JWT:', err.message);
    return res.status(401).json({ message: 'Недействительный токен' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user?.role?.toLowerCase() !== 'admin') {
    return res.status(403).json({ message: 'Доступ запрещён' });
  }
  next();
};

module.exports = { authenticateToken, isAdmin };