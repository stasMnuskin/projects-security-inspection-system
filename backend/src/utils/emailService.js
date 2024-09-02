// backend/src/utils/emailService.js

const nodemailer = require('nodemailer');
const Imap = require('imap');
const simpleParser = require('mailparser').simpleParser;
const logger = require('./logger');

const transporter = nodemailer.createTransport({
  // הגדרות SMTP (יש להשלים לפי הגדרות הפרויקט)
});

const imapConfig = {
  user: process.env.EMAIL_USER,
  password: process.env.EMAIL_PASSWORD,
  host: process.env.EMAIL_HOST,
  port: 993,
  tls: true,
};

exports.sendEmail = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: 'system@example.com',
      to,
      subject,
      text
    });
    logger.info(`Email sent successfully to ${to}`);
  } catch (error) {
    logger.error('Error sending email:', error);
    throw error;
  }
};

exports.processFaultEmails = async (callback) => {
  const imap = new Imap(imapConfig);

  return new Promise((resolve, reject) => {
    imap.once('ready', () => {
      imap.openBox('INBOX', false, (err, box) => {
        if (err) {
          logger.error('Error opening inbox:', err);
          reject(err);
          return;
        }
        
        imap.search(['UNSEEN'], (err, results) => {
          if (err) {
            logger.error('Error searching emails:', err);
            reject(err);
            return;
          }

          const f = imap.fetch(results, { bodies: '' });
          f.on('message', msg => {
            msg.on('body', stream => {
              simpleParser(stream, async (err, parsed) => {
                if (err) {
                  logger.error('Error parsing email:', err);
                  return;
                }

                try {
                  await callback(parsed);
                  logger.info('Email processed successfully');
                } catch (error) {
                  logger.error('Error processing email:', error);
                }
              });
            });
          });
          f.once('error', ex => {
            logger.error('Fetch error:', ex);
            reject(ex);
          });
          f.once('end', () => {
            logger.info('Finished processing emails');
            imap.end();
            resolve();
          });
        });
      });
    });

    imap.once('error', err => {
      logger.error('IMAP connection error:', err);
      reject(err);
    });
    imap.once('end', () => {
      logger.info('IMAP connection ended');
    });
    imap.connect();
  });
};