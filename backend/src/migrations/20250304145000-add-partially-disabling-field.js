'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Check if the isPartiallyDisabling column exists, if not add it
      const tableInfo = await queryInterface.describeTable('Faults');
      
      if (!tableInfo.isPartiallyDisabling) {
        console.log('Adding isPartiallyDisabling column to Faults table');
        await queryInterface.addColumn('Faults', 'isPartiallyDisabling', {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        });
        
        // Update isPartiallyDisabling values (all to false initially)
        await queryInterface.sequelize.query(`
          UPDATE "Faults" SET "isPartiallyDisabling" = false
          WHERE "isPartiallyDisabling" IS NULL
        `);
        
        console.log('Successfully added isPartiallyDisabling column');
      } else {
        console.log('isPartiallyDisabling column already exists');
      }
      
      console.log('Migration completed successfully');
    } catch (error) {
      console.error('Migration error:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      const tableInfo = await queryInterface.describeTable('Faults');
      
      // Remove the isPartiallyDisabling column if it exists
      if (tableInfo.isPartiallyDisabling) {
        await queryInterface.removeColumn('Faults', 'isPartiallyDisabling');
      }
    } catch (error) {
      console.error('Migration rollback error:', error);
      throw error;
    }
  }
};
