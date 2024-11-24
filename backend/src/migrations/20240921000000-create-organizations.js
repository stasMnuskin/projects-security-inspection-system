module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Organizations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false
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

    // Create join table for Organizations and Sites
    await queryInterface.createTable('OrganizationSites', {
      organizationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Organizations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add unique constraint to prevent duplicate organization-site pairs
    await queryInterface.addConstraint('OrganizationSites', {
      fields: ['organizationId', 'siteId'],
      type: 'unique',
      name: 'unique_organization_site'
    });

    // Add organizationId to Users table
    await queryInterface.addColumn('Users', 'organizationId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Organizations',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove organizationId from Users table
    await queryInterface.removeColumn('Users', 'organizationId');

    // Drop join table
    await queryInterface.dropTable('OrganizationSites');

    // Drop Organizations table
    await queryInterface.dropTable('Organizations');
  }
};
