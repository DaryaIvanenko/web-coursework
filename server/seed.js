require('dotenv').config();

const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { User, Report, Deal, Client, Product } = require('../models');

async function seed() {
  await connectDB();
  await Promise.all([User, Report, Deal, Client, Product].map((M) => M.deleteMany({})));

  const passwordHash = await bcrypt.hash('123456', 10);
  const [admin, user] = await User.create([
    { email: 'admin@test.com', passwordHash, role: 'admin' },
    { email: 'user@test.com', passwordHash, role: 'user' },
  ]);

  await Client.create([
    { name: 'Иван Петров', email: 'ivan@mail.com', city: 'Минск', registrationDate: new Date('2025-01-15') },
    { name: 'Анна Сидорова', email: 'anna@mail.com', city: 'Гомель', registrationDate: new Date('2025-03-02') },
    { name: 'Олег Ковалёв', email: 'oleg@mail.com', city: 'Брест', registrationDate: new Date('2025-05-21') },
  ]);

  await Product.create([
    { title: 'Ноутбук', category: 'Электроника', price: 2500, stock: 12 },
    { title: 'Смартфон', category: 'Электроника', price: 1500, stock: 30 },
    { title: 'Наушники', category: 'Аксессуары', price: 200, stock: 80 },
  ]);

  await Deal.create([
    { amount: 2500, quantity: 1, discount: 0, status: 'Завершена', dealDate: new Date('2025-06-01') },
    { amount: 3000, quantity: 2, discount: 5, status: 'В процессе', dealDate: new Date('2025-06-10') },
    { amount: 400, quantity: 2, discount: 10, status: 'Отменена', dealDate: new Date('2025-06-15') },
  ]);

  await Report.create({
    title: 'Выручка по завершённым сделкам',
    entityName: 'Продажи и Сделки',
    selectedFields: ['Сумма продажи', 'Статус сделки', 'Дата продажи'],
    filters: { column: 'Статус сделки', operator: 'Равно (=)', value: 'Завершена', sortBy: 'Дата продажи', sortOrder: 'По убыванию (DESC)' },
    tags: ['продажи', 'ежемесячный'],
    comments: [{ author: admin._id, authorEmail: admin.email, text: 'Проверить данные за июнь' }],
    description: 'Создан пользователем user@test.com',
    userId: user._id,
  });

  console.log('✅ Тестовые данные добавлены. Вход: admin@test.com / 123456 и user@test.com / 123456');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌ Ошибка seed:', err);
  process.exit(1);
});