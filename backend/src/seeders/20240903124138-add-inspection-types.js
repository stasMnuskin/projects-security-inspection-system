'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const inspectionTypes = [
      {
        name: 'ביקורת שגרתית',
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
        ]),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'ביקורת משטרה',
        formStructure: JSON.stringify([
          { id: 'siteName', label: 'שם האתר', type: 'text', autoFill: true },
          { id: 'date', label: 'תאריך', type: 'date', autoFill: true },
          { id: 'time', label: 'שעה', type: 'time', autoFill: true },
          { id: 'inspectorName', label: 'שם מבצע הביקורת', type: 'text', autoFill: true },
          { id: 'policeOfficerName', label: 'שם השוטר', type: 'text' },
          { id: 'policeStation', label: 'תחנת משטרה', type: 'text' },
          { id: 'findings', label: 'ממצאים', type: 'textarea' },
          { id: 'recommendations', label: 'המלצות', type: 'textarea' },
          { id: 'notes', label: 'הערות', type: 'textarea' }
        ]),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'ביקורת משרד האנרגיה',
        formStructure: JSON.stringify([
          { id: 'siteName', label: 'שם האתר', type: 'text', autoFill: true },
          { id: 'date', label: 'תאריך', type: 'date', autoFill: true },
          { id: 'time', label: 'שעה', type: 'time', autoFill: true },
          { id: 'inspectorName', label: 'שם מבצע הביקורת', type: 'text', autoFill: true },
          { id: 'energyOfficerName', label: 'שם המפקח ממשרד האנרגיה', type: 'text' },
          { id: 'inspectionArea', label: 'תחום הביקורת', type: 'text' },
          { id: 'findings', label: 'ממצאים', type: 'textarea' },
          { id: 'recommendations', label: 'המלצות', type: 'textarea' },
          { id: 'followUp', label: 'מעקב ביצוע', type: 'textarea' },
          { id: 'notes', label: 'הערות', type: 'textarea' }
        ]),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'תרגיל פנימי',
        formStructure: JSON.stringify([
          { id: 'siteName', label: 'שם האתר', type: 'text', autoFill: true },
          { id: 'date', label: 'תאריך', type: 'date', autoFill: true },
          { id: 'time', label: 'שעה', type: 'time', autoFill: true },
          { id: 'inspectorName', label: 'שם מבצע הביקורת', type: 'text', autoFill: true },
          { id: 'drillType', label: 'סוג התרגיל', type: 'text' },
          { id: 'participantCount', label: 'מספר משתתפים', type: 'number' },
          { id: 'scenario', label: 'תיאור התרחיש', type: 'textarea' },
          { id: 'executionDescription', label: 'תיאור הביצוע', type: 'textarea' },
          { id: 'lessons', label: 'לקחים', type: 'textarea' },
          { id: 'recommendations', label: 'המלצות', type: 'textarea' },
          { id: 'success', label: 'הצלחה', type: 'radio', options: [
            { label: 'כן', value: 'yes' },
            { label: 'לא', value: 'no' }
          ]},
          { id: 'notes', label: 'הערות', type: 'textarea' }
        ]),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('InspectionTypes', inspectionTypes);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('InspectionTypes', null, {});
  }
};