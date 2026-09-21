const express = require('express');
const app = express();
const { Report } = require('./models');

app.use(express.json());

app.get('/reports', async (req, res) => {
  try {
    const { entityName } = req.query;
    const whereClause = entityName ? { entityName } : {};

    const reports = await Report.findAll({ where: whereClause });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении отчётов' });
  }
});

app.get('/reports/:id', async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Отчёт не найден' });
    }
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/reports', async (req, res) => {
  try {
    const { title, entityName, selectedFields, filters } = req.body;

    if (!title || !entityName || !Array.isArray(selectedFields)) {
      return res.status(400).json({ error: 'Некорректные данные' });
    }

    const newReport = await Report.create({
      title,
      entityName,
      selectedFields,
      filters: filters || []
    });

    res.status(201).json(newReport);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при создании отчёта' });
  }
});

app.put('/reports/:id', async (req, res) => {
  try {
    const { title, entityName, selectedFields, filters } = req.body;

    if (!title || !entityName || !Array.isArray(selectedFields)) {
      return res.status(400).json({ error: 'Некорректные данные' });
    }

    const report = await Report.findByPk(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Отчёт не найден' });
    }

    await report.update({
      title,
      entityName,
      selectedFields,
      filters: filters || []
    });

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при обновлении' });
  }
});

app.delete('/reports/:id', async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Отчёт не найден' });
    }

    await report.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при удалении' });
  }
});

app.use((err, req, res, next) => {
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});