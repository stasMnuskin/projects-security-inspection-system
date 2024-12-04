const logger = require('./logger');
const { sendOpenFaultReminder } = require('./emailService');

const processOpenFaults = async (faults, adminEmail) => {
  try {
    logger.info('Processing open faults for email notifications');
    
    for (const fault of faults) {
      try {
        await sendOpenFaultReminder(fault, adminEmail);
        logger.info(`Sent reminder for fault ${fault.id}`);
      } catch (error) {
        logger.error(`Error sending reminder for fault ${fault.id}:`, error);
      }
    }
  } catch (error) {
    logger.error('Error in processOpenFaults:', error);
    throw error;
  }
};

module.exports = { processOpenFaults };
