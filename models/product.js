const mongoose = require('mongoose');
const { toJSON } = require('./_options');

const productSchema = new mongoose.Schema(
  {
    title: String,
    category: String,
    price: Number,
    stock: Number,
  },
  { timestamps: true, toJSON }
);

module.exports = mongoose.model('Product', productSchema);