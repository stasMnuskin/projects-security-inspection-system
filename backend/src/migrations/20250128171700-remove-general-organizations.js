'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      DELETE FROM "Organizations" 
      WHERE type = 'general'
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "Organizations" 
      DROP CONSTRAINT IF EXISTS "Organizations_type_check"
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "Organizations" 
      ADD CONSTRAINT "Organizations_type_check" 
      CHECK (type IN ('admin', 'security_officer', 'entrepreneur', 'integrator', 'maintenance', 'control_center'))
    `);
  },

  async down(queryInterface, Sequelize) {
    
    await queryInterface.sequelize.query(`
      ALTER TABLE "Organizations" 
      DROP CONSTRAINT IF EXISTS "Organizations_type_check"
    `);

    
    await queryInterface.sequelize.query(`
      ALTER TABLE "Organizations" 
      ADD CONSTRAINT "Organizations_type_check" 
      CHECK (type IN ('admin', 'security_officer', 'entrepreneur', 'integrator', 'maintenance', 'control_center'))
    `);
  }
};
