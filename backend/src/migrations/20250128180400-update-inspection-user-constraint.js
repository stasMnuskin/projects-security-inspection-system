'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Modify the userId column to allow null
    await queryInterface.changeColumn('Inspections', 'userId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert the change by making userId non-nullable again
    await queryInterface.changeColumn('Inspections', 'userId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    });
  }
};
