const express = require('express');
const cors = require('cors');

// Импортируем модели из папки models (на уровень выше)
const { User, Report, Deal, Product, Client } = require('../models');

const app = express();

app.use(cors());
app.use(express.json());

// 1. Получение пользователей
app.get('/users', async (req, res) => {
  try {
    const { email } = req.query;
    const whereClause = email ? { email } : {};

    const users = await User.findAll({ where: whereClause });
    return res.json(users);
  } catch (error) {
    console.error('❌ Ошибка GET /users:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 2. Получение отчётов (БЕЗОПАСНАЯ ВЕРСИЯ)
app.get('/reports', async (req, res) => {
  try {
    const { userId, role } = req.query;

    if (!Report) {
      console.error('❌ Модель Report не найдена!');
      return res.status(500).json({ error: 'Модель Report не подключена в models/index.js' });
    }

    let whereClause = {};
    if (role !== 'ADMIN' && userId) {
      whereClause.userId = Number(userId);
    }

    const reportsList = await Report.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    return res.json(reportsList);
  } catch (error) {
    console.error('❌ Ошибка GET /reports:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.get('/reports/data', async (req, res) => {
  try {
    const { entity } = req.query;
    console.log('📊 Запрос данных для сущности:', entity);

    let data = [];

    // В зависимости от того, какая сущность выбрана, делаем запрос к нужной таблице:
    if (entity === 'Продажи и Сделки' || entity === 'Deals') {
      data = await Deal.findAll();
    } else if (entity === 'Продукты' || entity === 'Products') {
      data = await Product.findAll();
    } else if (entity === 'Клиенты' || entity === 'Clients') {
      data = await Client.findAll();
    } else {
      // Если сущность не совпала, отдаём отчёты или все сделки по умолчанию
      data = await Deal.findAll();
    }

    return res.json(data);
  } catch (error) {
    console.error('❌ Ошибка GET /reports/data:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 4. Создание отчёта
app.post('/reports', async (req, res) => {
  try {
    const { title, entityName, selectedFields, filters, description, userId } = req.body;

    const newReport = await Report.create({
      title,
      entityName: entityName || 'Продажи',
      selectedFields: selectedFields || [],
      filters: filters || {},
      description: description || '',
      userId: userId ? Number(userId) : null
    });

    return res.status(201).json(newReport);
  } catch (error) {
    console.error('❌ Ошибка POST /reports:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 5. GET /reports/:id — просмотр детальной информации отчёта
// (Опускаем в самый конец блоков /reports, чтобы не перехватывал /reports/data)
app.get('/reports/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const report = await Report.findByPk(id);

    if (!report) {
      return res.status(404).json({ error: 'Отчёт не найден' });
    }

    return res.json(report);
  } catch (error) {
    console.error('❌ Ошибка GET /reports/:id:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 6. Удаление отчёта
app.delete('/reports/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Report.destroy({ where: { id } });
    return res.json({ message: 'Отчёт удалён' });
  } catch (error) {
    console.error('❌ Ошибка DELETE /reports:', error);
    return res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
});