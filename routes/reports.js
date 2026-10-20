const express = require('express');
const mongoose = require('mongoose');
const { Report } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const isAdminUser = (user) => String(user.role).toLowerCase() === 'admin';
const accessFilter = (user) => (isAdminUser(user) ? {} : { userId: user.id });

const validateObjectId = (req, res, next, value) => {
  if (!mongoose.isValidObjectId(value)) {
    return res.status(400).json({ error: 'Некорректный идентификатор' });
  }
  next();
};
router.param('id', validateObjectId);
router.param('commentId', validateObjectId);

const handleError = (res, error, label) => {
  console.error(`❌ ${label}:`, error);
  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return res.status(400).json({ error: error.message });
  }
  return res.status(500).json({ error: error.message });
};

const EDITABLE_FIELDS = ['title', 'entityName', 'selectedFields', 'filters', 'description', 'tags'];

router.get('/', authenticateToken, async (req, res) => {
  try {
    const search = (req.query.search || '').trim();
    const tag = (req.query.tag || '').trim();
    const reports = await Report.findVisibleTo(req.user, { search, tag });
    return res.json(reports);
  } catch (error) {
    return handleError(res, error, 'GET /reports');
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, entityName, selectedFields, filters, description, tags } = req.body;
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'Укажите название отчёта' });
    }

    const report = await Report.create({
      title,
      entityName: entityName || 'Продажи и Сделки',
      selectedFields: selectedFields || [],
      filters: filters || {},
      description: description || '',
      tags: tags || [],
      userId: req.user.id,
    });
    return res.status(201).json(report);
  } catch (error) {
    return handleError(res, error, 'POST /reports');
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, ...accessFilter(req.user) })
      .populate('userId', 'email');
    if (!report) return res.status(404).json({ error: 'Отчёт не найден' });
    return res.json(report);
  } catch (error) {
    return handleError(res, error, 'GET /reports/:id');
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const update = {};
    for (const field of EDITABLE_FIELDS) {
      if (req.body[field] !== undefined) update[field] = req.body[field];
    }

    const report = await Report.findOneAndUpdate(
      { _id: req.params.id, ...accessFilter(req.user) },
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!report) return res.status(404).json({ error: 'Отчёт не найден' });
    return res.json(report);
  } catch (error) {
    return handleError(res, error, 'PUT /reports/:id');
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const report = await Report.findOneAndDelete({ _id: req.params.id, ...accessFilter(req.user) });
    if (!report) return res.status(404).json({ error: 'Отчёт не найден' });
    return res.json({ message: 'Отчёт удалён', id: req.params.id, report });
  } catch (error) {
    return handleError(res, error, 'DELETE /reports/:id');
  }
});

router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const text = String(req.body.text || '').trim();
    if (!text) return res.status(400).json({ error: 'Введите текст комментария' });

    const report = await Report.findOneAndUpdate(
      { _id: req.params.id, ...accessFilter(req.user) },
      { $push: { comments: { author: req.user.id, authorEmail: req.user.email, text } } },
      { new: true, runValidators: true }
    );
    if (!report) return res.status(404).json({ error: 'Отчёт не найден' });
    return res.status(201).json(report);
  } catch (error) {
    return handleError(res, error, 'POST /reports/:id/comments');
  }
});

router.patch('/:id/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const text = String(req.body.text || '').trim();
    if (!text) return res.status(400).json({ error: 'Введите текст комментария' });

    const report = await Report.findOneAndUpdate(
      { _id: req.params.id, 'comments._id': req.params.commentId, ...accessFilter(req.user) },
      { $set: { 'comments.$.text': text } },
      { new: true, runValidators: true }
    );
    if (!report) return res.status(404).json({ error: 'Отчёт или комментарий не найден' });
    return res.json(report);
  } catch (error) {
    return handleError(res, error, 'PATCH /reports/:id/comments/:commentId');
  }
});

router.delete('/:id/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const report = await Report.findOneAndUpdate(
      { _id: req.params.id, ...accessFilter(req.user) },
      { $pull: { comments: { _id: req.params.commentId } } },
      { new: true }
    );
    if (!report) return res.status(404).json({ error: 'Отчёт не найден' });
    return res.json(report);
  } catch (error) {
    return handleError(res, error, 'DELETE /reports/:id/comments/:commentId');
  }
});

router.post('/:id/tags', authenticateToken, async (req, res) => {
  try {
    const tag = String(req.body.tag || '').trim();
    if (!tag) return res.status(400).json({ error: 'Укажите тег' });

    const report = await Report.findOneAndUpdate(
      { _id: req.params.id, ...accessFilter(req.user) },
      { $addToSet: { tags: tag } },
      { new: true }
    );
    if (!report) return res.status(404).json({ error: 'Отчёт не найден' });
    return res.json(report);
  } catch (error) {
    return handleError(res, error, 'POST /reports/:id/tags');
  }
});

module.exports = router;