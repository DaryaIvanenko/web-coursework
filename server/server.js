const express = require('express');
const cors = require('cors');
const { User, Report, Deal, Product, Client } = require('../models');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const app = express();

app.use(cors());
app.use(express.json());

const authRouter = require('../routes/auth');
app.use('/auth', authRouter);

const reportsRouter = require('../routes/reports');
app.use('/reports', reportsRouter);

app.get('/users', authenticateToken, async (req, res) => {
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

app.get('/reports/data', authenticateToken, async (req, res) => {
  try {
    const { entity } = req.query;
    console.log('Запрос данных для сущности:', entity);

    let data = [];

    if (entity === 'Продажи и Сделки' || entity === 'Deals') {
      data = await Deal.findAll();
    } else if (entity === 'Продукты' || entity === 'Products') {
      data = await Product.findAll();
    } else if (entity === 'Клиенты' || entity === 'Clients') {
      data = await Client.findAll();
    } else {
      data = await Deal.findAll();
    }

    return res.json(data);
  } catch (error) {
    console.error('Ошибка GET /reports/data:', error);
    return res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});