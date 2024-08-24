/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Inspections', 'entrepreneurId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Entrepreneurs',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
    await queryInterface.addColumn('Inspections', 'siteId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Sites',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
    await queryInterface.addColumn('Inspections', 'inspectionTypeId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'InspectionTypes',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    await queryInterface.changeColumn('Inspections', 'entrepreneurId', {
      type: Sequelize.INTEGER,
      allowNull: false
    });
    await queryInterface.changeColumn('Inspections', 'siteId', {
      type: Sequelize.INTEGER,
      allowNull: false
    });
    await queryInterface.changeColumn('Inspections', 'inspectionTypeId', {
      type: Sequelize.INTEGER,
      allowNull: false
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Inspections', 'entrepreneurId');
    await queryInterface.removeColumn('Inspections', 'siteId');
    await queryInterface.removeColumn('Inspections', 'inspectionTypeId');
  }
};