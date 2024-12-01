'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // First, remove the existing type check constraint
    await queryInterface.sequelize.query(`
      ALTER TABLE "Organizations" 
      DROP CONSTRAINT IF EXISTS "Organizations_type_check"
    `);

    // Add the new type check constraint including 'general'
    await queryInterface.sequelize.query(`
      ALTER TABLE "Organizations" 
      ADD CONSTRAINT "Organizations_type_check" 
      CHECK (type IN ('integrator', 'maintenance', 'general'))
    `);
  },

  async down(queryInterface, Sequelize) {
    // First, remove the new type check constraint
    await queryInterface.sequelize.query(`
      ALTER TABLE "Organizations" 
      DROP CONSTRAINT IF EXISTS "Organizations_type_check"
    `);

    // Add back the original type check constraint
    await queryInterface.sequelize.query(`
      ALTER TABLE "Organizations" 
      ADD CONSTRAINT "Organizations_type_check" 
      CHECK (type IN ('integrator', 'maintenance'))
    `);
  }
};
