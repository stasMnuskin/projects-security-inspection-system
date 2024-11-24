module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove the old JSON array columns since we're now using OrganizationSites
    await queryInterface.removeColumn('Sites', 'integratorUserIds');
    await queryInterface.removeColumn('Sites', 'maintenanceUserIds');
  },

  down: async (queryInterface, Sequelize) => {
    // Add back the columns if we need to rollback
    await queryInterface.addColumn('Sites', 'integratorUserIds', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: []
    });
    await queryInterface.addColumn('Sites', 'maintenanceUserIds', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: []
    });
  }
};
