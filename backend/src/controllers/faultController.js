const db = require('../models');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const { sendEmail } = require('../utils/emailService');
const { Op, fn, col, literal, cast } = require('sequelize');
const { createFault: createEmailFault, closeFault: closeEmailFault } = require('../utils/emailFaultProcessor');

exports.getAllFaults = async (req, res, next) => {
  try {
    const faults = await db.Fault.findAll({
      include: [{
        model: db.Site,
        as: 'site',
        attributes: ['name']
      }],
      order: [['reportedTime', 'DESC']]
    });

    const formattedFaults = faults.map(fault => ({
      id: fault.id,
      description: fault.description,
      severity: fault.severity,
      location: fault.location,
      status: fault.status,
      reportedTime: fault.reportedTime,
      siteName: fault.site ? fault.site.name : null
    }));

    logger.info('Fetched all faults');
    res.json(formattedFaults);
  } catch (error) {
    logger.error('Error fetching all faults:', error);
    next(new AppError('Error fetching all faults', 500, 'FETCH_ALL_FAULTS_ERROR'));
  }
};

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
      include: [{ model: db.Site, as: 'site', where: { entrepreneurId: req.user.id } }],
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
        as: 'site',
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
      siteName: fault.site ? fault.site.name : null
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
        as: 'site',
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
      siteName: fault.site ? fault.site.name : null
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
        as: 'site',
        attributes: ['id', 'name']
      }],
      attributes: [
        'Fault.description',
        'Fault.severity',
        'Fault.location',
        [db.sequelize.fn('COUNT', db.sequelize.col('Fault.id')), 'occurrences']
      ],
      group: ['Fault.description', 'Fault.severity', 'Fault.location', 'site.id', 'site.name'],
      having: db.sequelize.literal('COUNT("Fault"."id") > 1'),
      order: [[db.sequelize.literal('occurrences'), 'DESC']]
    });

    const formattedFaults = faults.map(fault => ({
      description: fault.description,
      severity: fault.severity,
      location: fault.location,
      occurrences: parseInt(fault.get('occurrences')),
      siteId: fault.site.id,
      siteName: fault.site.name
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
      include: [{ model: db.Site, as: 'site', where: { entrepreneurId: req.user.id } }],
      order: [['reportedTime', 'DESC']]
    });
    res.json(faults);
  } catch (error) {
    logger.error('Error fetching all faults by site:', error);
    next(new AppError('Error fetching all faults', 500));
  }
};

exports.getOpenFaultsBySite = async (req, res, next) => {
  try {
    const { siteId } = req.params;
    const site = await db.Site.findOne({
      where: { id: siteId, entrepreneurId: req.user.id }
    });

    if (!site) {
      throw new AppError('Site not found or you do not have permission to access this site', 404);
    }

    const faults = await db.Fault.findAll({
      where: {
        status: 'פתוח',
        siteId: siteId
      },
      order: [['reportedTime', 'DESC']],
      limit: 10
    });

    const formattedFaults = faults.map(fault => ({
      id: fault.id,
      description: fault.description,
      severity: fault.severity,
      location: fault.location,
      status: fault.status,
      reportedTime: fault.reportedTime
    }));

    logger.info('Formatted open faults for site:', formattedFaults);
    res.json(formattedFaults);
  } catch (error) {
    logger.error('Error fetching open faults for site:', error);
    next(new AppError(error.message || 'Error fetching open faults for site', error.status || 500));
  }
};

exports.getRecentFaultsBySite = async (req, res, next) => {
  try {
    const { siteId } = req.params;
    const site = await db.Site.findOne({
      where: { id: siteId, entrepreneurId: req.user.id }
    });

    if (!site) {
      throw new AppError('Site not found or you do not have permission to access this site', 404);
    }

    const faults = await db.Fault.findAll({
      where: {
        status: 'פתוח',
        siteId: siteId
      },
      order: [['reportedTime', 'DESC']],
      limit: 10
    });

    const formattedFaults = faults.map(fault => ({
      id: fault.id,
      description: fault.description,
      severity: fault.severity,
      location: fault.location,
      status: fault.status,
      reportedTime: fault.reportedTime
    }));

    logger.info('Formatted recent faults for site:', formattedFaults);
    res.json(formattedFaults);
  } catch (error) {
    logger.error('Error fetching recent faults for site:', error);
    next(new AppError(error.message || 'Error fetching recent faults for site', error.status || 500));
  }
};

exports.getRecurringFaultsBySite = async (req, res, next) => {
  try {
    const { siteId } = req.params;
    const site = await db.Site.findOne({
      where: { id: siteId, entrepreneurId: req.user.id }
    });

    if (!site) {
      throw new AppError('Site not found or you do not have permission to access this site', 404);
    }

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const faults = await db.Fault.findAll({
      where: {
        siteId: siteId,
        reportedTime: { [Op.gte]: oneMonthAgo }
      },
      attributes: [
        'description',
        'severity',
        'location',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'occurrences']
      ],
      group: ['description', 'severity', 'location'],
      having: db.sequelize.literal('COUNT("id") > 1'),
      order: [[db.sequelize.literal('occurrences'), 'DESC']]
    });

    const formattedFaults = faults.map(fault => ({
      description: fault.description,
      severity: fault.severity,
      location: fault.location,
      occurrences: parseInt(fault.get('occurrences'))
    }));

    logger.info('Formatted recurring faults for site:', formattedFaults);
    res.json(formattedFaults);
  } catch (error) {
    logger.error('Error fetching recurring faults for site:', error);
    next(new AppError(error.message || 'Error fetching recurring faults for site', error.status || 500));
  }
};

const severityToNumber = (severity) => {
  switch(severity) {
    case 'Low': return 1;
    case 'Medium': return 2;
    case 'High': return 3;
    case 'Critical': return 4;
    default: return 0;
  }
};
exports.getStatisticsBySite = async (req, res, next) => {
  try {
    const { id: userId, role } = req.user;
    const { siteId } = req.params;

    let whereClause = {};
    if (role === 'entrepreneur') {
      whereClause.entrepreneurId = userId;
    } else if (role === 'admin') {
      // Admins can see all sites
    } else {
      throw new AppError('Unauthorized: Insufficient permissions', 403);
    }

    if (siteId) {
      whereClause.id = siteId;
    }

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const sites = await db.Site.findAll({
      where: whereClause,
      attributes: [
        'id',
        'name',
        [fn('COUNT', col('Faults.id')), 'faultCount'],
        [fn('AVG', literal('CASE WHEN "Faults"."closedTime" IS NOT NULL THEN EXTRACT(EPOCH FROM ("Faults"."closedTime" - "Faults"."reportedTime")) / 3600 ELSE NULL END')), 'averageRepairTime'],
        [fn('AVG', literal(`CASE 
          WHEN "Faults"."severity" = 'Low' THEN 1
          WHEN "Faults"."severity" = 'Medium' THEN 2
          WHEN "Faults"."severity" = 'High' THEN 3
          WHEN "Faults"."severity" = 'Critical' THEN 4
          WHEN "Faults"."severity" = 'רגילה' THEN 5
          ELSE 0
        END`)), 'averageSeverity'],
        [fn('COUNT', literal('CASE WHEN "Faults"."status" = \'פתוח\' THEN 1 ELSE NULL END')), 'openFaultCount'],
        [fn('AVG', literal('CASE WHEN "Faults"."acknowledgedTime" IS NOT NULL THEN EXTRACT(EPOCH FROM ("Faults"."acknowledgedTime" - "Faults"."reportedTime")) / 3600 ELSE NULL END')), 'averageResponseTime']
      ],
      include: [{
        model: db.Fault,
        as: 'Faults',
        attributes: [],
        required: false,
        where: {
          reportedTime: { [Op.gte]: oneMonthAgo }
        }
      }],
      group: ['Site.id', 'Site.name'],
      raw: true
    });

    const formattedStats = await Promise.all(sites.map(async site => {
      const recurringFaults = await db.Fault.count({
        where: {
          siteId: site.id,
          reportedTime: { [Op.gte]: oneMonthAgo }
        },
        group: ['description'],
        having: literal('COUNT(*) > 1')
      });

      return {
        id: site.id,
        name: site.name,
        faultCount: parseInt(site.faultCount) || 0,
        averageRepairTime: parseFloat(site.averageRepairTime) || 0,
        averageSeverity: parseFloat(site.averageSeverity) || 0,
        openFaultCount: parseInt(site.openFaultCount) || 0,
        recurringFaultCount: recurringFaults.length,
        averageResponseTime: parseFloat(site.averageResponseTime) || 0
      };
    }));

    res.json(formattedStats);
  } catch (error) {
    logger.error('Error fetching statistics by site:', error);
    next(new AppError(error.message || 'Error fetching statistics by site', error.status || 500));
  }
};

exports.getStatisticsByLocation = async (req, res, next) => {
  try {
    const { id: userId, role } = req.user;
    const { siteId } = req.params;

    let whereClause = {};
    if (role === 'entrepreneur') {
      whereClause['$site.entrepreneurId$'] = userId;
    } else if (role === 'admin') {
      // Admins can see all locations
    } else {
      throw new AppError('Unauthorized: Insufficient permissions', 403);
    }

    if (siteId) {
      whereClause.siteId = siteId;
    }

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    whereClause.reportedTime = { [Op.gte]: oneMonthAgo };

    const locationStats = await db.Fault.findAll({
      attributes: [
        'location',
        [fn('COUNT', col('Fault.id')), 'faultCount'],
        [fn('AVG', literal('CASE WHEN "Fault"."closedTime" IS NOT NULL THEN EXTRACT(EPOCH FROM ("Fault"."closedTime" - "Fault"."reportedTime")) / 3600 ELSE NULL END')), 'averageRepairTime'],
        [fn('AVG', literal(`CASE 
          WHEN "Fault"."severity" = 'Low' THEN 1
          WHEN "Fault"."severity" = 'Medium' THEN 2
          WHEN "Fault"."severity" = 'High' THEN 3
          WHEN "Fault"."severity" = 'Critical' THEN 4
          WHEN "Fault"."severity" = 'רגילה' THEN 5
          ELSE 0
        END`)), 'averageSeverity'],
        [fn('COUNT', literal('CASE WHEN "Fault"."status" = \'פתוח\' THEN 1 ELSE NULL END')), 'openFaultCount'],
        [fn('AVG', literal('CASE WHEN "Fault"."acknowledgedTime" IS NOT NULL THEN EXTRACT(EPOCH FROM ("Fault"."acknowledgedTime" - "Fault"."reportedTime")) / 3600 ELSE NULL END')), 'averageResponseTime']
      ],
      include: [{
        model: db.Site,
        as: 'site',
        attributes: [],
        required: true
      }],
      where: whereClause,
      group: ['Fault.location'],
      raw: true
    });

    const formattedStats = await Promise.all(locationStats.map(async stat => {
      const recurringFaults = await db.Fault.count({
        where: {
          location: stat.location,
          reportedTime: { [Op.gte]: oneMonthAgo },
          ...whereClause
        },
        group: ['description'],
        having: literal('COUNT(*) > 1')
      });

      return {
        name: stat.location,
        faultCount: parseInt(stat.faultCount) || 0,
        averageRepairTime: parseFloat(stat.averageRepairTime) || 0,
        averageSeverity: parseFloat(stat.averageSeverity) || 0,
        openFaultCount: parseInt(stat.openFaultCount) || 0,
        recurringFaultCount: recurringFaults.length,
        averageResponseTime: parseFloat(stat.averageResponseTime) || 0
      };
    }));

    res.json(formattedStats);
  } catch (error) {
    logger.error('Error fetching statistics by location:', error);
    next(new AppError(error.message || 'Error fetching statistics by location', error.status || 500));
  }
};

module.exports = exports;