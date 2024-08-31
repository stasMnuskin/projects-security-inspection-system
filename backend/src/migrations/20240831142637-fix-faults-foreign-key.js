'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      DELETE FROM "Faults"
      WHERE "siteId" NOT IN (SELECT id FROM "Sites");
    `);

    await queryInterface.changeColumn('Faults', 'siteId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Sites',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Faults', 'siteId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Sites',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'NO ACTION'
    });
  }
};