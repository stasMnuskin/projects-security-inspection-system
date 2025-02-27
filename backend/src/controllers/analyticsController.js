const { Op } = require('sequelize');
const db = require('../models');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

const { PERMISSIONS } = require('../constants/roles');

exports.getDashboardOverview = async (req, res, next) => {
  try {
    if (!req.user.hasPermission(PERMISSIONS.DASHBOARD)) {
      return next(new AppError('אין לך הרשאה לצפות בדשבורד', 403));
    }

    const { role, id: userId } = req.user;
    const { startDate, endDate, sites: selectedSites, maintenance, securityOfficer, integrator } = req.query;

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

    // Build site query with organization filtering
    let siteQuery = {};
    if (role === 'entrepreneur') {
      siteQuery.entrepreneurId = userId;
    }
    if (selectedSites) {
      const siteIds = Array.isArray(selectedSites) ? selectedSites : [selectedSites];
      siteQuery.id = { [Op.in]: siteIds };
    }

    const siteInclude = [];
    if (maintenance || integrator) {
      siteInclude.push({
        model: db.Organization,
        as: 'serviceOrganizations',
        where: {
          [Op.or]: [
            maintenance ? { id: maintenance, type: 'maintenance' } : null,
            integrator ? { id: integrator, type: 'integrator' } : null
          ].filter(Boolean)
        },
        required: true
      });
    }

    const sites = await db.Site.findAll({
      where: siteQuery,
      include: siteInclude,
      attributes: ['id']
    });
    const siteIds = sites.map(site => site.id);

    let userFilters = {};
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

    const drills = await db.Inspection.findAll({
      where: {
        siteId: { [Op.in]: siteIds },
        type: 'drill',
        formData: {
          date: dateRange
        }
      }
    });

    const drillStatusCounts = drills.reduce((acc, drill) => {
      const status = drill.getDrillStatus();
      if (status) {
        acc[status] = (acc[status] || 0) + 1;
      }
      return acc;
    }, { 'הצלחה': 0, 'הצלחה חלקית': 0, 'כישלון': 0 });

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
          ...userFilters,
          status: { [Op.in]: ['פתוח', 'בטיפול', 'סגור'] } 
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
        order: [[db.sequelize.literal('count'), 'DESC']]
      })
    ]);

    // Get detailed inspection and drill data
    const [inspectionDetails, drillDetails] = await Promise.all([
      db.Inspection.findAll({
        where: {
          siteId: { [Op.in]: siteIds },
          type: 'inspection',
          formData: {
            date: dateRange
          }
        },
        include: [{
          model: db.Site,
          attributes: ['id', 'name']
        }],
        order: [['createdAt', 'DESC']]
      }),
      db.Inspection.findAll({
        where: {
          siteId: { [Op.in]: siteIds },
          type: 'drill',
          formData: {
            date: dateRange
          }
        },
        include: [{
          model: db.Site,
          attributes: ['id', 'name']
        }],
        order: [['createdAt', 'DESC']]
      })
    ]);

    const formattedResponse = {
      overview: {
        inspections: inspectionsCount,
        drills: drillsCount,
        drillResults: drillStatusCounts,
        inspectionDetails: inspectionDetails.map((inspection, index) => ({
          serialNumber: index + 1,
          site: inspection.Site.name,
          date: inspection.formData.date,
          notes: inspection.formData.notes || ''
        })),
        drillDetails: drillDetails.map((drill, index) => ({
          serialNumber: index + 1,
          site: drill.Site.name,
          date: drill.formData.date,
          notes: drill.formData.notes || '',
          status: drill.getDrillStatus()
        }))
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
          isCritical: fault.isCritical,
          reportedTime: fault.reportedTime
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
          fault: fault.type === 'אחר' ? fault.description : fault.type,
          reportedTime: fault.reportedTime
        })),
        recurring: await Promise.all(
          recurringFaults
            .reduce((acc, fault) => {
              const key = fault.type === 'אחר' ? 
                `${fault.type}-${fault.description}` : 
                fault.type;
              
              const existing = acc.find(item => 
                fault.type === 'אחר' ? 
                  (item.type === fault.type && item.description === fault.description) : 
                  item.type === fault.type
              );
              
              if (existing) {
                existing.count += parseInt(fault.get('count'));
              } else {
                acc.push({
                  type: fault.type,
                  description: fault.description,
                  fault: fault.type === 'אחר' ? fault.description : fault.type,
                  count: parseInt(fault.get('count'))
                });
              }
              
              return acc;
            }, [])
            .sort((a, b) => b.count - a.count)
            .filter(fault => fault.count > 1)
            .map(async (fault) => {
              // Get all faults of this type with site and date information
              const faultDetails = await db.Fault.findAll({
                where: {
                  type: fault.type,
                  ...(fault.type === 'אחר' && { description: fault.description }),
                  siteId: { [Op.in]: siteIds },
                  reportedTime: dateRange,
                  ...userFilters,
                  status: { [Op.in]: ['פתוח', 'בטיפול', 'סגור'] }
                },
                include: [{
                  model: db.Site,
                  as: 'site',
                  attributes: ['id', 'name']
                }],
                order: [['reportedTime', 'DESC']]
              });

              return {
                ...fault,
                details: faultDetails.map((detail, idx) => ({
                  serialNumber: idx + 1,
                  site: detail.site.name,
                  reportedTime: detail.reportedTime
                }))
              };
            })
        )
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
    if (!req.user.hasPermission(PERMISSIONS.DASHBOARD)) {
      return next(new AppError('אין לך הרשאה לצפות בדשבורד', 403));
    }

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

    const [securityOfficers, maintenanceOrgs, integratorOrgs] = await Promise.all([
      db.User.findAll({
        where: { role: 'security_officer', status: 'active' },
        attributes: ['id', 'firstName', 'lastName']
      }),
      db.Organization.findAll({
        where: { type: 'maintenance' },
        attributes: ['id', 'name']
      }),
      db.Organization.findAll({
        where: { type: 'integrator' },
        attributes: ['id', 'name']
      })
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
      maintenance: maintenanceOrgs,
      integrators: integratorOrgs
    });
  } catch (error) {
    logger.error('Error in getFilterOptions:', error);
    next(new AppError('שגיאה בשליפת אפשרויות סינון', 500));
  }
};
