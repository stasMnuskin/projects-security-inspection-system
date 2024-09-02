'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const sites = await queryInterface.sequelize.query(
      `SELECT id, "entrepreneurId" FROM "Sites" LIMIT 1;`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (sites.length === 0) {
      console.log('No sites found. Make sure the sites seed has run.');
      return;
    }

    const siteId = sites[0].id;
    const entrepreneurId = sites[0].entrepreneurId;

    if (!entrepreneurId) {
      console.log('No entrepreneur associated with the site. Skipping inspection creation.');
      return;
    }

    const inspectionTypes = await queryInterface.sequelize.query(
      `SELECT id FROM "InspectionTypes" LIMIT 1;`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (inspectionTypes.length === 0) {
      console.log('No inspection types found. Make sure the inspection types seed has run.');
      return;
    }

    const inspectionTypeId = inspectionTypes[0].id;

    const users = await queryInterface.sequelize.query(
      `SELECT id FROM "Users" WHERE role = 'inspector' LIMIT 1;`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (users.length === 0) {
      console.log('No inspector users found. Make sure the users seed has run.');
      return;
    }

    const userId = users[0].id;

    await queryInterface.bulkInsert('Inspections', [{
      entrepreneurId: entrepreneurId,
      siteId: siteId,
      inspectionTypeId: inspectionTypeId,
      userId: userId,
      status: 'pending',
      details: JSON.stringify({ notes: 'This is a demo inspection' }),
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Inspections', null, {});
  }
};