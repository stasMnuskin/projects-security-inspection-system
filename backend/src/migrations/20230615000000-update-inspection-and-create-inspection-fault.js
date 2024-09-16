'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Add new fields to Inspections table
      await queryInterface.addColumn('Inspections', 'inspectorName', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Unknown'
      }, { transaction });

      await queryInterface.addColumn('Inspections', 'date', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now')
      }, { transaction });

      await queryInterface.addColumn('Inspections', 'criteria', {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {}
      }, { transaction });

      // Remove entrepreneurId column from Inspections table
      await queryInterface.removeColumn('Inspections', 'entrepreneurId', { transaction });

      // Remove details column from Inspections table
      await queryInterface.removeColumn('Inspections', 'details', { transaction });

      // Create InspectionFaults table
      await queryInterface.createTable('InspectionFaults', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        inspectionId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'Inspections',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        faultId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'Faults',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        criterionId: {
          type: Sequelize.STRING,
          allowNull: false
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE
        }
      }, { transaction });

      // Add index to improve query performance
      await queryInterface.addIndex('InspectionFaults', ['inspectionId', 'faultId'], {
        unique: true,
        transaction
      });
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Revert changes to Inspections table
      await queryInterface.removeColumn('Inspections', 'inspectorName', { transaction });
      await queryInterface.removeColumn('Inspections', 'date', { transaction });
      await queryInterface.removeColumn('Inspections', 'criteria', { transaction });

      // Add back entrepreneurId column to Inspections table
      await queryInterface.addColumn('Inspections', 'entrepreneurId', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      }, { transaction });

      // Add back details column to Inspections table
      await queryInterface.addColumn('Inspections', 'details', {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {}
      }, { transaction });

      // Drop InspectionFaults table
      await queryInterface.dropTable('InspectionFaults', { transaction });
    });
  }
};