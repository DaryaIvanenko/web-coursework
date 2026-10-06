const express = require('express');
const router = express.Router();
const { Deal, Client, Product } = require('../models');

// GET /api/reports/data?entity=Клиенты
router.get('/data', async (req, res) => {
  try {
    const { entity } = req.query;
    console.log('Получен запрос для entity:', entity);
    let data = [];

    if (entity === 'Клиенты') {
      const clients = await Client.findAll();
      // Маппим ключи под названия колонок из вашей таблицы
      data = clients.map(item => ({
        'ID клиента': item.id,
        'Имя': item.name,
        'Email': item.email,
        'Город': item.city,
        'Дата регистрации': item.registrationDate
      }));
    } else if (entity === 'Товары') {
      const products = await Product.findAll();
      data = products.map(item => ({
        'ID товара': item.id,
        'Название товара': item.title,
        'Категория': item.category,
        'Цена': item.price,
        'Остаток на складе': item.stock
      }));
    } else {
      // По умолчанию: 'Продажи и Сделки'
      const deals = await Deal.findAll();
      data = deals.map(item => ({
        'ID сделки': item.id,
        'Сумма продажи': item.amount,
        'Количество товаров': item.quantity,
        'Скидка (%)': item.discount,
        'Статус сделки': item.status,
        'Дата продажи': item.dealDate
      }));
    }

    res.json(data);
  } catch (error) {
    console.error('Ошибка при получении данных:', error);
    res.status(500).json({ message: 'Ошибка сервера при загрузке данных' });
  }
});

module.exports = router;