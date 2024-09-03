'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('InspectionTypes', [
      {
        name: 'ביקורת חשמל',
        siteId: 1,
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
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'ביקורת בטיחות',
        siteId: 2,
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
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('InspectionTypes', null, {});
  }
};