const nodemailer = require('nodemailer');
const logger = require('./logger');
const jwt = require('jsonwebtoken');
const { getActiveSecrets } = require('./secretManager');

const activeSecrets = getActiveSecrets();
let cachedTransporter = null;

// Validate SMTP configuration
const validateSMTPConfig = () => {
  const requiredFields = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD'];
  const missingFields = requiredFields.filter(field => !process.env[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing SMTP configuration: ${missingFields.join(', ')}`);
  }
};

// Create SMTP transporter based on environment and configuration
const createTransporter = async () => {
  // Return cached transporter if available
  if (cachedTransporter) {
    try {
      await cachedTransporter.verify();
      return cachedTransporter;
    } catch (error) {
      logger.warn('Cached transporter verification failed, creating new one');
      cachedTransporter = null;
    }
  }

  if (process.env.USE_REAL_EMAIL === 'true' || process.env.NODE_ENV === 'production') {
    validateSMTPConfig();
    logger.info('Creating real email transporter');
    
    const transporter = nodemailer.createTransport({
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

    // Verify connection
    try {
      await transporter.verify();
      logger.info('SMTP connection verified successfully');
      cachedTransporter = transporter;
      return transporter;
    } catch (error) {
      logger.error('SMTP connection verification failed:', error);
      throw error;
    }
  } else {
    // Development transporter (local SMTP server)
    logger.info('Using development email server');
    return nodemailer.createTransport({
      host: 'localhost',
      port: 2525,
      secure: false,
      tls: {
        rejectUnauthorized: false
      }
    });
  }
};

const sendEmail = async ({ to, subject, text }, retries = 3) => {
  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const transporter = await createTransporter();
      
      const mailOptions = {
        from: {
          name: 'מערכת סול-טן',
          address: process.env.FROM_EMAIL
        },
        to: to,
        subject: subject,
        text: text
      };

      await transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${to}`);

      // Log email details in development
      if (process.env.NODE_ENV === 'development') {
        logger.info('Email Content:', {
          to: to,
          subject: subject,
          text: text,
          usingRealEmail: process.env.USE_REAL_EMAIL === 'true'
        });
      }

      return;
    } catch (error) {
      lastError = error;
      logger.error(`Error sending email (attempt ${attempt}/${retries}):`, error);
      
      // Clear cached transporter on error
      cachedTransporter = null;
      
      // Wait before retrying (exponential backoff)
      if (attempt < retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
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

//Export functions with the sendEmail implementation
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
  await sendEmail({
    to: adminEmail,
    subject: template.subject,
    text: template.text
  });
};
