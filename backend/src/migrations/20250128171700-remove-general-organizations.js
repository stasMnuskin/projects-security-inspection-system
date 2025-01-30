'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // First, delete any organizations with type 'general'
    await queryInterface.sequelize.query(`
      DELETE FROM "Organizations" 
      WHERE type = 'general'
    `);

    // Then, remove the existing type check constraint
    await queryInterface.sequelize.query(`
      ALTER TABLE "Organizations" 
      DROP CONSTRAINT IF EXISTS "Organizations_type_check"
    `);

    // Add the new type check constraint with all valid roles
    await queryInterface.sequelize.query(`
      ALTER TABLE "Organizations" 
      ADD CONSTRAINT "Organizations_type_check" 
      CHECK (type IN ('admin', 'security_officer', 'entrepreneur', 'integrator', 'maintenance', 'control_center'))
    `);
  },

  async down(queryInterface, Sequelize) {
    // Remove the new type check constraint
    await queryInterface.sequelize.query(`
      ALTER TABLE "Organizations" 
      DROP CONSTRAINT IF EXISTS "Organizations_type_check"
    `);

    // Add back the previous constraint
    await queryInterface.sequelize.query(`
      ALTER TABLE "Organizations" 
      ADD CONSTRAINT "Organizations_type_check" 
      CHECK (type IN ('admin', 'security_officer', 'entrepreneur', 'integrator', 'maintenance', 'control_center'))
    `);
  }
};
