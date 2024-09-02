const db = require('../models');
const logger = require('../utils/logger');
const { processFaultEmails } = require('../utils/emailService');
const AppError = require('../utils/appError');

exports.createFault = async (faultData) => {
  try {
    const fault = await db.Fault.create(faultData);
    logger.info(`Fault created: ${fault.id}`);
    return fault;
  } catch (error) {
    logger.error('Error creating fault:', error);
    throw error;
  }
};

exports.getFaultsBySite = async (siteId, userId) => {
  try {
    const faults = await db.Fault.findAll({
      where: { siteId },
      include: [{
        model: db.Site,
        where: { entrepreneurId: userId },
        attributes: []
      }]
    });
    return faults;
  } catch (error) {
    logger.error('Error fetching faults by site:', error);
    throw error;
  }
};

exports.updateFault = async (id, updateData, userId) => {
  try {
    const [updated] = await db.Fault.update(updateData, {
      where: { id },
      returning: true
    });
    if (updated) {
      const updatedFault = await db.Fault.findByPk(id);
      logger.info(`Fault updated: ${id}`);
      return updatedFault;
    }
    return null;
  } catch (error) {
    logger.error('Error updating fault:', error);
    throw error;
  }
};

exports.deleteFault = async (id, userId) => {
  try {
    const deleted = await db.Fault.destroy({
      where: { id }
    });
    if (deleted) {
      logger.info(`Fault deleted: ${id}`);
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Error deleting fault:', error);
    throw error;
  }
};

exports.processFaultEmailsJob = async () => {
  try {
    await processFaultEmails(async (email) => {
      const faultData = parseFaultFromEmail(email);
      await this.createFault(faultData);
    });
    logger.info('Fault email processing job completed');
  } catch (error) {
    logger.error('Error in fault email processing job:', error);
  }
};

function parseFaultFromEmail(email) {
  const lines = email.text.split('\n');
  const faultData = {};

  lines.forEach(line => {
    const [key, value] = line.split(':').map(item => item.trim());
    switch(key) {
      case 'Entrepreneur':
        faultData.entrepreneurName = value;
        break;
      case 'Site':
        faultData.siteName = value;
        break;
      case 'Site ID':
        faultData.siteId = parseInt(value);
        break;
      case 'Location':
        faultData.location = value;
        break;
      case 'Fault Description':
        faultData.description = value;
        break;
      case 'Reported Time':
        faultData.reportedTime = new Date(value);
        break;
      case 'Severity':
        faultData.severity = value.toLowerCase();
        break;
      case 'Reported By':
        faultData.reportedBy = value;
        break;
      case 'Contact Number':
        faultData.contactNumber = value;
        break;
    }
  });

  return {
    siteId: faultData.siteId,
    description: `${faultData.description} (Location: ${faultData.location})`,
    status: 'open',
    reportedBy: 'control_center',
    severity: faultData.severity,
    reportedTime: faultData.reportedTime,
    entrepreneurName: faultData.entrepreneurName,
    siteName: faultData.siteName,
    reporterName: faultData.reportedBy,
    contactNumber: faultData.contactNumber
  };
}