'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const users = await queryInterface.sequelize.query(
      `SELECT id FROM "Users" WHERE role = 'inspector' LIMIT 1;`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (users.length === 0) {
      console.log('No inspector found. Make sure to seed users first.');
      return;
    }

    const inspectorId = users[0].id;

    return queryInterface.bulkInsert('Inspections', [
      {
        entrepreneurId: 70,
        siteId: 1,
        inspectionTypeId: 1,
        status: 'pending',
        details: JSON.stringify({ notes: 'This is a demo inspection' }),
        userId: inspectorId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        entrepreneurId: 71,
        siteId: 38,
        inspectionTypeId: 2,
        status: 'completed',
        details: JSON.stringify({ notes: 'This is another demo inspection' }),
        userId: inspectorId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Inspections', null, {});
  }
};