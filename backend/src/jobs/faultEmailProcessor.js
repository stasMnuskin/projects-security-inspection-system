const cron = require('node-cron');
const { processFaultEmailsJob } = require('../services/faultService');
const logger = require('../utils/logger');

// הרצת המשימה כל שעה
cron.schedule('0 * * * *', async () => {
  logger.info('Starting fault email processing job');
  await processFaultEmailsJob();
});