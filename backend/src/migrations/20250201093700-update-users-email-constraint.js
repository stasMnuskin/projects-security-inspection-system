'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove the existing unique constraint
    await queryInterface.removeConstraint('Users', 'Users_email_key');

    // Add a new partial unique index that excludes soft-deleted records
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX users_email_unique_active 
      ON "Users" (email) 
      WHERE "deletedAt" IS NULL;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the partial unique index
    await queryInterface.sequelize.query(`
      DROP INDEX users_email_unique_active;
    `);

    // Restore the original unique constraint
    await queryInterface.addConstraint('Users', {
      fields: ['email'],
      type: 'unique',
      name: 'Users_email_key'
    });
  }
};
