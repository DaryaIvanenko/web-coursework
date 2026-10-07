const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.use((req, res, next) => {
  const time = new Date().toISOString();
  console.log(`[${time}] ${req.method} ${req.url}`);
  next();
});

app.use((req, res, next) => {
  if (req.query.auth === '1') {
    req.user = { name: 'Администратор' };
  } else {
    req.user = { name: 'Гость' };
  }
  res.locals.user = req.user;
  next();
});

app.get('/', (req, res) => {
  res.render('index', {
    title: 'Главная страница',
    reports: reports
  });
});

app.get('/add', (req, res) => {
  res.render('add', { title: 'Добавить отчет' });
});

app.post('/add', (req, res) => {
  const { title, entityName, selectedFields } = req.body;

  const parsedFields = typeof selectedFields === 'string'
    ? selectedFields.split(',').map(f => f.trim())
    : [];

  const newReport = {
    id: reports.length > 0 ? Math.max(...reports.map(r => r.id)) + 1 : 1,
    title: title || 'Новый отчет',
    entityName: entityName || 'deals',
    selectedFields: parsedFields,
    filters: [],
    createdAt: new Date().toISOString()
  };

  reports.push(newReport);
  res.redirect('/');
});

app.get('/report/:id', (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  const report = reports.find(r => r.id === id);

  if (!report) {
    return next();
  }

  res.render('report', {
    title: report.title,
    report: report
  });
});

app.use((req, res, next) => {
  res.status(404).render('404', { title: '404 - Страница не найдена' });
});

app.use((err, req, res, next) => {
  console.error('[СЕРВЕРНАЯ ОШИБКА]:', err.stack);
  res.status(500).render('500', {
    title: '500 - Ошибка сервера',
    error: err.message || 'Внутренняя ошибка сервера'
  });
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});