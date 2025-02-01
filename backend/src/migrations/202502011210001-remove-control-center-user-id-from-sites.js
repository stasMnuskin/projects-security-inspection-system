'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Sites', 'controlCenterUserId');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('Sites', 'controlCenterUserId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    });
  }
};
