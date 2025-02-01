'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    
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
