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
        type: Sequelize.TEXT,
        allowNull: false
      },
      location: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'לא צוין'
      },
      status: {
        type: Sequelize.ENUM('פתוח', 'סגור'),
        defaultValue: 'פתוח'
      },
      reportedBy: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'אימייל'
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
        defaultValue: 'לא ידוע'
      },
      contactNumber: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'לא זמין'
      },
      emailSubject: {
        type: Sequelize.STRING,
        allowNull: true
      },
      emailSender: {
        type: Sequelize.STRING,
        allowNull: true
      },
      closedTime: {
        type: Sequelize.DATE,
        allowNull: true
      },
      closedBy: {
        type: Sequelize.STRING,
        allowNull: true
      },
      closureNotes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      acknowledgedTime: {
        type: Sequelize.DATE,
        allowNull: true
      },
      disabling: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      createdByInspectionId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Inspections',
          key: 'id'
        }
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