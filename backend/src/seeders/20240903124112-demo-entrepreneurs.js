'use strict';
const bcrypt = require('bcrypt');
const crypto = require('crypto');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const entrepreneurs = [
      { id: 70, username: 'edf_entrepreneur', email: 'edf@example.com' },
      { id: 71, username: 'doral_entrepreneur', email: 'doral@example.com' },
      { id: 72, username: 'shikun_entrepreneur', email: 'shikun@example.com' },
      { id: 73, username: 'trilet_entrepreneur', email: 'trilet@example.com' },
      { id: 74, username: 'biogaz_entrepreneur', email: 'biogaz@example.com' },
      { id: 75, username: 'terra_entrepreneur', email: 'terra@example.com' },
      { id: 76, username: 'yevulei_entrepreneur', email: 'yevulei@example.com' },
      { id: 77, username: 'tzabar_entrepreneur', email: 'tzabar@example.com' }
    ];

    const entrepreneursWithPasswords = await Promise.all(entrepreneurs.map(async (entrepreneur) => {
      const tempPassword = crypto.randomBytes(10).toString('hex');
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      console.log(`סיסמה זמנית עבור ${entrepreneur.email}: ${tempPassword}`);
      return {
        ...entrepreneur,
        password: hashedPassword,
        role: 'entrepreneur',
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }));

    return queryInterface.bulkInsert('Users', entrepreneursWithPasswords, {});
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Users', { role: 'entrepreneur' }, {});
  }
};