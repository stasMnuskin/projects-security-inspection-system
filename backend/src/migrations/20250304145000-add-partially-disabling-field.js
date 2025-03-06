'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // 1. Create ENUM type for severity
      await queryInterface.sequelize.query(`
        CREATE TYPE "enum_Faults_severity" AS ENUM ('non_disabling', 'partially_disabling', 'fully_disabling');
      `).catch(err => {
        // Ignore error if type already exists
        console.log('ENUM type might already exist, continuing...');
      });
      
      // 2. Add severity column
      await queryInterface.addColumn('Faults', 'severity', {
        type: Sequelize.ENUM('non_disabling', 'partially_disabling', 'fully_disabling'),
        allowNull: false,
        defaultValue: 'non_disabling'
      }).catch(err => {
        if (err.message.includes('already exists')) {
          console.log('Column severity already exists, skipping...');
        } else {
          throw err;
        }
      });
      
      // 3. Update severity values based on existing isCritical values
      await queryInterface.sequelize.query(`
        UPDATE "Faults" SET "severity" = CASE 
          WHEN "isCritical" = true THEN 'fully_disabling'
          ELSE 'non_disabling'
        END
      `);
      
      // We're keeping isCritical as boolean for backward compatibility
    } catch (error) {
      console.error('Migration error:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Remove the severity column
      await queryInterface.removeColumn('Faults', 'severity');
      
      // We don't drop the enum type as it might be used elsewhere
    } catch (error) {
      console.error('Migration rollback error:', error);
      throw error;
    }
  }
};
