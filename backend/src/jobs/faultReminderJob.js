const cron = require('node-cron');
const { Op } = require('sequelize');
const db = require('../models');
const { sendOpenFaultReminder } = require('../utils/emailService');
const logger = require('../utils/logger');

// Find admin user's email
const getAdminEmail = async () => {
  const admin = await db.User.findOne({
    where: { role: 'admin' }
  });
  return admin ? admin.email : null;
};

// Check for open faults and send reminders
const checkOpenFaults = async () => {
  try {
    const adminEmail = await getAdminEmail();
    if (!adminEmail) {
      logger.error('No admin user found for fault reminders');
      return;
    }

    // Get all open faults
    const openFaults = await db.Fault.findAll({
      where: {
        status: 'פתוח',
        reportedTime: {
          [Op.lte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // More than 24 hours old
        }
      },
      include: [{
        model: db.Site,
        as: 'site',
        attributes: ['name']
      }]
    });

    for (const fault of openFaults) {
      // Check if it's time to send another reminder
      if (fault.shouldSendEmail()) {
        // Prepare fault data for email
        const faultData = {
          id: fault.id,
          siteName: fault.site.name,
          type: fault.type,
          description: fault.description,
          status: fault.status,
          isCritical: fault.isCritical,
          reportedTime: fault.reportedTime,
          reportedBy: fault.reportedBy
        };

        // Send reminder email
        await sendOpenFaultReminder(faultData, adminEmail);
        
        // Update last email time
        await fault.update({
          lastEmailTime: new Date()
        });

        logger.info(`Sent reminder email for fault ${fault.id} to admin`);
      }
    }
  } catch (error) {
    logger.error('Error in fault reminder job:', error);
  }
};

// Run every hour to check for faults that need reminders
cron.schedule('0 * * * *', checkOpenFaults);

module.exports = { checkOpenFaults };
