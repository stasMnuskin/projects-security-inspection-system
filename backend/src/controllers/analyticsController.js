const { Op } = require('sequelize');
const db = require('../models');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

exports.getDashboardOverview = async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;
    const { startDate, endDate, site, maintenance, securityOfficer, integrator } = req.query;

    let dateRange = {};
    if (startDate && endDate) {
      dateRange = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      dateRange = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      dateRange = {
        [Op.lte]: new Date(endDate)
      };
    } else {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      dateRange = {
        [Op.between]: [sixMonthsAgo, new Date()]
      };
    }

    let siteQuery = {};
    if (role === 'entrepreneur') {
      siteQuery.entrepreneurId = userId;
    }
    if (site) {
      siteQuery.id = site;
    }

    const sites = await db.Site.findAll({
      where: siteQuery,
      attributes: ['id']
    });
    const siteIds = sites.map(site => site.id);

    let userFilters = {};
    if (maintenance) {
      userFilters.maintenanceUserId = maintenance;
    }
    if (integrator) {
      userFilters.integratorUserId = integrator;
    }
    if (securityOfficer) {
      userFilters.securityOfficerId = securityOfficer;
    }

    const inspectionsCount = await db.Inspection.count({
      where: {
        siteId: { [Op.in]: siteIds },
        type: 'inspection',
        formData: {
          date: dateRange
        }
      }
    });

    const drillsCount = await db.Inspection.count({
      where: {
        siteId: { [Op.in]: siteIds },
        type: 'drill',
        formData: {
          date: dateRange
        }
      }
    });

    const [openFaults, criticalFaults, recurringFaults] = await Promise.all([
      db.Fault.findAll({
        where: {
          siteId: { [Op.in]: siteIds },
          reportedTime: dateRange,
          ...userFilters,
          status: 'פתוח'
        },
        include: [{
          model: db.Site,
          as: 'site',
          attributes: ['id', 'name']
        }],
        order: [['reportedTime', 'DESC']]
      }),

      db.Fault.findAll({
        where: {
          siteId: { [Op.in]: siteIds },
          reportedTime: dateRange,
          ...userFilters,
          status: 'פתוח',
          isCritical: true
        },
        include: [{
          model: db.Site,
          as: 'site',
          attributes: ['id', 'name']
        }],
        order: [['reportedTime', 'DESC']]
      }),

      db.Fault.findAll({
        where: {
          siteId: { [Op.in]: siteIds },
          reportedTime: dateRange,
          ...userFilters
        },
        attributes: [
          [db.sequelize.col('Fault.type'), 'type'],
          [db.sequelize.col('Fault.description'), 'description'],
          [db.sequelize.col('Fault.siteId'), 'siteId'],
          [db.sequelize.fn('COUNT', '*'), 'count']
        ],
        include: [{
          model: db.Site,
          as: 'site',
          attributes: ['id', 'name']
        }],
        group: ['Fault.type', 'Fault.description', 'Fault.siteId', 'site.id', 'site.name'],
        having: db.sequelize.literal('COUNT(*) > 1'),
        order: [[db.sequelize.literal('count'), 'DESC']]
      })
    ]);

    const formattedResponse = {
      overview: {
        inspections: inspectionsCount,
        drills: drillsCount
      },
      faults: {
        open: openFaults.map((fault, index) => ({
          id: fault.id,
          serialNumber: index + 1,
          site: { 
            id: fault.site.id,
            name: fault.site.name 
          },
          type: fault.type,
          description: fault.description,
          fault: fault.type === 'אחר' ? fault.description : fault.type,
          isCritical: fault.isCritical
        })),
        critical: criticalFaults.map((fault, index) => ({
          id: fault.id,
          serialNumber: index + 1,
          site: { 
            id: fault.site.id,
            name: fault.site.name 
          },
          type: fault.type,
          description: fault.description,
          fault: fault.type === 'אחר' ? fault.description : fault.type
        })),
        recurring: recurringFaults.map((fault, index) => ({
          serialNumber: index + 1,
          count: parseInt(fault.get('count')),
          type: fault.type,
          description: fault.description,
          fault: fault.type === 'אחר' ? fault.description : fault.type,
          site: {
            id: fault.site.id,
            name: fault.site.name
          }
        }))
      }
    };

    res.json(formattedResponse);
  } catch (error) {
    logger.error('Error in getDashboardOverview:', error);
    next(new AppError('שגיאה בשליפת נתוני דשבורד', 500));
  }
};

exports.getFilterOptions = async (req, res, next) => {
  try {
    const { id: userId, role } = req.user;

    let sites;
    if (role === 'entrepreneur') {
      sites = await db.Site.findAll({
        where: { entrepreneurId: userId },
        attributes: ['id', 'name']
      });
    } else {
      sites = await db.Site.findAll({
        attributes: ['id', 'name']
      });
    }

    const getUsersByRole = async (role) => {
      return await db.User.findAll({
        where: { role, status: 'active' },
        attributes: ['id', 'firstName', 'lastName']
      });
    };

    const [securityOfficers, maintenance, integrators] = await Promise.all([
      getUsersByRole('security_officer'),
      getUsersByRole('maintenance'),
      getUsersByRole('integrator')
    ]);

    res.json({
      sites: sites.map(site => ({
        id: site.id,
        name: site.name
      })),
      securityOfficers: securityOfficers.map(user => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`
      })),
      maintenance: maintenance.map(user => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`
      })),
      integrators: integrators.map(user => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`
      }))
    });
  } catch (error) {
    logger.error('Error in getFilterOptions:', error);
    next(new AppError('שגיאה בשליפת אפשרויות סינון', 500));
  }
};
