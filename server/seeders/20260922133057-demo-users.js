'use strict';
const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Хешируем пароль "password123" для тестового пользователя
    const passwordHash = await bcrypt.hash('password123', 10);

    await queryInterface.bulkInsert('Users', [
      {
        id: 1,
        email: 'user1@example.com',
        passwordHash: passwordHash,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        email: 'admin@example.com',
        passwordHash: passwordHash,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', null, {});
  }
};