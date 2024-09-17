'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, insert the inspection types
    const inspectionTypes = [
      { name: 'ביקורת שגרתית' },
      { name: 'ביקורת משטרה' },
      { name: 'ביקורת משרד האנרגיה' },
      { name: 'תרגיל פנימי' }
    ];

    await queryInterface.bulkInsert('InspectionTypes', inspectionTypes.map(type => ({
      ...type,
      createdAt: new Date(),
      updatedAt: new Date()
    })));

    // Fetch the inserted inspection types to get their IDs
    const insertedTypes = await queryInterface.sequelize.query(
      `SELECT id, name FROM InspectionTypes;`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Create a map of type names to their IDs
    const typeIdMap = insertedTypes.reduce((acc, type) => {
      acc[type.name] = type.id;
      return acc;
    }, {});

    // Now, insert the form structures
    const formStructures = [
      {
        inspectionTypeId: typeIdMap['ביקורת שגרתית'],
        formStructure: JSON.stringify([
          { id: 'siteName', label: 'שם האתר', type: 'text', autoFill: true },
          { id: 'date', label: 'תאריך', type: 'date', autoFill: true },
          { id: 'time', label: 'שעה', type: 'time', autoFill: true },
          { id: 'inspectorName', label: 'שם קצין הביטחון', type: 'text', autoFill: true },
          { id: 'lastInspection', label: 'סיור אחרון באתר', type: 'text', autoFill: true },
          { id: 'accessRoute', label: 'דרך גישה', type: 'textarea' },
          { id: 'facilityGates', label: 'שערי המתקן', type: 'textarea' },
          { id: 'fence', label: 'גדר', type: 'textarea' },
          { id: 'cameras', label: 'מצלמות', type: 'textarea' },
          { id: 'publicAddress', label: 'כריזה', type: 'textarea' },
          { id: 'lighting', label: 'תאורה', type: 'textarea' },
          { id: 'vegetation', label: 'עשביה', type: 'textarea' },
          { id: 'notes', label: 'הערות', type: 'textarea' }
        ])
      },
      {
        inspectionTypeId: typeIdMap['ביקורת משטרה'],
        formStructure: JSON.stringify([
          { id: 'siteName', label: 'שם האתר', type: 'text', autoFill: true },
          { id: 'date', label: 'תאריך', type: 'date', autoFill: true },
          { id: 'time', label: 'שעה', type: 'time', autoFill: true },
          { id: 'inspectorName', label: 'שם מבצע הביקורת', type: 'text', autoFill: true },
          { id: 'notes', label: 'הערות', type: 'textarea' }
        ])
      },
      {
        inspectionTypeId: typeIdMap['ביקורת משרד האנרגיה'],
        formStructure: JSON.stringify([
          { id: 'siteName', label: 'שם האתר', type: 'text', autoFill: true },
          { id: 'date', label: 'תאריך', type: 'date', autoFill: true },
          { id: 'time', label: 'שעה', type: 'time', autoFill: true },
          { id: 'inspectorName', label: 'שם מבצע הביקורת', type: 'text', autoFill: true },
          { id: 'notes', label: 'הערות', type: 'textarea' }
        ])
      },
      {
        inspectionTypeId: typeIdMap['תרגיל פנימי'],
        formStructure: JSON.stringify([
          { id: 'drillType', label: 'סוג התרגיל', type: 'text' },
          { id: 'siteName', label: 'שם האתר', type: 'text', autoFill: true },
          { id: 'date', label: 'תאריך', type: 'date', autoFill: true },
          { id: 'time', label: 'שעה', type: 'time', autoFill: true },
          { id: 'inspectorName', label: 'שם מבצע הביקורת', type: 'text', autoFill: true },
          { id: 'success', label: 'הצלחה', type: 'radio', options: [
            { label: 'כן', value: 'yes' },
            { label: 'לא', value: 'no' }
          ]},
          { id: 'notes', label: 'הערות', type: 'textarea' }
        ])
      }
    ];

    await queryInterface.bulkInsert('InspectionFormStructures', formStructures.map(structure => ({
      ...structure,
      createdAt: new Date(),
      updatedAt: new Date()
    })));
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('InspectionFormStructures', null, {});
    await queryInterface.bulkDelete('InspectionTypes', null, {});
  }
};