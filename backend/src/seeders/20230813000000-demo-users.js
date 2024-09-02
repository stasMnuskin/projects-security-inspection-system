'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    return queryInterface.bulkInsert('Users', [
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
        username: 'entrepreneur',
        email: 'entrepreneur@example.com',
        password: hashedPassword,
        role: 'entrepreneur',
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
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Users', null, {});
  }
};