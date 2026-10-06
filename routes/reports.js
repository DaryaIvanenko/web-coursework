const express = require('express');
const router = express.Router();
const { Report, User } = require('../models');

// 1. ПОЛУЧЕНИЕ ОТЧЁТОВ
router.get('/', async (req, res) => {
  try {
    const { userId, role } = req.query;

    // Если Админ — получаем отчёты всех пользователей
    // Если Юзер — фильтруем по userId
    const whereCondition = role === 'ADMIN' ? {} : { userId: userId };

    const reports = await Report.findAll({
      where: whereCondition,
      order: [['createdAt', 'DESC']]
    });

    return res.json(reports);
  } catch (error) {
    console.error('Ошибка БД:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 2. СОЗДАНИЕ ОТЧЁТА
router.post('/', async (req, res) => {
  try {
    const { title, entityName, selectedFields, filters, description, userId } = req.body;

    const newReport = await Report.create({
      title,
      entityName,
      selectedFields,
      filters,
      description,
      userId
    });

    return res.status(201).json(newReport);
  } catch (error) {
    console.error('Ошибка при создании отчёта:', error);
    return res.status(400).json({ error: error.message });
  }
});

// 3. УДАЛЕНИЕ ОТЧЁТА (Для Админа)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Report.destroy({ where: { id } });
    res.json({ message: 'Отчёт успешно удалён' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/users', async (req, res) => {
  try {
    const { email } = req.query;

    // ВАЖНО: Sequelize ищет совпадения по полю email в модели User
    const whereCondition = email ? { email } : {};

    const users = await User.findAll({ where: whereCondition });
    return res.json(users);
  } catch (error) {
    // ВЫВЕДИТЕ ТЕКСТ ОШИБКИ В КОНСОЛЬ БЭКЕНДА
    console.error('❌ Ошибка Sequelize при запросе пользователей:', error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;