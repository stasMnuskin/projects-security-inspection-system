'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // First, modify the entrepreneurId column to allow null
    await queryInterface.changeColumn('Sites', 'entrepreneurId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert the change by making entrepreneurId non-nullable again
    await queryInterface.changeColumn('Sites', 'entrepreneurId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    });
  }
};
