'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('InspectionFaults');
  },

  down: async (queryInterface, Sequelize) => {
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
      fieldId: {
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
    });

    await queryInterface.addIndex('InspectionFaults', ['inspectionId', 'faultId'], {
      unique: true
    });
  }
};
