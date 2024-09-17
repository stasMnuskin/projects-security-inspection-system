'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Rename 'criteria' to 'formData' in Inspections table
      await queryInterface.renameColumn('Inspections', 'criteria', 'formData', { transaction });

      // Rename 'criterionId' to 'fieldId' in InspectionFaults table
      await queryInterface.renameColumn('InspectionFaults', 'criterionId', 'fieldId', { transaction });
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Revert changes in Inspections table
      await queryInterface.renameColumn('Inspections', 'formData', 'criteria', { transaction });

      // Revert changes in InspectionFaults table
      await queryInterface.renameColumn('InspectionFaults', 'fieldId', 'criterionId', { transaction });
    });
  }
};