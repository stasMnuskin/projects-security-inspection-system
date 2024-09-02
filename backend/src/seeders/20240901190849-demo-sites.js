'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const entrepreneurs = await queryInterface.sequelize.query(
      `SELECT id, name FROM "Entrepreneurs";`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const entrepreneurMap = entrepreneurs.reduce((acc, entrepreneur) => {
      acc[entrepreneur.name] = entrepreneur.id;
      return acc;
    }, {});

    const sites = [
      // EDF
      { name: 'זמורות', type: 'רמה ב', entrepreneurId: entrepreneurMap['EDF'] },
      { name: 'משאבי שדה', type: 'רמה ב', entrepreneurId: entrepreneurMap['EDF'] },
      { name: 'אשלים', type: 'רמה ב', entrepreneurId: entrepreneurMap['EDF'] },
      { name: 'קטורה', type: 'רמה ב', entrepreneurId: entrepreneurMap['EDF'] },
      { name: 'תמנע', type: 'רמה ב', entrepreneurId: entrepreneurMap['EDF'] },
      { name: 'גבולות EDF', type: 'רמה ג', entrepreneurId: entrepreneurMap['EDF'] },
      { name: 'תלמי אליהו', type: 'רמה ג', entrepreneurId: entrepreneurMap['EDF'] },
      { name: 'כרם שלום', type: 'רמה ג', entrepreneurId: entrepreneurMap['EDF'] },
      { name: 'נחל עוז', type: 'רמה ג', entrepreneurId: entrepreneurMap['EDF'] },
      { name: 'בטחה', type: 'רמה ג', entrepreneurId: entrepreneurMap['EDF'] },
      { name: 'זוהר', type: 'רמה ג', entrepreneurId: entrepreneurMap['EDF'] },
      { name: 'כוכב מיכאל', type: 'רמה ג', entrepreneurId: entrepreneurMap['EDF'] },
      { name: 'משמר הנגב', type: 'רמה ג', entrepreneurId: entrepreneurMap['EDF'] },
      { name: 'סמר', type: 'רמה ג', entrepreneurId: entrepreneurMap['EDF'] },
      { name: 'ברור חייל', type: 'רמה ג', entrepreneurId: entrepreneurMap['EDF'] },
      { name: 'מצפה', type: 'רמה ג', entrepreneurId: entrepreneurMap['EDF'] },
      { name: 'שורש', type: 'רמה ג', entrepreneurId: entrepreneurMap['EDF'] },
      { name: 'רנן', type: 'רמה ג', entrepreneurId: entrepreneurMap['EDF'] },
      { name: 'פדויים', type: 'רמה ג', entrepreneurId: entrepreneurMap['EDF'] },
      { name: 'מפלסים', type: 'רמה ג', entrepreneurId: entrepreneurMap['EDF'] },
      { name: 'גבים', type: 'רמה ג', entrepreneurId: entrepreneurMap['EDF'] },
      { name: 'בורגתא', type: 'רמה ג', entrepreneurId: entrepreneurMap['EDF'] },
      { name: 'הודיה', type: 'רמה ג', entrepreneurId: entrepreneurMap['EDF'] },
      { name: 'גליה', type: 'רמה ג', entrepreneurId: entrepreneurMap['EDF'] },
      { name: 'לוחמי', type: 'רמה ג', entrepreneurId: entrepreneurMap['EDF'] },
      { name: 'מעברות', type: 'רמה ג', entrepreneurId: entrepreneurMap['EDF'] },
      { name: 'חצב', type: 'רמה ג', entrepreneurId: entrepreneurMap['EDF'] },
      { name: 'להב', type: 'לא מונחים', entrepreneurId: entrepreneurMap['EDF'] },
      { name: 'כפר מימון', type: 'לא מונחים', entrepreneurId: entrepreneurMap['EDF'] },
      { name: 'כמהין', type: 'לא מונחים', entrepreneurId: entrepreneurMap['EDF'] },
      { name: 'אביגדור', type: 'לא מונחים', entrepreneurId: entrepreneurMap['EDF'] },
      { name: 'חצובה', type: 'לא מונחים', entrepreneurId: entrepreneurMap['EDF'] },
      { name: 'חוגלה', type: 'לא מונחים', entrepreneurId: entrepreneurMap['EDF'] },
      { name: 'לוחמי הגטאות', type: 'לא מונחים', entrepreneurId: entrepreneurMap['EDF'] },
      { name: 'עין דור', type: 'לא מונחים', entrepreneurId: entrepreneurMap['EDF'] },
      { name: 'יזרעל', type: 'לא מונחים', entrepreneurId: entrepreneurMap['EDF'] },
      { name: 'סגולה', type: 'לא מונחים', entrepreneurId: entrepreneurMap['EDF'] },

      // דוראל
      { name: 'כרמיה', type: 'רמה ג', entrepreneurId: entrepreneurMap['דוראל'] },
      { name: 'כפר וורבורג', type: 'רמה ג', entrepreneurId: entrepreneurMap['דוראל'] },
      { name: 'יהל', type: 'רמה ג', entrepreneurId: entrepreneurMap['דוראל'] },
      { name: 'יוטבתה 2', type: 'רמה ג', entrepreneurId: entrepreneurMap['דוראל'] },
      { name: 'גדות', type: 'רמה ג', entrepreneurId: entrepreneurMap['דוראל'] },
      { name: 'גבולות דוראל', type: 'רמה ג', entrepreneurId: entrepreneurMap['דוראל'] },
      { name: 'תל יוסף', type: 'רמה ג', entrepreneurId: entrepreneurMap['דוראל'] },
      { name: 'רשפים', type: 'רמה ג', entrepreneurId: entrepreneurMap['דוראל'] },
      { name: 'עברון', type: 'רמה ג', entrepreneurId: entrepreneurMap['דוראל'] },
      { name: 'גברעם', type: 'רמה ג', entrepreneurId: entrepreneurMap['דוראל'] },

      // שיכון ובינוי
      { name: 'נבטים', type: 'רמה ג', entrepreneurId: entrepreneurMap['שיכון ובינוי'] },
      { name: 'שחר', type: 'רמה ג', entrepreneurId: entrepreneurMap['שיכון ובינוי'] },
      { name: 'ברוש', type: 'רמה ג', entrepreneurId: entrepreneurMap['שיכון ובינוי'] },
      { name: 'שיבולים', type: 'רמה ג', entrepreneurId: entrepreneurMap['שיכון ובינוי'] },
      { name: 'גבועלים', type: 'רמה ג', entrepreneurId: entrepreneurMap['שיכון ובינוי'] },
      { name: 'קרית גת 1', type: 'רמה ג', entrepreneurId: entrepreneurMap['שיכון ובינוי'] },
      { name: 'קרית גת 2', type: 'רמה ג', entrepreneurId: entrepreneurMap['שיכון ובינוי'] },
      { name: 'אורים', type: 'לא מונחה', entrepreneurId: entrepreneurMap['שיכון ובינוי'] },

      // טריילט
      { name: 'נעמ"ה', type: 'רמה ג', entrepreneurId: entrepreneurMap['טריילט'] },

      // ביוגז
      { name: 'ערד', type: 'רמה ג', entrepreneurId: entrepreneurMap['ביוגז'] },

      // טרה לייט
      { name: 'בית נקופה', type: 'רמה ג', entrepreneurId: entrepreneurMap['טרה לייט'] },

      // יבולי שמש
      { name: 'צובה', type: 'רמה ג', entrepreneurId: entrepreneurMap['יבולי שמש'] },
      { name: 'פלמחים', type: 'רמה ג', entrepreneurId: entrepreneurMap['יבולי שמש'] },

      // צבר
      { name: 'מעיין צבי', type: 'רמה ג', entrepreneurId: entrepreneurMap['צבר'] }
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