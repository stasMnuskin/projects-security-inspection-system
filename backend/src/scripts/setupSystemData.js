const { User, Site } = require('../models');
const bcrypt = require('bcrypt');
const logger = require('../utils/logger');

const INITIAL_DATA = {
  admin: {
    firstName: 'מנהל',
    lastName: 'על',
    email: 'ssllmm290986@gmail.com',
    password: 'Admin123',
    role: 'admin'
  },
  entrepreneurs: [
    {
      firstName: 'EDF',
      lastName: 'נציג',
      email: 'edf@example.com',
      sites: [
        'זמורות', 'משאבי שדה', 'אשלים', 'קטורה', 'תמנע', 'גבולות', 'תלמי אליהו',
        'כרם שלום', 'נחל עוז', 'בטחה', 'זוהר', 'כוכב מיכאל', 'משמר הנגב', 'סמר',
        'ברור חייל', 'מצפה', 'שורש', 'רנן', 'פדויים', 'מפלסים', 'גבים', 'בורגתא',
        'הודיה', 'גליה', 'לוחמי', 'מעברות', 'חצב', 'להב', 'כפר מימון', 'כמהין',
        'אביגדור', 'חצובה', 'חוגלה', 'לוחמי הגטאות', 'עין דור', 'יזרעל', 'סגולה'
      ]
    },
    {
      firstName: 'דוראל',
      lastName: 'נציג',
      email: 'doral@example.com',
      sites: [
        'כרמיה', 'כפר וורבורג', 'יהל', 'יוטבתה', 'גדות', 'גבולות', 'תל יוסף',
        'רשפים', 'עברון', 'גברעם'
      ]
    },
    {
      firstName: 'שיכון ובינוי',
      lastName: 'נציג',
      email: 'shikun@example.com',
      sites: [
        'נבטים', 'שחר', 'ברוש', 'שיבולים', 'גבועלים', 'אורים'
      ]
    },
    {
      firstName: 'טרילט',
      lastName: 'נציג',
      email: 'trilet@example.com',
      sites: ['נעמ"ה']
    },
    {
      firstName: 'ביוגז',
      lastName: 'נציג',
      email: 'biogaz@example.com',
      sites: ['ערד']
    },
    {
      firstName: 'טרה',
      lastName: 'נציג',
      email: 'terra@example.com',
      sites: ['בית נקופה']
    },
    {
      firstName: 'יבולי שער הנגב',
      lastName: 'נציג',
      email: 'yevulei@example.com',
      sites: ['צובה', 'פלמחים']
    },
    {
      firstName: 'צבר',
      lastName: 'נציג',
      email: 'tzabar@example.com',
      sites: ['מעיין צבי']
    }
  ]
};

async function setupSystemData() {
  try {
    logger.info('Starting system data setup...');

    // Create admin user
    const hashedAdminPassword = await bcrypt.hash(INITIAL_DATA.admin.password, 10);
    const admin = await User.create({
      ...INITIAL_DATA.admin,
      password: hashedAdminPassword
    });
    logger.info('Admin user created successfully');

    // Create entrepreneur users and their sites
    for (const entrepreneur of INITIAL_DATA.entrepreneurs) {
      const hashedPassword = await bcrypt.hash('Temp123!', 10);
      const user = await User.create({
        firstName: entrepreneur.firstName,
        lastName: entrepreneur.lastName,
        email: entrepreneur.email,
        password: hashedPassword,
        role: 'entrepreneur'
      });

      // Create sites for this entrepreneur
      for (const siteName of entrepreneur.sites) {
        await Site.create({
          name: siteName,
          type: 'inductive_fence', // All sites start as inductive fence type
          entrepreneurId: user.id
        });
        logger.info(`Created site: ${siteName} for ${entrepreneur.firstName}`);
      }

      logger.info(`Created entrepreneur ${entrepreneur.firstName} with ${entrepreneur.sites.length} sites`);
    }

    logger.info('System data setup completed successfully');
  } catch (error) {
    logger.error('Error in system data setup:', error);
    throw error;
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupSystemData()
    .then(() => {
      logger.info('Setup completed successfully');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Setup failed:', error);
      process.exit(1);
    });
}

module.exports = setupSystemData;
