'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('SiteNotificationRecipients', {
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
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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

    // Add composite unique constraint to prevent duplicate entries
    await queryInterface.addIndex('SiteNotificationRecipients', ['siteId', 'userId'], {
      unique: true,
      name: 'site_notification_recipients_unique'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('SiteNotificationRecipients');
  }
};
