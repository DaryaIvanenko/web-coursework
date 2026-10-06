const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { JWT_SECRET } = require('../config/jwt');

router.post('/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Заполните email и пароль' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, role: 'user' });

    res.status(201).json({
      message: 'Пользователь успешно зарегистрирован',
      userId: user.id
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера при регистрации' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔑 Попытка входа для:', email);

    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log('❌ Пользователь с таким email не найден');
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    const passwordInDb = user.passwordHash || user.password;
    console.log('👤 Пользователь найден');

    if (!passwordInDb) {
      console.log('❌ В БД у пользователя отсутствует пароль/хэш!');
      return res.status(401).json({ message: 'Ошибка учетной записи' });
    }

    let isValidPassword = false;

    if (passwordInDb.startsWith('$2a$') || passwordInDb.startsWith('$2b$')) {
      isValidPassword = await bcrypt.compare(password, passwordInDb);
    } else {
      console.log('⚠️ Пароль в БД сохранен открытым текстом, проверяем прямым сравнением');
      isValidPassword = (password === passwordInDb);
    }

    if (!isValidPassword) {
      console.log('❌ Пароль не совпал');
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
        

    console.log('✅ Вход успешен!');

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('💥 Ошибка сервера при входе:', error);
    return res.status(500).json({ message: 'Ошибка сервера при авторизации' });
  }
});

module.exports = router;