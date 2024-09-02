'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const sites = await queryInterface.sequelize.query(
      `SELECT id, name FROM "Sites";`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (sites.length === 0) {
      console.log('No sites found. Make sure the sites seed has run.');
      return;
    }

    const siteMap = sites.reduce((acc, site) => {
      acc[site.name] = site.id;
      return acc;
    }, {});

    const inspectionTypes = [
      {
        name: 'ביקורת חשמל',
        siteId: siteMap['זמורות'],
        formStructure: JSON.stringify({
          sections: [
            {
              title: 'בדיקת מערכת החשמל',
              questions: [
                { type: 'checkbox', label: 'האם כל הכבלים מחוברים כראוי?' },
                { type: 'text', label: 'ציין את קריאת מד החשמל' }
              ]
            }
          ]
        })
      },
      {
        name: 'ביקורת בטיחות',
        siteId: siteMap['משאבי שדה'],
        formStructure: JSON.stringify({
          sections: [
            {
              title: 'בדיקת ציוד בטיחות',
              questions: [
                { type: 'checkbox', label: 'האם כל מטפי הכיבוי במקומם?' },
                { type: 'checkbox', label: 'האם שלטי היציאה מוארים?' }
              ]
            }
          ]
        })
      }
      // הוסף עוד סוגי ביקורת כאן לפי הצורך
    ];

    await queryInterface.bulkInsert('InspectionTypes', inspectionTypes.map(type => ({
      ...type,
      createdAt: new Date(),
      updatedAt: new Date()
    })));
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('InspectionTypes', null, {});
  }
};