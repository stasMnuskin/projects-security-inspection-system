'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hashedPassword = await bcrypt.hash('defaultPassword123', 10);
    return queryInterface.bulkInsert('Users', [
      {
        username: 'edf_entrepreneur',
        email: 'edf@example.com',
        password: hashedPassword,
        role: 'entrepreneur',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'doral_entrepreneur',
        email: 'doral@example.com',
        password: '111222333',
        role: 'entrepreneur',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'shikun_entrepreneur',
        email: 'shikun@example.com',
        password: hashedPassword,
        role: 'entrepreneur',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'trilet_entrepreneur',
        email: 'trilet@example.com',
        password: hashedPassword,
        role: 'entrepreneur',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'biogaz_entrepreneur',
        email: 'biogaz@example.com',
        password: hashedPassword,
        role: 'entrepreneur',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'terra_entrepreneur',
        email: 'terra@example.com',
        password: hashedPassword,
        role: 'entrepreneur',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'yevulei_entrepreneur',
        email: 'yevulei@example.com',
        password: hashedPassword,
        role: 'entrepreneur',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'tzabar_entrepreneur',
        email: 'tzabar@example.com',
        password: hashedPassword,
        role: 'entrepreneur',
        createdAt: new Date(),
        updatedAt: new Date()
      },
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Users', { role: 'entrepreneur' }, {});
  }
};