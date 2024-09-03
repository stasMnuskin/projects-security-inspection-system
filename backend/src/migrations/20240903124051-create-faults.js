'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Faults', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      siteId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Sites',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      description: {
        type: Sequelize.STRING,
        allowNull: false
      },
      severity: {
        type: Sequelize.STRING,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('open', 'closed'),
        defaultValue: 'open'
      },
      reportedBy: {
        type: Sequelize.STRING,
        allowNull: false
      },
      reportedTime: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      entrepreneurName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      siteName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      reporterName: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Email System'
      },
      contactNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'N/A'
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
    await queryInterface.dropTable('Faults');
  }
};