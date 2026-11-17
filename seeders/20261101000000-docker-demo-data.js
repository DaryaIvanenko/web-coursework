'use strict';
const bcrypt = require('bcrypt');

const ADMIN_EMAIL = 'admin@test.com';
const USER_EMAIL = 'user@test.com';

module.exports = {
  async up(queryInterface) {
    const existing = await queryInterface.rawSelect('Users', { where: { email: ADMIN_EMAIL } }, 'id');
    if (existing) return;

    const now = new Date();
    const passwordHash = await bcrypt.hash('123456', 10);

    await queryInterface.bulkInsert('Users', [
      { email: ADMIN_EMAIL, passwordHash, role: 'admin', createdAt: now, updatedAt: now },
      { email: USER_EMAIL, passwordHash, role: 'user', createdAt: now, updatedAt: now }
    ]);

    const adminId = await queryInterface.rawSelect('Users', { where: { email: ADMIN_EMAIL } }, 'id');
    const userId = await queryInterface.rawSelect('Users', { where: { email: USER_EMAIL } }, 'id');

    await queryInterface.bulkInsert('Clients', [
      { name: 'Иван Петров', email: 'ivan@mail.com', city: 'Минск', registrationDate: new Date('2025-01-15'), createdAt: now, updatedAt: now },
      { name: 'Анна Сидорова', email: 'anna@mail.com', city: 'Гомель', registrationDate: new Date('2025-03-02'), createdAt: now, updatedAt: now },
      { name: 'Олег Ковалёв', email: 'oleg@mail.com', city: 'Брест', registrationDate: new Date('2025-05-21'), createdAt: now, updatedAt: now }
    ]);

    await queryInterface.bulkInsert('Products', [
      { title: 'Ноутбук', category: 'Электроника', price: 2500, stock: 12, createdAt: now, updatedAt: now },
      { title: 'Смартфон', category: 'Электроника', price: 1500, stock: 30, createdAt: now, updatedAt: now },
      { title: 'Наушники', category: 'Аксессуары', price: 200, stock: 80, createdAt: now, updatedAt: now }
    ]);

    await queryInterface.bulkInsert('Deals', [
      { amount: 2500, quantity: 1, discount: 0, status: 'Завершена', dealDate: new Date('2025-06-01'), createdAt: now, updatedAt: now },
      { amount: 3000, quantity: 2, discount: 5, status: 'В процессе', dealDate: new Date('2025-06-10'), createdAt: now, updatedAt: now },
      { amount: 400, quantity: 2, discount: 10, status: 'Отменена', dealDate: new Date('2025-06-15'), createdAt: now, updatedAt: now }
    ]);

    await queryInterface.bulkInsert('Reports', [
      {
        title: 'Выручка по завершённым сделкам',
        entityName: 'Продажи и Сделки',
        selectedFields: JSON.stringify(['Сумма продажи', 'Статус сделки', 'Дата продажи']),
        filters: JSON.stringify({ column: 'Статус сделки', operator: 'Равно (=)', value: 'Завершена' }),
        description: 'Демонстрационный отчёт пользователя user@test.com',
        userId,
        createdAt: now,
        updatedAt: now
      },
      {
        title: 'Список клиентов по городам',
        entityName: 'Клиенты',
        selectedFields: JSON.stringify(['Имя', 'Город']),
        filters: JSON.stringify({}),
        description: 'Демонстрационный отчёт администратора',
        userId: adminId,
        createdAt: now,
        updatedAt: now
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Reports', null, {});
    await queryInterface.bulkDelete('Deals', null, {});
    await queryInterface.bulkDelete('Clients', null, {});
    await queryInterface.bulkDelete('Products', null, {});
    await queryInterface.bulkDelete('Users', { email: [ADMIN_EMAIL, USER_EMAIL] }, {});
  }
};
