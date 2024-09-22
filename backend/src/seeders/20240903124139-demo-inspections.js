'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const users = await queryInterface.sequelize.query(
      `SELECT id, username FROM "Users" WHERE role = 'inspector' LIMIT 1;`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (users.length === 0) {
      console.log('No inspector found. Make sure to seed users first.');
      return;
    }

    const inspector = users[0];

    // Fetch inspection types
    const inspectionTypes = await queryInterface.sequelize.query(
      `SELECT id, name FROM "InspectionTypes";`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (inspectionTypes.length === 0) {
      console.log('No inspection types found. Make sure to seed inspection types first.');
      return;
    }

    const inspectionTypeMap = inspectionTypes.reduce((acc, type) => {
      acc[type.name] = type.id;
      return acc;
    }, {});

    return queryInterface.bulkInsert('Inspections', [
      {
        siteId: 1,
        inspectionTypeId: inspectionTypeMap['ביקורת שגרתית'],
        status: 'pending',
        formData: JSON.stringify({ notes: 'זוהי ביקורת לדוגמה' }),
        userId: inspector.id,
        inspectorName: inspector.username,
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        siteId: 38,
        inspectionTypeId: inspectionTypeMap['ביקורת משטרה'],
        status: 'completed',
        formData: JSON.stringify({ notes: 'זוהי ביקורת נוספת לדוגמה' }),
        userId: inspector.id,
        inspectorName: inspector.username,
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Inspections', null, {});
  }
};