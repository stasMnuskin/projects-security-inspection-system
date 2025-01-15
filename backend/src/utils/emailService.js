const nodemailer = require('nodemailer');
const logger = require('./logger');
const jwt = require('jsonwebtoken');
const { getActiveSecrets } = require('./secretManager');

const activeSecrets = getActiveSecrets();

// Create SMTP transporter
const createTransporter = () => {
  logger.info('Creating email transporter');
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

const sendEmail = async ({ to, subject, text }) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      envelope: {
        from: process.env.FROM_EMAIL,
        to: to
      },
      from: `מערכת סול-טן <${process.env.FROM_EMAIL}>`,
      to: to,
      subject: subject,
      text: text
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully to ${to}`);
    logger.debug('Email Content:', { to, subject, text });
  } catch (error) {
    logger.error('Error sending email:', error);
    throw error;
  }
};

const emailTemplates = {
  registrationLink: (userData) => {
    const token = jwt.sign({ email: userData.email }, activeSecrets[0], { expiresIn: '24h' });
    const registrationLink = `${process.env.FRONTEND_URL}/register?email=${encodeURIComponent(userData.email)}&token=${token}&name=${encodeURIComponent(userData.name)}`;
    
    return {
      subject: 'מייל רישום למערכת',
      text: `ברוכים הבאים למערכת של חברת לוטן

בכדי להשתמש במערכת עליכם להירשם בקישור הבא:
${registrationLink}
במהלך תהליך ההרשמה תתבקשו לספק מספר פרטים מזהים כגון שם מלא ולייצר סיסמא עבורכם.
לאחר שתירשמו, תועברו לדף המערכת.
במידה ותחוו קשיים כלשהם בתהליך ההרשמה או החיבור, אנא צרו קשר איתנו בכתובת:
${process.env.FROM_EMAIL}

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
${process.env.FROM_EMAIL}

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
${process.env.FROM_EMAIL}

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

exports.sendEmail = sendEmail;

exports.sendRegistrationLink = async (userData) => {
  const template = emailTemplates.registrationLink(userData);
  await sendEmail({
    to: userData.email,
    subject: template.subject,
    text: template.text
  });
};

exports.sendRegistrationComplete = async (userData) => {
  const template = emailTemplates.registrationComplete(userData);
  await sendEmail({
    to: userData.email,
    subject: template.subject,
    text: template.text
  });
};

exports.sendPasswordResetEmail = async (email, resetToken) => {
  const template = emailTemplates.passwordReset(email, resetToken);
  await sendEmail({
    to: email,
    subject: template.subject,
    text: template.text
  });
};

exports.sendPasswordResetConfirmation = async (userData) => {
  const template = emailTemplates.passwordResetConfirmation(userData);
  await sendEmail({
    to: userData.email,
    subject: template.subject,
    text: template.text
  });
};

exports.sendOpenFaultReminder = async (fault, adminEmail) => {
  const template = emailTemplates.openFaultReminder(fault);
  // await sendEmail({
  //   to: adminEmail,
  //   subject: template.subject,
  //   text: template.text
  // });
};
