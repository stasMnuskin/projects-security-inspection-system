'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Drop existing foreign key constraints
    await queryInterface.removeConstraint('Sites', 'Sites_entrepreneurId_fkey');
    await queryInterface.removeConstraint('Sites', 'Sites_controlCenterUserId_fkey');
    await queryInterface.removeConstraint('OrganizationSites', 'OrganizationSites_organizationId_fkey');
    await queryInterface.removeConstraint('OrganizationSites', 'OrganizationSites_siteId_fkey');
    await queryInterface.removeConstraint('Users', 'Users_organizationId_fkey');
    await queryInterface.removeConstraint('SiteNotificationRecipients', 'SiteNotificationRecipients_userId_fkey');
    await queryInterface.removeConstraint('SiteNotificationRecipients', 'SiteNotificationRecipients_siteId_fkey');

    // Add new constraints with proper onDelete behavior
    await queryInterface.addConstraint('Sites', {
      fields: ['entrepreneurId'],
      type: 'foreign key',
      name: 'Sites_entrepreneurId_fkey',
      references: {
        table: 'Users',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('Sites', {
      fields: ['controlCenterUserId'],
      type: 'foreign key',
      name: 'Sites_controlCenterUserId_fkey',
      references: {
        table: 'Users',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('OrganizationSites', {
      fields: ['organizationId'],
      type: 'foreign key',
      name: 'OrganizationSites_organizationId_fkey',
      references: {
        table: 'Organizations',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('OrganizationSites', {
      fields: ['siteId'],
      type: 'foreign key',
      name: 'OrganizationSites_siteId_fkey',
      references: {
        table: 'Sites',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('Users', {
      fields: ['organizationId'],
      type: 'foreign key',
      name: 'Users_organizationId_fkey',
      references: {
        table: 'Organizations',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('SiteNotificationRecipients', {
      fields: ['userId'],
      type: 'foreign key',
      name: 'SiteNotificationRecipients_userId_fkey',
      references: {
        table: 'Users',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('SiteNotificationRecipients', {
      fields: ['siteId'],
      type: 'foreign key',
      name: 'SiteNotificationRecipients_siteId_fkey',
      references: {
        table: 'Sites',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop the new constraints
    await queryInterface.removeConstraint('Sites', 'Sites_entrepreneurId_fkey');
    await queryInterface.removeConstraint('Sites', 'Sites_controlCenterUserId_fkey');
    await queryInterface.removeConstraint('OrganizationSites', 'OrganizationSites_organizationId_fkey');
    await queryInterface.removeConstraint('OrganizationSites', 'OrganizationSites_siteId_fkey');
    await queryInterface.removeConstraint('Users', 'Users_organizationId_fkey');
    await queryInterface.removeConstraint('SiteNotificationRecipients', 'SiteNotificationRecipients_userId_fkey');
    await queryInterface.removeConstraint('SiteNotificationRecipients', 'SiteNotificationRecipients_siteId_fkey');

    // Add back original constraints
    await queryInterface.addConstraint('Sites', {
      fields: ['entrepreneurId'],
      type: 'foreign key',
      name: 'Sites_entrepreneurId_fkey',
      references: {
        table: 'Users',
        field: 'id'
      },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('Sites', {
      fields: ['controlCenterUserId'],
      type: 'foreign key',
      name: 'Sites_controlCenterUserId_fkey',
      references: {
        table: 'Users',
        field: 'id'
      },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('OrganizationSites', {
      fields: ['organizationId'],
      type: 'foreign key',
      name: 'OrganizationSites_organizationId_fkey',
      references: {
        table: 'Organizations',
        field: 'id'
      },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('OrganizationSites', {
      fields: ['siteId'],
      type: 'foreign key',
      name: 'OrganizationSites_siteId_fkey',
      references: {
        table: 'Sites',
        field: 'id'
      },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('Users', {
      fields: ['organizationId'],
      type: 'foreign key',
      name: 'Users_organizationId_fkey',
      references: {
        table: 'Organizations',
        field: 'id'
      },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('SiteNotificationRecipients', {
      fields: ['userId'],
      type: 'foreign key',
      name: 'SiteNotificationRecipients_userId_fkey',
      references: {
        table: 'Users',
        field: 'id'
      },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('SiteNotificationRecipients', {
      fields: ['siteId'],
      type: 'foreign key',
      name: 'SiteNotificationRecipients_siteId_fkey',
      references: {
        table: 'Sites',
        field: 'id'
      },
      onDelete: 'NO ACTION',
      onUpdate: 'CASCADE'
    });
  }
};
