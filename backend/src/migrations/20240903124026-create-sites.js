'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Sites', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('radar', 'inductive_fence'),
        allowNull: false,
        defaultValue: 'inductive_fence'
      },
      entrepreneurId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      integratorUserIds: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
      },
      maintenanceUserIds: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
      },
      controlCenterUserId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      customFields: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
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

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Sites');
  }
};
