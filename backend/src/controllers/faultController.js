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
      location: fault.location,
      status: fault.status,
      reportedTime: fault.reportedTime,
      siteName: fault.site ? fault.site.name : null,
      disabling: fault.disabling
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
      location: fault.location,
      status: fault.status,
      reportedTime: fault.reportedTime,
      siteName: fault.site ? fault.site.name : null,
      disabling: fault.disabling
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
      location: fault.location,
      status: fault.status,
      reportedTime: fault.reportedTime,
      siteName: fault.site ? fault.site.name : null,
      disabling: fault.disabling
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
    logger.info('getRecurringFaultsByEntrepreneur function called');
    
    const sites = await db.Site.findAll({
      where: { entrepreneurId: req.user.id },
      attributes: ['id']
    });
    
    const siteIds = sites.map(site => site.id);
    logger.info('Site IDs:', siteIds);

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    logger.info('Fetching recurring faults for sites:', siteIds);
    logger.info('Date range:', oneMonthAgo, 'to', new Date());

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
        'Fault.location',
        'Fault.disabling',
        [db.sequelize.fn('COUNT', db.sequelize.col('Fault.id')), 'occurrences']
      ],
      group: ['Fault.description', 'Fault.location', 'Fault.disabling', 'site.id', 'site.name'],
      having: db.sequelize.literal('COUNT("Fault"."id") > 1'),
      order: [[db.sequelize.literal('occurrences'), 'DESC']]
    });

    logger.info('Number of recurring faults found:', faults.length);
    logger.info('Raw faults data:', JSON.stringify(faults.map(f => f.toJSON()), null, 2));

    const formattedFaults = faults.map(fault => ({
      description: fault.description,
      location: fault.location,
      disabling: fault.disabling,
      occurrences: parseInt(fault.get('occurrences')),
      siteId: fault.site.id,
      siteName: fault.site.name
    }));

    logger.info('Number of formatted recurring faults:', formattedFaults.length);
    logger.info('Formatted recurring faults:', JSON.stringify(formattedFaults, null, 2));

    res.json(formattedFaults);
  } catch (error) {
    logger.error('Error in getRecurringFaultsByEntrepreneur:', error);
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
    const { role } = req.user;

    // Check if the site exists
    const site = await db.Site.findByPk(siteId);
    if (!site) {
      throw new AppError('Site not found', 404);
    }

    // Allow access for entrepreneur, security_officer, and admin roles
    if (!['entrepreneur', 'security_officer', 'admin'].includes(role)) {
      throw new AppError('Unauthorized access', 403);
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
      location: fault.location,
      status: fault.status,
      reportedTime: fault.reportedTime,
      disabling: fault.disabling
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
        siteId: siteId
      },
      order: [['reportedTime', 'DESC']],
      limit: 10
    });

    const formattedFaults = faults.map(fault => ({
      id: fault.id,
      description: fault.description,
      location: fault.location,
      status: fault.status,
      reportedTime: fault.reportedTime,
      disabling: fault.disabling
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
        'location',
        'disabling',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'occurrences']
      ],
      group: ['description', 'location', 'disabling'],
      having: db.sequelize.literal('COUNT("id") > 1'),
      order: [[db.sequelize.literal('occurrences'), 'DESC']]
    });

    const formattedFaults = faults.map(fault => ({
      description: fault.description,
      location: fault.location,
      disabling: fault.disabling,
      occurrences: parseInt(fault.get('occurrences'))
    }));

    logger.info('Formatted recurring faults for site:', formattedFaults);
    res.json(formattedFaults);
  } catch (error) {
    logger.error('Error fetching recurring faults for site:', error);
    next(new AppError(error.message || 'Error fetching recurring faults for site', error.status || 500));
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
      group: ['Fault.location', 'site.id'],
      raw: true
    });

    const formattedStats = await Promise.all(locationStats.map(async stat => {
      const recurringFaults = await db.Fault.count({
        where: {
          location: stat.location,
          reportedTime: { [Op.gte]: oneMonthAgo },
          ...whereClause
        },
        include: [{
          model: db.Site,
          as: 'site',
          attributes: [],
          required: true
        }],
        group: ['description'],
        having: literal('COUNT(*) > 1')
      });

      return {
        name: stat.location,
        faultCount: parseInt(stat.faultCount) || 0,
        averageRepairTime: parseFloat(stat.averageRepairTime) || 0,
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