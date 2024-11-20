const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const simpleParser = require('mailparser').simpleParser;
const db = require('../models');
const logger = require('./logger');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:5000'
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

const getGmailTransporter = async () => {
  const accessToken = await oauth2Client.getAccessToken();
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.GOOGLE_USER,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
      accessToken: accessToken.token
    }
  });
};

const processEmails = async () => {
  try {
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const res = await gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread'
    });

    const messages = res.data.messages || [];

    for (const message of messages) {
      try {
        const email = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full'
        });

        logger.info(`מעבד אימייל: ${message.id}`);

        const headers = email.data.payload.headers;
        const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || '';
        const sender = headers.find(h => h.name.toLowerCase() === 'from')?.value || '';
        
        let body = '';
        if (email.data.payload.body.data) {
          body = Buffer.from(email.data.payload.body.data, 'base64').toString('utf-8');
        } else if (email.data.payload.parts) {
          const textPart = email.data.payload.parts.find(part => part.mimeType === 'text/plain');
          if (textPart && textPart.body.data) {
            body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
          }
        }

        if (!body) {
          logger.warn(`אימייל ${message.id} אין גוף קריא`);
          continue;
        }

        logger.info(`נושא האימייל: ${subject}`);
        logger.info(`גוף האימייל (100 תווים ראשונים): ${body.substring(0, 100)}...`);

        const emailData = parseFaultFromEmail({ subject, text: body, sender });
        if (emailData.isClosureEmail) {
          await closeFault(emailData);
          logger.info(`נסגרה תקלה מאימייל: ${message.id}`);
        } else {
          await createFault(emailData);
          logger.info(`נוצרה תקלה מאימייל: ${message.id}`);
        }
        
        await gmail.users.messages.modify({
          userId: 'me',
          id: message.id,
          requestBody: {
            removeLabelIds: ['UNREAD']
          }
        });
      } catch (error) {
        logger.error(`שגיאה בעיבוד אימייל ${message.id}:`, error);
      }
    }
  } catch (error) {
    logger.error('שגיאה בעיבוד אימיילים:', error);
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

module.exports = { processEmails, createFault, parseFaultFromEmail, getGmailTransporter, closeFault };
