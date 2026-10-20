const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { toJSON } = require('./_options');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
  },
  { timestamps: true, toJSON }
);

userSchema.methods.comparePassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

userSchema.pre('deleteOne', { document: true, query: false }, async function () {
  await this.model('Report').deleteMany({ userId: this._id });
});

module.exports = mongoose.model('User', userSchema);
