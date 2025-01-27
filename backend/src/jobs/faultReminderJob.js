const cron = require('node-cron');
const { processOpenFaultReminders } = require('../utils/emailFaultProcessor');
const logger = require('../utils/logger');

// Schedule the job to run every day at midnight
const scheduleJob = () => {
  cron.schedule('0 0 * * *', async () => {
    try {
      logger.info('Starting daily fault reminder job');
      await processOpenFaultReminders();
      logger.info('Daily fault reminder job completed');
    } catch (error) {
      logger.error('Error in daily fault reminder job:', error);
    }
  }, {
    timezone: 'Asia/Jerusalem'
  });

  logger.info('Fault reminder job scheduled');
};

module.exports = {
  scheduleJob
};
