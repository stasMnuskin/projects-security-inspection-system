const logger = require('./logger');
const db = require('../models');

const processEmails = async () => {
  try {
    if (process.env.NODE_ENV === 'development' && global.receivedEmails) {
      const unprocessedEmails = global.receivedEmails.filter(email => !email.processed);
      
      for (const email of unprocessedEmails) {
        try {
          logger.info(`Processing email: ${email.subject}`);

          const emailData = {
            subject: email.subject || '',
            text: email.text || '',
            sender: email.from || ''
          };

          const parsedData = parseFaultFromEmail(emailData);

          if (parsedData.isClosureEmail) {
            await closeFault(parsedData);
            logger.info('Fault closed successfully');
          } else {
            await createFault(parsedData);
            logger.info('Fault created successfully');
          }

          email.processed = true;

        } catch (error) {
          logger.error(`Error processing email:`, error);
        }
      }
    }
  } catch (error) {
    logger.error('Error in processEmails:', error);
  }
};

const parseFaultFromEmail = (email) => {
  const subject = email.subject.trim() || '';
  const body = email.text.trim() || '';
  const sender = email.sender.trim() || '';

  logger.info(`מפרסר אימייל: נושא: ${subject}, גוף: ${body}`);

  const isClosureEmail = subject.toLowerCase().includes('סגירת תקלה') || subject.toLowerCase().includes('close fault');

  const faultData = {
    siteName: '',
    type: 'אחר',
    description: '',
    reporterName: 'לא ידוע',
    contactNumber: 'לא זמין',
    emailSubject: subject,
    emailSender: sender,
    isClosureEmail: isClosureEmail,
    closureNotes: isClosureEmail ? body : '',
    isCritical: false
  };

  const lines = body.split('\n');

  lines.forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('באתר:')) {
      faultData.siteName = trimmedLine.replace('באתר:', '').trim();
    } else if (trimmedLine.startsWith('סוג תקלה:')) {
      const type = trimmedLine.replace('סוג תקלה:', '').trim();
      if (['גדר', 'מצלמות', 'תקשורת'].includes(type)) {
        faultData.type = type;
      }
    } else if (trimmedLine.startsWith('תקלה:')) {
      faultData.description = trimmedLine.replace('תקלה:', '').trim();
    } else if (trimmedLine.startsWith('משבית:')) {
      const criticalValue = trimmedLine.replace('משבית:', '').trim().toLowerCase();
      faultData.isCritical = criticalValue === 'כן';
    }
  });

  if (!faultData.siteName) {
    const siteNameMatch = subject.match(/תקלה(?:\s+חדשה)?\s+באתר:\s*(.+)/i);
    if (siteNameMatch) {
      faultData.siteName = siteNameMatch[1].trim();
    }
  }

  Object.keys(faultData).forEach(key => {
    if (typeof faultData[key] === 'string') {
      faultData[key] = faultData[key].replace(/[^\x20-\x7E\u0590-\u05FF]/g, '').trim();
    }
  });

  logger.info(`נתוני תקלה שפורסרו: ${JSON.stringify(faultData)}`);
  return faultData;
};

const createFault = async (faultData) => {
  logger.info(`יוצר תקלה: ${JSON.stringify(faultData)}`);

  if (!faultData.siteName) {
    logger.error('שם האתר חסר בנתוני התקלה');
    throw new Error('שם האתר חסר בנתוני התקלה');
  }

  const site = await db.Site.findOne({ 
    where: { name: faultData.siteName },
    include: [{ 
      model: db.User, 
      as: 'entrepreneur',
      attributes: ['id', 'firstName', 'lastName'] 
    }]
  });

  if (!site) {
    logger.error(`האתר לא נמצא: ${faultData.siteName}`);
    throw new Error(`האתר לא נמצא: ${faultData.siteName}`);
  }

  const fault = await db.Fault.create({
    siteId: site.id,
    type: faultData.type,
    description: faultData.description || 'לא סופק תיאור',
    status: 'פתוח',
    reportedBy: 'אימייל',
    reportedTime: new Date(),
    isCritical: faultData.isCritical
  });

  logger.info(`נוצרה תקלה: ${fault.id}`);
  return fault;
};

const closeFault = async (faultData) => {
  logger.info(`סוגר תקלה: ${JSON.stringify(faultData)}`);

  if (!faultData.siteName) {
    logger.error('שם האתר חסר בנתוני סגירת התקלה');
    throw new Error('שם האתר חסר בנתוני סגירת התקלה');
  }

  const site = await db.Site.findOne({ where: { name: faultData.siteName } });

  if (!site) {
    logger.error(`האתר לא נמצא: ${faultData.siteName}`);
    throw new Error(`האתר לא נמצא: ${faultData.siteName}`);
  }

  const fault = await db.Fault.findOne({
    where: {
      siteId: site.id,
      status: 'פתוח'
    },
    order: [['reportedTime', 'DESC']]
  });

  if (!fault) {
    logger.error(`לא נמצאה תקלה פתוחה לאתר: ${faultData.siteName}`);
    throw new Error(`לא נמצאה תקלה פתוחה לאתר: ${faultData.siteName}`);
  }

  await fault.update({
    status: 'סגור',
    closedTime: new Date(),
    closedBy: faultData.emailSender,
    description: fault.description + '\n\nהערות סגירה: ' + faultData.closureNotes
  });

  logger.info(`נסגרה תקלה: ${fault.id}`);
  return fault;
};

module.exports = { processEmails, createFault, parseFaultFromEmail, closeFault };
