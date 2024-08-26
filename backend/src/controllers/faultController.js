const { Fault, Site, InspectionType } = require('../models');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const { sendEmail } = require('../utils/emailService');

exports.createFault = async (req, res, next) => {
  try {
    const { siteId, inspectionTypeId, parameter } = req.body;
    const fault = await Fault.create({ siteId, inspectionTypeId, parameter });
    
    const site = await Site.findByPk(siteId);
    const inspectionType = await InspectionType.findByPk(inspectionTypeId);
    
    await sendEmail('control@example.com', 'New Fault Reported', `
      Site: ${site.name}
      Inspection Parameter: ${inspectionType.name} - ${parameter}
    `);
    
    logger.info(`New fault created for site ${site.name}`);
    res.status(201).json(fault);
  } catch (error) {
    logger.error('Error creating fault:', error);
    next(new AppError('Error creating fault', 500));
  }
};

exports.closeFault = async (req, res, next) => {
  try {
    const { id } = req.params;
    const fault = await Fault.findByPk(id);
    if (!fault) {
      return next(new AppError('Fault not found', 404));
    }
    
    fault.status = 'closed';
    fault.closedAt = new Date();
    await fault.save();
    
    await sendEmail('control@example.com', 'Fault Closed', `
      Fault ID: ${fault.id} has been closed.
    `);
    
    logger.info(`Fault ${id} closed`);
    res.json(fault);
  } catch (error) {
    logger.error('Error closing fault:', error);
    next(new AppError('Error closing fault', 500));
  }
};

exports.getFaultsByDateRange = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const faults = await Fault.findAll({
      where: {
        openedAt: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        }
      },
      include: [{ model: Site }, { model: InspectionType }]
    });
    res.json(faults);
  } catch (error) {
    logger.error('Error fetching faults:', error);
    next(new AppError('Error fetching faults', 500));
  }
};