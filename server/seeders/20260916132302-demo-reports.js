'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Reports', [
      {
        title: 'Заказы с высоким чеком',
        entityName: 'orders',
        selectedFields: JSON.stringify(['id', 'user_id', 'total_amount']),
        filters: JSON.stringify([{ field: 'total_amount', operator: 'GREATER_THAN', value: 10000 }]),
        description: 'Отчёт по крупным заказам клиента за всё время',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 1
      },
      {
        title: 'Заканчивающиеся товары на складе',
        entityName: 'products',
        selectedFields: JSON.stringify(['id', 'name', 'stock_quantity']),
        filters: JSON.stringify([{ field: 'stock_quantity', operator: 'LESS_THAN', value: 5 }]),
        description: 'Список товаров, требующих срочного пополнения',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Reports', null, {});
  }
};
