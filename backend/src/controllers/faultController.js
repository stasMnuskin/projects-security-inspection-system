const db = require('../models');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const { sendEmail } = require('../utils/emailService');
const { Op } = require('sequelize');

exports.createFault = async (req, res, next) => {
  try {
    const { siteId, inspectionTypeId, parameter } = req.body;
    if (!siteId || !inspectionTypeId || !parameter) {
      return next(new AppError('Missing required fields', 400, 'MISSING_FIELDS'));
    }
    const fault = await db.Fault.create(req.body);
    res.status(201).json(fault);
  } catch (error) {
    next(error);
  }
};

exports.closeFault = async (req, res, next) => {
  try {
    const { id } = req.params;
    const fault = await db.Fault.findByPk(id);

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
    res.status(200).json(fault);
  } catch (error) {
    logger.error('Error closing fault:', error);
    next(new AppError('Error closing fault', 500));
  }
};

exports.getFaultsByDateRange = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate || !isValidDate(startDate) || !isValidDate(endDate)) {
      return next(new AppError('Invalid date range', 400, 'INVALID_DATE_RANGE'));
    }

    const faults = await db.Fault.findAll({
      where: {
        createdAt: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        }
      },
      include: [{ model: db.Site }, { model: db.InspectionType }]
    });

    res.status(200).json(faults);
  } catch (error) {
    next(error);
  }
};

function isValidDate(dateString) {
  return !isNaN(new Date(dateString).getTime());
}