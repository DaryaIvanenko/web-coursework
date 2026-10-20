const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { JWT_SECRET } = require('../config/jwt');

const router = express.Router();
const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

router.post('/register', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Заполните email и пароль' });
    }
    if (await User.exists({ email })) {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, role: 'user' });

    res.status(201).json({ message: 'Пользователь успешно зарегистрирован', userId: user.id });
  } catch (error) {
    console.error('💥 Ошибка регистрации:', error);
    res.status(500).json({ message: 'Ошибка сервера при регистрации' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;
    console.log('🔑 Попытка входа для:', email);

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password || ''))) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('✅ Вход успешен!');
    return res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    console.error('💥 Ошибка сервера при входе:', error);
    return res.status(500).json({ message: 'Ошибка сервера при авторизации' });
  }
});

module.exports = router;