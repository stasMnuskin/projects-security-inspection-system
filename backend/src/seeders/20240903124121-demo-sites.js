'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const sites = [
      { id: 1, name: 'זמורות', type: 'רמה ב', entrepreneurId: 10 },
      { id: 2, name: 'משאבי שדה', type: 'רמה ב', entrepreneurId: 10 },
      { id: 3, name: 'אשלים', type: 'רמה ב', entrepreneurId: 10 },
      { id: 4, name: 'קטורה', type: 'רמה ב', entrepreneurId: 10 },
      { id: 5, name: 'תמנע', type: 'רמה ב', entrepreneurId: 10 },
      { id: 6, name: 'גבולות EDF', type: 'רמה ג', entrepreneurId: 10 },
      { id: 7, name: 'תלמי אליהו', type: 'רמה ג', entrepreneurId: 10 },
      { id: 8, name: 'כרם שלום', type: 'רמה ג', entrepreneurId: 10 },
      { id: 9, name: 'נחל עוז', type: 'רמה ג', entrepreneurId: 10 },
      { id: 10, name: 'בטחה', type: 'רמה ג', entrepreneurId: 10 },
      { id: 11, name: 'זוהר', type: 'רמה ג', entrepreneurId: 10 },
      { id: 12, name: 'כוכב מיכאל', type: 'רמה ג', entrepreneurId: 10 },
      { id: 13, name: 'משמר הנגב', type: 'רמה ג', entrepreneurId: 10 },
      { id: 14, name: 'סמר', type: 'רמה ג', entrepreneurId: 10 },
      { id: 15, name: 'ברור חייל', type: 'רמה ג', entrepreneurId: 10 },
      { id: 16, name: 'מצפה', type: 'רמה ג', entrepreneurId: 10 },
      { id: 17, name: 'שורש', type: 'רמה ג', entrepreneurId: 10 },
      { id: 18, name: 'רנן', type: 'רמה ג', entrepreneurId: 10 },
      { id: 19, name: 'פדויים', type: 'רמה ג', entrepreneurId: 10 },
      { id: 20, name: 'מפלסים', type: 'רמה ג', entrepreneurId: 10 },
      { id: 21, name: 'גבים', type: 'רמה ג', entrepreneurId: 10 },
      { id: 22, name: 'בורגתא', type: 'רמה ג', entrepreneurId: 10 },
      { id: 23, name: 'הודיה', type: 'רמה ג', entrepreneurId: 10 },
      { id: 24, name: 'גליה', type: 'רמה ג', entrepreneurId: 10 },
      { id: 25, name: 'לוחמי', type: 'רמה ג', entrepreneurId: 10 },
      { id: 26, name: 'מעברות', type: 'רמה ג', entrepreneurId: 10 },
      { id: 27, name: 'חצב', type: 'רמה ג', entrepreneurId: 10 },
      { id: 28, name: 'להב', type: 'לא מונחים', entrepreneurId: 10 },
      { id: 29, name: 'כפר מימון', type: 'לא מונחים', entrepreneurId: 10 },
      { id: 30, name: 'כמהין', type: 'לא מונחים', entrepreneurId: 10 },
      { id: 31, name: 'אביגדור', type: 'לא מונחים', entrepreneurId: 10 },
      { id: 32, name: 'חצובה', type: 'לא מונחים', entrepreneurId: 10 },
      { id: 33, name: 'חוגלה', type: 'לא מונחים', entrepreneurId: 10 },
      { id: 34, name: 'לוחמי הגטאות', type: 'לא מונחים', entrepreneurId: 10 },
      { id: 35, name: 'עין דור', type: 'לא מונחים', entrepreneurId: 10 },
      { id: 36, name: 'יזרעל', type: 'לא מונחים', entrepreneurId: 10 },
      { id: 37, name: 'סגולה', type: 'לא מונחים', entrepreneurId: 10 },
      { id: 38, name: 'כרמיה', type: 'רמה ג', entrepreneurId: 11 },
      { id: 39, name: 'כפר וורבורג', type: 'רמה ג', entrepreneurId: 11 },
      { id: 40, name: 'יהל', type: 'רמה ג', entrepreneurId: 11 },
      { id: 41, name: 'יוטבתה 2', type: 'רמה ג', entrepreneurId: 11 },
      { id: 42, name: 'גדות', type: 'רמה ג', entrepreneurId: 11 },
      { id: 43, name: 'גבולות דוראל', type: 'רמה ג', entrepreneurId: 11 },
      { id: 44, name: 'תל יוסף', type: 'רמה ג', entrepreneurId: 11 },
      { id: 45, name: 'רשפים', type: 'רמה ג', entrepreneurId: 11 },
      { id: 46, name: 'עברון', type: 'רמה ג', entrepreneurId: 11 },
      { id: 47, name: 'גברעם', type: 'רמה ג', entrepreneurId: 11 },
      { id: 48, name: 'נבטים', type: 'רמה ג', entrepreneurId: 12 },
      { id: 49, name: 'שחר', type: 'רמה ג', entrepreneurId: 12 },
      { id: 50, name: 'ברוש', type: 'רמה ג', entrepreneurId: 12 },
      { id: 51, name: 'שיבולים', type: 'רמה ג', entrepreneurId: 12 },
      { id: 52, name: 'גבועלים', type: 'רמה ג', entrepreneurId: 12 },
      { id: 53, name: 'קרית גת 1', type: 'רמה ג', entrepreneurId: 12 },
      { id: 54, name: 'קרית גת 2', type: 'רמה ג', entrepreneurId: 12 },
      { id: 55, name: 'אורים', type: 'לא מונחה', entrepreneurId: 12 },
      { id: 56, name: 'נעמ"ה', type: 'רמה ג', entrepreneurId: 13 },
      { id: 57, name: 'ערד', type: 'רמה ג', entrepreneurId: 14 },
      { id: 58, name: 'בית נקופה', type: 'רמה ג', entrepreneurId: 15 },
      { id: 59, name: 'צובה', type: 'רמה ג', entrepreneurId: 16 },
      { id: 60, name: 'פלמחים', type: 'רמה ג', entrepreneurId: 16 },
      { id: 61, name: 'מעיין צבי', type: 'רמה ג', entrepreneurId: 17 }
    ];

    await queryInterface.bulkInsert('Sites', sites.map(site => ({
      ...site,
      createdAt: new Date(),
      updatedAt: new Date()
    })));
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Sites', null, {});
  }
};