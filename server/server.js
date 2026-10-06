const express = require('express');
const cors = require('cors');
const { User } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const app = express();

app.use(cors());
app.use(express.json());

// --- Роуты ---

// Авторизация (без токена): /auth/login, /auth/register
app.use('/auth', require('../routes/auth'));

// ВАЖНО: /reports/data должен быть подключён РАНЬШЕ, чем /reports/:id,
// иначе запрос "/reports/data" попадёт в обработчик "/:id".
// reportRoutes обрабатывает только GET /data, остальное пропускает дальше.
app.use('/reports', authenticateToken, require('../routes/reportRoutes'));

// CRUD отчётов: GET/POST /reports, GET/PUT/DELETE /reports/:id
app.use('/reports', require('../routes/reports'));

// Список пользователей (без хэшей паролей)
app.get('/users', authenticateToken, async (req, res) => {
  try {
    const { email } = req.query;
    const where = email ? { email } : {};

    const users = await User.findAll({
      where,
      attributes: ['id', 'email', 'role', 'createdAt'],
    });
    return res.json(users);
  } catch (error) {
    console.error('❌ Ошибка GET /users:', error);
    return res.status(500).json({ error: error.message });
  }
});

// --- 404 и глобальный обработчик ошибок ---

app.use((req, res) => {
  res.status(404).json({ message: `Маршрут ${req.method} ${req.originalUrl} не найден` });
});

app.use((err, req, res, next) => {
  console.error('💥 Необработанная ошибка:', err);
  res.status(500).json({ message: 'Внутренняя ошибка сервера' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});