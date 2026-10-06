const express = require('express');
const router = express.Router();
const { Report } = require('../models');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// 1. GET /reports — получение отчетов
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { userId, role } = req.query;

    console.log(`📥 Запрос отчетов для userId: ${userId}, role: ${role}`);

    let reports = [];
    if (role === 'admin') {
      reports = await Report.findAll();
    } else {
      reports = await Report.findAll({ where: { userId } });
    }

    // Возвращаем найденные отчеты (или пустой массив [])
    return res.json(reports);
  } catch (error) {
    console.error('❌ Ошибка в GET /reports:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 2. POST /reports — создание отчета
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, entityName, selectedFields, filters, description } = req.body;

    const newReport = await Report.create({
      title,
      entityName: entityName || 'Продажи',
      selectedFields: selectedFields || [],
      filters: filters || {},
      description: description || '',
      userId: req.user.id // автоматически берется из JWT
    });

    return res.status(201).json(newReport);
  } catch (error) {
    console.error('❌ Ошибка POST /reports:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 3. GET /reports/:id — просмотр детальной информации
router.get('/:id', authenticateToken, async (req, res) => {
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

// 4. DELETE /reports/:id — удаление отчета (только admin)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await Report.destroy({ where: { id } });
    return res.json({ message: 'Отчёт удалён' });
  } catch (error) {
    console.error('❌ Ошибка DELETE /reports:', error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;