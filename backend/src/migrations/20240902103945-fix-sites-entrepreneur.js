'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // מחק את כל האתרים ללא יזם
    await queryInterface.sequelize.query(`
      DELETE FROM "Sites" WHERE "entrepreneurId" IS NULL;
    `);

    // הוסף אילוץ NOT NULL לעמודת entrepreneurId
    await queryInterface.changeColumn('Sites', 'entrepreneurId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Entrepreneurs',
        key: 'id'
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
   
    await queryInterface.changeColumn('Sites', 'entrepreneurId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Entrepreneurs',
        key: 'id'
      }
    });
  }
};