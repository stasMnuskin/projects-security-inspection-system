const { Site, User, Fault } = require('../models');
const { sendEmail } = require('./emailService');
const logger = require('./logger');
const { Op } = require('sequelize');

const REMINDER_INTERVALS = {
  CRITICAL: 24,               
  PARTIALLY_DISABLING: 72,    
  LOW_SEVERITY: 24 * 30       
};

function getReminderHoursByFaultSeverity(fault) {
  if (fault.isCritical) {
    return REMINDER_INTERVALS.CRITICAL;
  } else if (fault.isPartiallyDisabling) {
    return REMINDER_INTERVALS.PARTIALLY_DISABLING;
  } else {
    return REMINDER_INTERVALS.LOW_SEVERITY;
  }
}

function getSeverityType(fault) {
  if (fault.isCritical) {
    return 'משביתה לחלוטין';
  } else if (fault.isPartiallyDisabling) {
    return 'משביתה חלקית';
  } else {
    return 'ברמה נמוכה';
  }
}
function createFaultLink(faultId) {
  return `${process.env.FRONTEND_URL}/faults?id=${faultId}`;
}

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('he-IL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

const emailTemplates = {
  newFault: (fault, site) => ({
    subject: `עדכון: תקלה נפתחה לטיפול באתר ${site.name}`,
    text: `ברצוננו לעדכן כי נפתחה תקלה חדשה באתר ${site.name}

פרטי התקלה:
תאריך פתיחה: ${formatDate(fault.reportedTime)}
רכיב: ${fault.type}
הערות: ${fault.description}

לצפייה בתקלה: ${createFaultLink(fault.id)}

נעדכן ברגע שיהיו התפתחויות נוספות.`
  }),

  faultClosed: (fault, site) => ({
    subject: `עדכון: תקלה טופלה ונסגרה באתר ${site.name}`,
    text: `ברצוננו לעדכן כי תקלה טופלה ונסגרה באתר ${site.name}

פרטי התקלה:
תאריך פתיחה: ${formatDate(fault.reportedTime)}
תאריך סגירה: ${formatDate(fault.closedTime)}
רכיב: ${fault.type}
הערות: ${fault.description}

לצפייה בתקלה: ${createFaultLink(fault.id)}

נעדכן ברגע שיהיו התפתחויות נוספות.`
  }),

  openFaultReminder: (fault, site) => {
    const openDuration = calculateDuration(fault.reportedTime);
    return {
      subject: `עדכון: תזכורת לתקלה פתוחה באתר ${site.name}`,
      text: `ברצוננו לעדכן כי התקלה באתר ${site.name} עדיין פתוחה

פרטי התקלה:
תאריך פתיחה: ${formatDate(fault.reportedTime)}
משך זמן שהתקלה פתוחה: ${openDuration}
רכיב: ${fault.type}
הערות: ${fault.description}

לצפייה בתקלה: ${createFaultLink(fault.id)}

נעדכן ברגע שיהיו התפתחויות נוספות.`
    };
  }
};

function calculateDuration(startDate) {
  const start = new Date(startDate);
  const now = new Date();
  const diffInHours = Math.floor((now - start) / (1000 * 60 * 60));
  
  if (diffInHours < 24) {
    return `${diffInHours} שעות`;
  }
  
  const days = Math.floor(diffInHours / 24);
  const remainingHours = diffInHours % 24;
  
  if (remainingHours === 0) {
    return `${days} ימים`;
  }
  
  return `${days} ימים ו-${remainingHours} שעות`;
}

async function sendFaultNotification(fault, type) {
  try {
    const site = await Site.findByPk(fault.siteId, {
      include: [{
        model: User,
        as: 'notificationRecipients',
        attributes: ['email', 'name']
      }]
    });

    if (!site || !site.notificationRecipients || site.notificationRecipients.length === 0) {
      logger.warn(`No notification recipients found for site ${fault.siteId}`);
      return;
    }

    const template = emailTemplates[type](fault, site);
    const recipients = site.notificationRecipients.map(user => user.email);

    // Send email to all recipients
    await sendEmail({
      to: recipients.join(','),
      subject: template.subject,
      text: template.text
    });

    logger.info(`${type} notification sent for fault ${fault.id} to ${recipients.length} recipients`);
  } catch (error) {
    logger.error(`Error sending ${type} notification for fault ${fault.id}:`, error);
    throw error;
  }
}

async function processNewFault(fault) {
  await sendFaultNotification(fault, 'newFault');
  logger.info(`Email notification for new fault ${fault.id} is temporarily disabled`);
}

async function processFaultClosure(fault) {
  await sendFaultNotification(fault, 'faultClosed');
  logger.info(`Email notification for fault closure ${fault.id} is temporarily disabled`);
}

function createThresholdDate(hoursAgo) {
  const threshold = new Date();
  threshold.setHours(threshold.getHours() - hoursAgo);
  return threshold;
}

function createFaultReminderCondition(isCritical, isPartiallyDisabling, intervalHours) {
  const threshold = createThresholdDate(intervalHours);
  
  let partiallyDisablingCondition;
  if (isPartiallyDisabling === null) {
    // For low severity, match both false and null
    partiallyDisablingCondition = {
      [Op.or]: [
        { isPartiallyDisabling: false },
        { isPartiallyDisabling: { [Op.is]: null } }
      ]
    };
  } else {
    partiallyDisablingCondition = { isPartiallyDisabling };
  }
  
  return {
    isCritical,
    ...partiallyDisablingCondition,
    reportedTime: { [Op.lt]: threshold },
    [Op.or]: [
      { lastEmailTime: { [Op.lt]: threshold } },
      { lastEmailTime: { [Op.is]: null } }
    ]
  };
}

async function processOpenFaultReminders() {
  try {
    const openFaults = await Fault.findAll({
      where: {
        status: 'פתוח',
        [Op.or]: [
          // Critical faults - daily reminders
          createFaultReminderCondition(true, false, REMINDER_INTERVALS.CRITICAL),
          
          // Partially disabling faults - every 3 days
          createFaultReminderCondition(false, true, REMINDER_INTERVALS.PARTIALLY_DISABLING),
          
          // Low severity faults - monthly reminders
          createFaultReminderCondition(false, null, REMINDER_INTERVALS.LOW_SEVERITY)
        ]
      }
    });

    for (const fault of openFaults) {
      await sendFaultNotification(fault, 'openFaultReminder');
      
      // Update the lastEmailTime timestamp
      fault.lastEmailTime = new Date();
      await fault.save();
      
      const severityType = getSeverityType(fault);
      logger.info(`Sent reminder for ${severityType} fault #${fault.id} at site ${fault.siteId}`);
    }

    logger.info(`Processed reminders for ${openFaults.length} open faults`);
  } catch (error) {
    logger.error('Error processing open fault reminders:', error);
    throw error;
  }
}

module.exports = {
  processNewFault,
  processFaultClosure,
  processOpenFaultReminders
};
