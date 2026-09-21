require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const { Report, User} = require('./models');

app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_12345';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Доступ запрещен: токен не предоставлен' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Недействительный или истекший токен' });
    }
    req.user = decoded;
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ error: 'Доступ запрещен: требуется роль администратора' });
  }
};

app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Заполните email и пароль' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      passwordHash,
      role: role || 'user'
    });

    res.status(201).json({
      message: 'Пользователь успешно зарегистрирован',
      userId: user.id
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера при регистрации' });
  }
});

// POST /auth/login — Вход и выдача JWT
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера при авторизации' });
  }
});

// GET /profile — Защищенный маршрут получения профиля
app.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'email', 'role', 'createdAt']
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения данных профиля' });
  }
});

// GET /admin/users — Маршрут только для администратора (доп. механизм RBAC)
app.get('/admin/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await User.findAll({ attributes: ['id', 'email', 'role', 'createdAt'] });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения списка пользователей' });
  }
});

// 1. GET /reports (получение всех отчётов или с фильтрацией по query)
app.get('/reports', async (req, res) => {
  try {
    const { entityName } = req.query;
    const whereClause = entityName ? { entityName } : {};

    const reports = await Report.findAll({ where: whereClause });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении отчётов' });
  }
});

// 2. GET /reports/:id (поиск отчёта по ID)
app.get('/reports/:id', async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Отчёт не найден' });
    }
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// 3. POST /reports (создание отчёта)
app.post('/reports', async (req, res) => {
  try {
    const { title, entityName, selectedFields, filters } = req.body;

    if (!title || !entityName || !Array.isArray(selectedFields)) {
      return res.status(400).json({ error: 'Некорректные данные' });
    }

    const newReport = await Report.create({
      title,
      entityName,
      selectedFields,
      filters: filters || []
    });

    res.status(201).json(newReport);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при создании отчёта' });
  }
});

// 4. PUT /reports/:id (обновление отчёта)
app.put('/reports/:id', async (req, res) => {
  try {
    const { title, entityName, selectedFields, filters } = req.body;

    if (!title || !entityName || !Array.isArray(selectedFields)) {
      return res.status(400).json({ error: 'Некорректные данные' });
    }

    const report = await Report.findByPk(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Отчёт не найден' });
    }

    await report.update({
      title,
      entityName,
      selectedFields,
      filters: filters || []
    });

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при обновлении' });
  }
});

// 5. DELETE /reports/:id (удаление отчёта)
app.delete('/reports/:id', async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Отчёт не найден' });
    }

    await report.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при удалении' });
  }
});

// Глобальная обработка ошибок
app.use((err, req, res, next) => {
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});