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

  logger.info(`Parsing email: Subject: ${subject}, Body: ${body}`);

  const faultData = {
    siteName: '',
    description: '',
    severity: 'Low',
    location: '',
    reporterName: 'Unknown',
    contactNumber: 'N/A'
  };

  const lines = body.split('\n');
  let currentField = '';

  lines.forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine.endsWith(':')) {
      currentField = trimmedLine.slice(0, -1).toLowerCase();
    } else if (currentField && trimmedLine) {
      switch (currentField) {
        case 'site':
          faultData.siteName = trimmedLine;
          break;
        case 'description':
          faultData.description += (faultData.description ? ' ' : '') + trimmedLine;
          break;
        case 'severity':
          faultData.severity = trimmedLine;
          break;
        case 'location':
          faultData.location += (faultData.location ? ' ' : '') + trimmedLine;
          break;
        case 'reported by':
          faultData.reporterName = trimmedLine;
          break;
        case 'contact number':
          faultData.contactNumber = trimmedLine;
          break;
      }
    }
  });

  logger.info(`Parsed fault data: ${JSON.stringify(faultData)}`);
  return faultData;
};

const createFault = async (faultData) => {
  logger.info(`Creating fault: ${JSON.stringify(faultData)}`);

  const site = await db.Site.findOne({ 
    where: { name: faultData.siteName },
    include: [{ 
      model: db.User, 
      as: 'entrepreneur',
      attributes: ['id', 'username'] 
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
    entrepreneurName: site.entrepreneur ? site.entrepreneur.username : 'Unknown',
    siteName: site.name,
    reporterName: faultData.reporterName,
    contactNumber: faultData.contactNumber
  });

  logger.info(`Fault created: ${fault.id}`);
  return fault;
};

module.exports = { processEmails, createFault, parseFaultFromEmail, getGmailTransporter };