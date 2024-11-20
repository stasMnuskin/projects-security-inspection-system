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
      maintenanceUserId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      integratorUserId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      controlCenterUserId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      type: {
        type: Sequelize.ENUM('גדר', 'מצלמות', 'תקשורת', 'אחר'),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      technician: {
        type: Sequelize.STRING,
        allowNull: true
      },
      isCritical: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      status: {
        type: Sequelize.ENUM('פתוח', 'בטיפול', 'סגור'),
        defaultValue: 'פתוח'
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
      lastEmailTime: {
        type: Sequelize.DATE,
        allowNull: true
      },
      lastUpdatedBy: {
        type: Sequelize.STRING,
        allowNull: true
      },
      lastUpdatedTime: {
        type: Sequelize.DATE,
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
