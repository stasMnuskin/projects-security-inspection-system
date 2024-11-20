'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create RolePermissions table
    await queryInterface.createTable('RolePermissions', {
      role: {
        type: Sequelize.ENUM(
          'admin',             // מנהל על
          'security_officer',  // קצין ביטחון
          'entrepreneur',      // יזם
          'integrator',        // אינטגרטור
          'maintenance',       // אחזקה
          'control_center'     // מוקד
        ),
        allowNull: false,
        primaryKey: true
      },
      permissions: {
        type: Sequelize.JSON,
        allowNull: false,
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

    // Create Users table
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      organization: {
        type: Sequelize.STRING,
        allowNull: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: true // Allow null for initial registration
      },
      permissions: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: []
      },
      role: {
        type: Sequelize.ENUM(
          'admin',             // מנהל על
          'security_officer',  // קצין ביטחון
          'entrepreneur',      // יזם
          'integrator',        // אינטגרטור
          'maintenance',       // אחזקה
          'control_center'     // מוקד
        ),
        allowNull: false
      },
      passwordChangeRequired: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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

    // Add indexes for faster lookups
    await queryInterface.addIndex('Users', ['email']);
    await queryInterface.addIndex('Users', ['organization']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Users');
    await queryInterface.dropTable('RolePermissions');
  }
};
