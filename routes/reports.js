const express = require('express');
const router = express.Router();
const { Report } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const isAdminUser = (user) => user.role?.toLowerCase() === 'admin';

// Находит отчёт и проверяет права; возвращает отчёт или null (ответ уже отправлен)
async function findOwnedReport(req, res) {
  const report = await Report.findByPk(req.params.id);
  if (!report) {
    res.status(404).json({ error: 'Отчёт не найден' });
    return null;
  }
  if (!isAdminUser(req.user) && report.userId !== req.user.id) {
    res.status(403).json({ error: 'Нет доступа к этому отчёту' });
    return null;
  }
  return report;
}

// GET /reports
router.get('/', authenticateToken, async (req, res) => {
  try {
    const where = isAdminUser(req.user) ? {} : { userId: req.user.id };
    const reports = await Report.findAll({ where, order: [['createdAt', 'DESC']] });
    return res.json(reports);
  } catch (error) {
    console.error('❌ GET /reports:', error);
    return res.status(500).json({ error: error.message });
  }
});

// POST /reports
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, entityName, selectedFields, filters, description } = req.body;
    if (!title) return res.status(400).json({ error: 'Укажите название отчёта' });

    const newReport = await Report.create({
      title,
      entityName: entityName || 'Продажи и Сделки',
      selectedFields: selectedFields || [],
      filters: filters || {},
      description: description || '',
      userId: req.user.id,
    });
    return res.status(201).json(newReport);
  } catch (error) {
    console.error('❌ POST /reports:', error);
    return res.status(500).json({ error: error.message });
  }
});

// GET /reports/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const report = await findOwnedReport(req, res);
    if (report) res.json(report);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// PUT /reports/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const report = await findOwnedReport(req, res);
    if (!report) return;

    const { title, entityName, selectedFields, filters, description } = req.body;
    await report.update({
      ...(title !== undefined && { title }),
      ...(entityName !== undefined && { entityName }),
      ...(selectedFields !== undefined && { selectedFields }),
      ...(filters !== undefined && { filters }),
      ...(description !== undefined && { description }),
    });
    return res.json(report);
  } catch (error) {
    console.error('❌ PUT /reports/:id:', error);
    return res.status(500).json({ error: error.message });
  }
});

// DELETE /reports/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const report = await findOwnedReport(req, res);
    if (!report) return;
    await report.destroy();
    return res.json({ message: 'Отчёт удалён', id: Number(req.params.id) });
  } catch (error) {
    console.error('❌ DELETE /reports/:id:', error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;