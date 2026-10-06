const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

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
    res.status(500).json({ message: 'Ошибка сервера при регистрации' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔑 Попытка входа для:', email);

    // Ищем пользователя по email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log('❌ Пользователь с таким email не найден');
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    // Определяем, в какаом поле хранятся данные пароля
    const passwordInDb = user.passwordHash || user.password;
    console.log('👤 Пользователь найден. Пароль/хэш в БД:', passwordInDb);

    if (!passwordInDb) {
      console.log('❌ В БД у пользователя отсутствует пароль/хэш!');
      return res.status(401).json({ message: 'Ошибка учетной записи' });
    }

    let isValidPassword = false;

    // Проверяем: если пароль в БД начинаются с $2a$ или $2b$, то это bcrypt-хэш
    if (passwordInDb.startsWith('$2a$') || passwordInDb.startsWith('$2b$')) {
      isValidPassword = await bcrypt.compare(password, passwordInDb);
    } else {
      // Если в БД записан обычный открытый текст (например, "admin" или "12345")
      console.log('⚠️ Пароль в БД сохранен открытым текстом, проверяем прямым сравнением');
      isValidPassword = (password === passwordInDb);
    }

    if (!isValidPassword) {
      console.log('❌ Пароль не совпал');
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    // Генерируем JWT токен
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'super_secret_key_12345',
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