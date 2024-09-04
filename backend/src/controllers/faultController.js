const db = require('../models');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const { sendEmail } = require('../utils/emailService');
const { Op } = require('sequelize');

exports.createFault = async (req, res, next) => {
  try {
    const fault = await db.Fault.create(req.body);
    
    await sendFaultNotification(fault);
    
    res.status(201).json(fault);
  } catch (error) {
    logger.error('Error creating fault:', error);
    next(new AppError('Error creating fault', 500));
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
    
    if (process.env.NODE_ENV !== 'test') {
      await sendEmail('control@example.com', 'Fault Closed', `Fault ID: ${fault.id} has been closed.`);
    }
    
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

exports.getFaultsBySite = async (req, res, next) => {
  try {
    const { siteId } = req.params;
    const faults = await db.Fault.findAll({
      where: { siteId },
      include: [{ model: db.Site, where: { entrepreneurId: req.user.id } }],
    });
    res.json(faults);
  } catch (error) {
    logger.error('Error fetching faults by site:', error);
    next(new AppError('Error fetching faults', 500));
  }
};

exports.updateFault = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [updated] = await db.Fault.update(req.body, {
      where: { id: id }
    });
    if (updated) {
      const updatedFault = await db.Fault.findByPk(id);
      return res.json(updatedFault);
    }
    throw new AppError('Fault not found', 404);
  } catch (error) {
    logger.error('Error updating fault:', error);
    next(new AppError('Error updating fault', 500));
  }
};

exports.deleteFault = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await faultService.deleteFault(id, req.user.id);
    if (!result) {
      return next(new AppError('Fault not found', 404));
    }
    res.json({ message: 'Fault deleted successfully' });
  } catch (error) {
    logger.error('Error deleting fault:', error);
    next(new AppError('Error deleting fault', 500));
  }
};

exports.getOpenFaultsByEntrepreneur = async (req, res, next) => {
  try {
    logger.info(`Fetching open faults for entrepreneur ID: ${req.user.id}`);
    
    const sites = await db.Site.findAll({
      where: { entrepreneurId: req.user.id },
      attributes: ['id']
    });
    
    const siteIds = sites.map(site => site.id);
    
    logger.info(`Found ${siteIds.length} sites for entrepreneur ID: ${req.user.id}`);

    const faults = await db.Fault.findAll({
      attributes: ['id', 'description', 'severity', 'location', 'status', 'reportedTime', 'siteName'],
      where: {
        status: 'open',
        siteId: {
          [Op.in]: siteIds
        }
      },
      include: [{
        model: db.Site,
        attributes: ['name']
      }],
      order: [['reportedTime', 'DESC']]
    });

    logger.info(`Found ${faults.length} open faults for entrepreneur ID: ${req.user.id}`);
    
    res.json(faults);
  } catch (error) {
    logger.error('Error fetching open faults:', error);
    next(new AppError('Error fetching open faults', 500, 'FETCH_FAULTS_ERROR'));
  }
};

exports.getRecentFaultsByEntrepreneur = async (req, res, next) => {
  try {
    logger.info(`Fetching recent faults for entrepreneur ID: ${req.user.id}`);
    
    const sites = await db.Site.findAll({
      where: { entrepreneurId: req.user.id },
      attributes: ['id']
    });
    
    const siteIds = sites.map(site => site.id);
    
    logger.info(`Found ${siteIds.length} sites for entrepreneur ID: ${req.user.id}`);

    const faults = await db.Fault.findAll({
      attributes: ['id', 'description', 'severity', 'location', 'status', 'reportedTime', 'siteName'],
      where: {
        siteId: {
          [Op.in]: siteIds
        }
      },
      include: [{
        model: db.Site,
        attributes: ['name']
      }],
      order: [['reportedTime', 'DESC']],
      limit: 10
    });

    logger.info(`Found ${faults.length} recent faults for entrepreneur ID: ${req.user.id}`);
    
    res.json(faults);
  } catch (error) {
    logger.error('Error fetching recent faults:', error);
    next(new AppError('Error fetching recent faults', 500, 'FETCH_RECENT_FAULTS_ERROR'));
  }
};

function isValidDate(dateString) {
  return !isNaN(new Date(dateString).getTime());
}