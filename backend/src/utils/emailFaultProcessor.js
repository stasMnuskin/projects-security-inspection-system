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

        const faultData = parseFaultFromEmail({ subject, text: body });
        await createFault(faultData);
        logger.info(`נוצרה תקלה מאימייל: ${message.id}`);
        
        // Mark the email as read
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
  const subject = email.subject || '';
  const body = email.text || '';

  logger.info(`מפרסר אימייל: נושא: ${subject}, גוף: ${body}`);

  const faultData = {
    siteName: '',
    description: '',
    severity: 'רגילה',
    location: '',
    reporterName: 'לא ידוע',
    contactNumber: 'לא זמין'
  };

  // Extract site name from subject
  const siteNameMatch = subject.match(/תקלה באתר:\s*(.+)/);
  if (siteNameMatch) {
    faultData.siteName = siteNameMatch[1].trim();
  }

  const lines = body.split('\n');
  let currentField = '';

  lines.forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine.endsWith(':')) {
      currentField = trimmedLine.slice(0, -1).toLowerCase();
    } else if (currentField && trimmedLine) {
      switch (currentField) {
        case 'אתר':
          if (!faultData.siteName) {
            faultData.siteName = trimmedLine;
          }
          break;
        case 'תיאור':
          faultData.description += (faultData.description ? ' ' : '') + trimmedLine;
          break;
        case 'חומרה':
          faultData.severity = trimmedLine;
          break;
        case 'מיקום':
          faultData.location += (faultData.location ? ' ' : '') + trimmedLine;
          break;
        case 'דווח על ידי':
          faultData.reporterName = trimmedLine;
          break;
        case 'מספר ליצירת קשר':
          faultData.contactNumber = trimmedLine;
          break;
        default:
          // If the field is not recognized, add it to the description
          faultData.description += (faultData.description ? ' ' : '') + `${currentField}: ${trimmedLine}`;
      }
    } else if (trimmedLine) {
      // If there's no current field but the line is not empty, add it to the description
      faultData.description += (faultData.description ? ' ' : '') + trimmedLine;
    }
  });

  // If site name is still empty, try to extract it from the first line of the body
  if (!faultData.siteName) {
    const firstLine = lines[0].trim();
    const siteMatch = firstLine.match(/אתר:\s*(.+)/i);
    if (siteMatch) {
      faultData.siteName = siteMatch[1].trim();
    }
  }

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
      attributes: ['id', 'username'] 
    }]
  });

  if (!site) {
    logger.error(`האתר לא נמצא: ${faultData.siteName}`);
    throw new Error(`האתר לא נמצא: ${faultData.siteName}`);
  }

  const fault = await db.Fault.create({
    siteId: site.id,
    description: faultData.description || 'לא סופק תיאור',
    severity: faultData.severity || 'רגילה',
    location: faultData.location || 'לא צוין',
    status: 'פתוח',
    reportedBy: 'אימייל',
    reportedTime: new Date(),
    entrepreneurName: site.entrepreneur ? site.entrepreneur.username : 'לא ידוע',
    siteName: site.name,
    reporterName: faultData.reporterName || 'לא ידוע',
    contactNumber: faultData.contactNumber || 'לא זמין'
  });

  logger.info(`נוצרה תקלה: ${fault.id}`);
  return fault;
};

module.exports = { processEmails, createFault, parseFaultFromEmail, getGmailTransporter };