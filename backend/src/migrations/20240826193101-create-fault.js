'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Faults', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      siteId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Sites',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      inspectionTypeId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'InspectionTypes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      parameter: {
        type: Sequelize.STRING
      },
      status: {
        type: Sequelize.ENUM('open', 'closed'),
        defaultValue: 'open'
      },
      openedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      closedAt: {
        type: Sequelize.DATE
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
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Faults');
  }
};