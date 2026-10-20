const mongoose = require('mongoose');
const { toJSON } = require('./_options');

const dealSchema = new mongoose.Schema(
  {
    amount: Number,
    quantity: Number,
    discount: Number,
    status: String,
    dealDate: Date,
  },
  { timestamps: true, toJSON }
);

module.exports = mongoose.model('Deal', dealSchema);