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

        logger.info(`Processing email: ${message.id}`);

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
          logger.warn(`Email ${message.id} has no readable body`);
          continue;
        }

        logger.info(`Email subject: ${subject}`);
        logger.info(`Email body (first 100 chars): ${body.substring(0, 100)}...`);

        const faultData = parseFaultFromEmail({ subject, text: body });
        await createFault(faultData);
        logger.info(`Fault created from email: ${message.id}`);
        
        // Mark the email as read
        await gmail.users.messages.modify({
          userId: 'me',
          id: message.id,
          requestBody: {
            removeLabelIds: ['UNREAD']
          }
        });
      } catch (error) {
        logger.error(`Error processing email ${message.id}:`, error);
      }
    }
  } catch (error) {
    logger.error('Error processing emails:', error);
  }
};

const parseFaultFromEmail = (email) => {
  const subject = email.subject || '';
  const body = email.text || '';

  logger.info(`Parsing email: Subject: ${subject}, Body: ${body.substring(0, 100)}...`);

  const siteMatch = subject.match(/Site:\s*(.+)/i) || body.match(/Site:\s*(.+)/i);
  const descriptionMatch = body.match(/Description:\s*(.+)/i);
  const severityMatch = body.match(/Severity:\s*(.+)/i);
  const locationMatch = body.match(/Location:\s*(.+)/i);

  if (!siteMatch) logger.warn('Site not found in email');
  if (!descriptionMatch) logger.warn('Description not found in email');
  if (!severityMatch) logger.warn('Severity not found in email');
  if (!locationMatch) logger.warn('Location not found in email');

  if (!siteMatch || !descriptionMatch || !severityMatch || !locationMatch) {
    throw new Error(`Invalid email format. Subject: ${subject}, Body: ${body.substring(0, 100)}...`);
  }

  return {
    siteName: siteMatch[1].trim(),
    description: descriptionMatch[1].trim(),
    severity: severityMatch[1].trim().toLowerCase(),
    location: locationMatch[1].trim(),
  };
};

const createFault = async (faultData) => {
  logger.info(`Creating fault: ${JSON.stringify(faultData)}`);

  const site = await db.Site.findOne({ 
    where: { name: faultData.siteName },
    include: [{ 
      model: db.Entrepreneur, 
      as: 'entrepreneur',  // שימוש ב-alias
      attributes: ['name'] 
    }]
  });

  if (!site) {
    logger.error(`Site not found: ${faultData.siteName}`);
    throw new Error(`Site not found: ${faultData.siteName}`);
  }

  const fault = await db.Fault.create({
    siteId: site.id,
    description: faultData.description,
    severity: faultData.severity,
    location: faultData.location,
    status: 'open',
    reportedBy: 'email',
    reportedTime: new Date(),
    entrepreneurName: site.entrepreneur.name,  // שימוש ב-alias
    siteName: site.name,
    reporterName: 'Email System',
    contactNumber: 'N/A'
  });

  logger.info(`Fault created: ${fault.id}`);
  return fault;
};

module.exports = { processEmails };