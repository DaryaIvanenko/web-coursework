const express = require('express');
const mongoose = require('mongoose');
const { User } = require('../models');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const filter = req.query.email ? { email: String(req.query.email).toLowerCase() } : {};
    const users = await User.find(filter).select('-passwordHash');
    res.json(users);
  } catch (error) {
    console.error('❌ GET /users:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка получения данных профиля' });
  }
});

router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Некорректный id' });
    if (id === req.user.id) return res.status(400).json({ message: 'Нельзя удалить самого себя' });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });

    await user.deleteOne();
    res.json({ message: 'Пользователь и его отчёты удалены', id });
  } catch (error) {
    console.error('❌ DELETE /users/:id:', error);
    res.status(500).json({ message: 'Ошибка удаления пользователя' });
  }
});

module.exports = router;