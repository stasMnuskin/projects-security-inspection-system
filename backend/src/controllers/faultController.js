const db = require('../models');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const { sendEmail } = require('../utils/emailService');
const { Op } = require('sequelize');
const { createFault: createEmailFault, closeFault: closeEmailFault } = require('../utils/emailFaultProcessor');

exports.createFault = async (req, res, next) => {
  try {
    logger.info('Creating fault with data:', req.body);
    if (!req.body.description || !req.body.location) {
      throw new AppError('Description and location are required', 400);
    }
    const fault = await db.Fault.create(req.body);
    logger.info('Fault created successfully:', fault);
    res.status(201).json(fault);
  } catch (error) {
    logger.error('Error creating fault:', error);
    next(new AppError(error.message || 'Error creating fault', error.status || 500));
  }
};

exports.createEmailFault = async (req, res, next) => {
  try {
    logger.info('Creating fault from email with data:', req.body);
    const fault = await createEmailFault(req.body);
    logger.info('Fault created successfully from email:', fault);
    res.status(201).json(fault);
  } catch (error) {
    logger.error('Error creating fault from email:', error);
    next(new AppError(error.message || 'Error creating fault from email', error.status || 500));
  }
};

exports.closeEmailFault = async (req, res, next) => {
  try {
    logger.info('Closing fault from email with data:', req.body);
    const fault = await closeEmailFault(req.body);
    logger.info('Fault closed successfully from email:', fault);
    res.status(200).json(fault);
  } catch (error) {
    logger.error('Error closing fault from email:', error);
    next(new AppError(error.message || 'Error closing fault from email', error.status || 500));
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

exports.getOpenFaultsByEntrepreneur = async (req, res, next) => {
  try {
    const sites = await db.Site.findAll({
      where: { entrepreneurId: req.user.id },
      attributes: ['id']
    });
    
    const siteIds = sites.map(site => site.id);

    const faults = await db.Fault.findAll({
      where: {
        status: 'פתוח',
        siteId: { [Op.in]: siteIds }
      },
      include: [{
        model: db.Site,
        attributes: ['name']
      }],
      order: [['reportedTime', 'DESC']],
      limit: 10
    });

    const formattedFaults = faults.map(fault => ({
      id: fault.id,
      description: fault.description,
      severity: fault.severity,
      location: fault.location,
      status: fault.status,
      reportedTime: fault.reportedTime,
      siteName: fault.Site ? fault.Site.name : null
    }));

    logger.info('Formatted open faults:', formattedFaults);
    res.json(formattedFaults);
  } catch (error) {
    logger.error('Error fetching open faults:', error);
    next(new AppError('Error fetching open faults', 500, 'FETCH_FAULTS_ERROR'));
  }
};

exports.getRecentFaultsByEntrepreneur = async (req, res, next) => {
  try {
    const sites = await db.Site.findAll({
      where: { entrepreneurId: req.user.id },
      attributes: ['id']
    });
    
    const siteIds = sites.map(site => site.id);

    const faults = await db.Fault.findAll({
      where: {
        siteId: { [Op.in]: siteIds }
      },
      include: [{
        model: db.Site,
        attributes: ['name']
      }],
      order: [['reportedTime', 'DESC']],
      limit: 10
    });

    const formattedFaults = faults.map(fault => ({
      id: fault.id,
      description: fault.description,
      severity: fault.severity,
      location: fault.location,
      status: fault.status,
      reportedTime: fault.reportedTime,
      siteName: fault.Site ? fault.Site.name : null
    }));

    logger.info('Formatted recent faults:', formattedFaults);
    res.json(formattedFaults);
  } catch (error) {
    logger.error('Error fetching recent faults:', error);
    next(new AppError('Error fetching recent faults', 500, 'FETCH_RECENT_FAULTS_ERROR'));
  }
};

exports.getRecurringFaultsByEntrepreneur = async (req, res, next) => {
  try {
    const sites = await db.Site.findAll({
      where: { entrepreneurId: req.user.id },
      attributes: ['id']
    });
    
    const siteIds = sites.map(site => site.id);

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const faults = await db.Fault.findAll({
      where: {
        siteId: { [Op.in]: siteIds },
        reportedTime: { [Op.gte]: oneMonthAgo }
      },
      include: [{
        model: db.Site,
        attributes: ['id', 'name']
      }],
      attributes: [
        'Fault.description',
        'Fault.severity',
        'Fault.location',
        [db.sequelize.fn('COUNT', db.sequelize.col('Fault.id')), 'occurrences']
      ],
      group: ['Fault.description', 'Fault.severity', 'Fault.location', 'Site.id', 'Site.name'],
      having: db.sequelize.literal('COUNT("Fault"."id") > 1'),
      order: [[db.sequelize.literal('occurrences'), 'DESC']]
    });

    const formattedFaults = faults.map(fault => ({
      description: fault.description,
      severity: fault.severity,
      location: fault.location,
      occurrences: parseInt(fault.get('occurrences')),
      siteId: fault.Site.id,
      siteName: fault.Site.name
    }));

    logger.info('Formatted recurring faults:', formattedFaults);
    res.json(formattedFaults);
  } catch (error) {
    logger.error('Error fetching recurring faults:', error);
    next(new AppError('Error fetching recurring faults', 500, 'FETCH_RECURRING_FAULTS_ERROR'));
  }
};

exports.getAllFaultsBySite = async (req, res, next) => {
  try {
    const { siteId } = req.params;
    const faults = await db.Fault.findAll({
      where: { siteId },
      include: [{ model: db.Site, where: { entrepreneurId: req.user.id } }],
      order: [['reportedTime', 'DESC']]
    });
    res.json(faults);
  } catch (error) {
    logger.error('Error fetching all faults by site:', error);
    next(new AppError('Error fetching all faults', 500));
  }
};