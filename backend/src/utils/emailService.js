const { google } = require('googleapis');
const logger = require('./logger');
const jwt = require('jsonwebtoken');
const { getActiveSecrets } = require('./secretManager');

const activeSecrets = getActiveSecrets();

// Create OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:5000'
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

const sendEmailWithGmail = async ({ to, subject, text }) => {
  try {
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    // Create the email content
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
      `To: ${to}`,
      `From: ${process.env.GOOGLE_USER}`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${utf8Subject}`,
      '',
      text
    ];
    const message = messageParts.join('\n');

    // The body needs to be base64url encoded
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });

    logger.info(`Email sent successfully to ${to}`);
  } catch (error) {
    logger.error('Error sending email:', error);
    throw error;
  }
};

const emailTemplates = {
  registrationLink: (userData) => {
    const token = jwt.sign({ email: userData.email }, activeSecrets[0], { expiresIn: '24h' });
    const registrationLink = `${process.env.FRONTEND_URL}/register?email=${encodeURIComponent(userData.email)}&token=${token}`;
    
    return {
      subject: 'מייל רישום למערכת',
      text: `ברוכים הבאים למערכת של חברת לוטן

בכדי להשתמש במערכת עליכם להירשם בקישור הבא:
${registrationLink}
במהלך תהליך ההרשמה תתבקשו לספק מספר פרטים מזהים כגון שם מלא ולייצר סיסמא עבורכם.
לאחר שתירשמו, תועברו לדף המערכת.
במידה ותחוו קשיים כלשהם בתהליך ההרשמה או החיבור, אנא צרו קשר איתנו בכתובת:
${process.env.GOOGLE_USER}

נתראה בקרוב,
צוות לוטן גרופ`
    };
  },

  registrationComplete: (userData) => ({
    subject: 'ההרשמה למערכת הושלמה בהצלחה',
    text: `שלום ${userData.name},

ההרשמה למערכת הושלמה בהצלחה.
מעתה תוכלו להיכנס למערכת באמצעות כתובת האימייל והסיסמה שהגדרתם.

במידה ונתקלתם בבעיה כלשהי, אנא צרו קשר עם מנהל המערכת בכתובת:
${process.env.GOOGLE_USER}

בברכה,
צוות לוטן גרופ`
  }),

  passwordReset: (email, resetToken) => {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?email=${encodeURIComponent(email)}&token=${resetToken}`;
    return {
      subject: 'איפוס סיסמה למערכת',
      text: `ברוכים הבאים,
על מנת לאפס את הסיסמה שלכם אנא לחצו על הקישורית הבאה:
${resetLink}

בברכה,
צוות לוטן גרופ`
    };
  },

  passwordResetConfirmation: (userData) => ({
    subject: 'הסיסמה שונתה בהצלחה',
    text: `שלום ${userData.name},

הסיסמה שלכם למערכת שונתה בהצלחה.
מעתה תוכלו להיכנס למערכת עם הסיסמה החדשה.

אם לא אתם ביצעתם את השינוי, אנא צרו קשר מיידית עם מנהל המערכת בכתובת:
${process.env.GOOGLE_USER}

בברכה,
צוות לוטן גרופ`
  }),

  openFaultReminder: (fault) => ({
    subject: `תזכורת: תקלה פתוחה באתר ${fault.siteName}`,
    text: `שלום,

תקלה מספר ${fault.id} באתר ${fault.siteName} נשארה פתוחה למעלה מ-24 שעות.

פרטי התקלה:
סוג: ${fault.type}
${fault.type === 'אחר' ? `תיאור: ${fault.description}\n` : ''}
סטטוס: ${fault.status}
משביתה: ${fault.isCritical ? 'כן' : 'לא'}
נפתחה בתאריך: ${fault.reportedTime}
דווח על ידי: ${fault.reportedBy}

אנא טפלו בתקלה בהקדם האפשרי.

בברכה,
צוות סול-טן`
  })
};

exports.sendEmail = sendEmailWithGmail;

exports.sendRegistrationLink = async (userData) => {
  const template = emailTemplates.registrationLink(userData);
  await sendEmailWithGmail({
    to: userData.email,
    subject: template.subject,
    text: template.text
  });
};

exports.sendRegistrationComplete = async (userData) => {
  const template = emailTemplates.registrationComplete(userData);
  await sendEmailWithGmail({
    to: userData.email,
    subject: template.subject,
    text: template.text
  });
};

exports.sendPasswordResetEmail = async (email, resetToken) => {
  const template = emailTemplates.passwordReset(email, resetToken);
  await sendEmailWithGmail({
    to: email,
    subject: template.subject,
    text: template.text
  });
};

exports.sendPasswordResetConfirmation = async (userData) => {
  const template = emailTemplates.passwordResetConfirmation(userData);
  await sendEmailWithGmail({
    to: userData.email,
    subject: template.subject,
    text: template.text
  });
};

exports.sendOpenFaultReminder = async (fault, adminEmail) => {
  const template = emailTemplates.openFaultReminder(fault);
  await sendEmailWithGmail({
    to: adminEmail,
    subject: template.subject,
    text: template.text
  });
};
