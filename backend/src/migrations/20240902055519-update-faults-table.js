'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const tableDefinition = await queryInterface.describeTable('Faults');
      
      if (!tableDefinition.reportedTime) {
        await queryInterface.addColumn('Faults', 'reportedTime', {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }, { transaction });
      }
      
      if (!tableDefinition.entrepreneurName) {
        await queryInterface.addColumn('Faults', 'entrepreneurName', {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'Unknown'
        }, { transaction });
      }
      
      if (!tableDefinition.siteName) {
        await queryInterface.addColumn('Faults', 'siteName', {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'Unknown'
        }, { transaction });
      }
      
      if (!tableDefinition.reporterName) {
        await queryInterface.addColumn('Faults', 'reporterName', {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'Email System'
        }, { transaction });
      }
      
      if (!tableDefinition.contactNumber) {
        await queryInterface.addColumn('Faults', 'contactNumber', {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'N/A'
        }, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn('Faults', 'reportedTime', { transaction });
      await queryInterface.removeColumn('Faults', 'entrepreneurName', { transaction });
      await queryInterface.removeColumn('Faults', 'siteName', { transaction });
      await queryInterface.removeColumn('Faults', 'reporterName', { transaction });
      await queryInterface.removeColumn('Faults', 'contactNumber', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};