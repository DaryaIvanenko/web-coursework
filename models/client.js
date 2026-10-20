const mongoose = require('mongoose');
const { toJSON } = require('./_options');

const clientSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    city: String,
    registrationDate: Date,
  },
  { timestamps: true, toJSON }
);

module.exports = mongoose.model('Client', clientSchema);