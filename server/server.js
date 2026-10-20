require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('../config/db');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', require('../routes/auth'));

app.use('/reports', require('../routes/reportRoutes'));

app.use('/reports', require('../routes/reports'));

app.use('/users', require('../routes/users'));

app.use((req, res) => {
  res.status(404).json({ message: `Маршрут ${req.method} ${req.originalUrl} не найден` });
});

app.use((err, req, res, next) => {
  console.error('💥 Необработанная ошибка:', err);
  res.status(500).json({ message: 'Внутренняя ошибка сервера' });
});

const PORT = process.env.PORT || 3000;
connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Сервер запущен на http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('❌ Ошибка подключения к MongoDB:', err.message);
    process.exit(1);
  });