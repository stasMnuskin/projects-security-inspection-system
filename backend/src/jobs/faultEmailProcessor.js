const cron = require('node-cron');
// const { processFaultEmailsJob } = require('../services/faultService');
const logger = require('../utils/logger');

// 1 hour
cron.schedule('0 * * * *', async () => {
  // await processFaultEmailsJob();
});
