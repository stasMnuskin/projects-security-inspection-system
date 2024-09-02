const cron = require('node-cron');
const { processEmails } = require('../utils/emailFaultProcessor');
const logger = require('../utils/logger');

// Run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  logger.info('Starting email processing job');
  await processEmails();
});