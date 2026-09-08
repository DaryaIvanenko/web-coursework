const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware для парсинга JSON
app.use(express.json());

// Временное хранилище отчётов в памяти (In-Memory DB)
let reports = [
  {
    id: 1,
    title: 'Заказы с высоким чеком',
    entityName: 'orders',
    selectedFields: ['id', 'user_id', 'total_amount', 'created_at'],
    filters: [{ field: 'total_amount', operator: 'GREATER_THAN', value: 10000 }],
    createdAt: '2026-03-01T10:00:00Z'
  },
  {
    id: 2,
    title: 'Заканчивающиеся товары на складе',
    entityName: 'products',
    selectedFields: ['id', 'name', 'price', 'stock_quantity'],
    filters: [{ field: 'stock_quantity', operator: 'LESS_THAN', value: 5 }],
    createdAt: '2026-03-05T14:30:00Z'
  }
];

// --- МАРШРУТЫ (REST API) ---

// 1. GET /reports – получение всех отчётов (с фильтрацией по query params)
app.get('/reports', (req, res) => {
  const { entityName } = req.query;
  if (entityName) {
    const filtered = reports.filter(r => r.entityName === entityName);
    return res.json(filtered);
  }
  res.json(reports);
});

// 2. GET /reports/:id – получение одного отчёта по ID
app.get('/reports/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const report = reports.find(r => r.id === id);

  if (!report) {
    return res.status(404).json({ error: `Отчёт с ID ${id} не найден` });
  }

  res.json(report);
});

// 3. POST /reports – создание нового отчёта
app.post('/reports', (req, res) => {
  const { title, entityName, selectedFields, filters } = req.body;

  // Валидация
  if (!title || !entityName || !Array.isArray(selectedFields)) {
    return res.status(400).json({
      error: 'Неверные данные. Поля title, entityName и массив selectedFields обязательны.'
    });
  }

  const newReport = {
    id: reports.length > 0 ? Math.max(...reports.map(r => r.id)) + 1 : 1,
    title,
    entityName,
    selectedFields,
    filters: filters || [],
    createdAt: new Date().toISOString()
  };

  reports.push(newReport);
  res.status(201).json(newReport);
});

// 4. PUT /reports/:id – полное обновление отчёта
app.put('/reports/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const index = reports.findIndex(r => r.id === id);

  if (index === -1) {
    return res.status(404).json({ error: `Отчёт с ID ${id} не найден` });
  }

  const { title, entityName, selectedFields, filters } = req.body;

  if (!title || !entityName || !Array.isArray(selectedFields)) {
    return res.status(400).json({ error: 'Некорректная структура объекта для обновления' });
  }

  reports[index] = {
    ...reports[index],
    title,
    entityName,
    selectedFields,
    filters: filters || []
  };

  res.json(reports[index]);
});

// 5. DELETE /reports/:id – удаление отчёта
app.delete('/reports/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const index = reports.findIndex(r => r.id === id);

  if (index === -1) {
    return res.status(404).json({ error: `Отчёт с ID ${id} не найден` });
  }

  reports.splice(index, 1);
  res.status(204).send();
});

// Глобальный обработчик ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});