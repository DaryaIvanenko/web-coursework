const mongoose = require('mongoose');
const { toJSON } = require('./_options');

const commentSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    authorEmail: { type: String },
    text: { type: String, required: true, trim: true, maxlength: 500 },
  },
  { timestamps: { createdAt: true, updatedAt: false }, toJSON }
);

const filtersSchema = new mongoose.Schema(
  {
    column: String,
    operator: String,
    value: String,
    groupBy: String,
    aggregateFunc: String,
    sortBy: String,
    sortOrder: String,
  },
  { _id: false }
);

const reportSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    entityName: { type: String, required: true, default: 'Продажи и Сделки' },
    selectedFields: { type: [String], default: [] },
    filters: { type: filtersSchema, default: () => ({}) },
    tags: { type: [String], default: [] },
    comments: { type: [commentSchema], default: [] },
    description: { type: String, default: '' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, toJSON }
);

reportSchema.index({ userId: 1, createdAt: -1 });

reportSchema.statics.findVisibleTo = function (user, { search, tag } = {}) {
  const filter = {};
  if (String(user.role).toLowerCase() !== 'admin') filter.userId = user.id;

  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rx = new RegExp(escaped, 'i');
    filter.$or = [{ title: rx }, { entityName: rx }];
  }
  if (tag) filter.tags = tag;

  return this.find(filter).sort({ createdAt: -1 }).populate('userId', 'email');
};

module.exports = mongoose.model('Report', reportSchema);