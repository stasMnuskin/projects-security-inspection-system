'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('TRUNCATE TABLE "Users" RESTART IDENTITY CASCADE');

    const hashedPassword = await bcrypt.hash('password123', 10);
    const users = [
      {
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'inspector',
        email: 'inspector@example.com',
        password: hashedPassword,
        role: 'inspector',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'security_officer',
        email: 'security@example.com',
        password: hashedPassword,
        role: 'security_officer',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    return queryInterface.bulkInsert('Users', users, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', null, {});
  }
};