'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove the existing unique constraint on name
    await queryInterface.removeConstraint(
      'Organizations',
      'Organizations_name_key'
    );

    // Add a new composite unique constraint on name and type
    await queryInterface.addConstraint('Organizations', {
      fields: ['name', 'type'],
      type: 'unique',
      name: 'organizations_name_type_unique'
    });

    // Update the foreign key constraint for Users
    await queryInterface.removeConstraint(
      'Users',
      'Users_organizationId_fkey'
    );

    await queryInterface.addConstraint('Users', {
      fields: ['organizationId'],
      type: 'foreign key',
      name: 'Users_organizationId_fkey',
      references: {
        table: 'Organizations',
        field: 'id'
      },
      onDelete: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove the composite unique constraint
    await queryInterface.removeConstraint(
      'Organizations',
      'organizations_name_type_unique'
    );

    // Add back the original unique constraint on name
    await queryInterface.addConstraint('Organizations', {
      fields: ['name'],
      type: 'unique',
      name: 'Organizations_name_key'
    });

    // Revert the foreign key constraint for Users
    await queryInterface.removeConstraint(
      'Users',
      'Users_organizationId_fkey'
    );

    await queryInterface.addConstraint('Users', {
      fields: ['organizationId'],
      type: 'foreign key',
      name: 'Users_organizationId_fkey',
      references: {
        table: 'Organizations',
        field: 'id'
      },
      onDelete: 'SET NULL'
    });
  }
};
