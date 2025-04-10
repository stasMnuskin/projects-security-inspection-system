const db = require('../models');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const { PERMISSIONS } = require('../constants/roles');

// Get fault types from the model's ENUM definition
exports.getFaultTypes = async (req, res, next) => {
  try {
    const faultTypes = db.Fault.rawAttributes.type.values;
    res.json(faultTypes);
  } catch (error) {
    logger.error('Error fetching fault types:', error);
    next(new AppError('שגיאה בשליפת סוגי תקלות', 500));
  }
};

const getSitesByUserRole = async (user) => {
  const { role, id: userId, organizationId } = user;
  
  if (role === 'admin' || role === 'security_officer') {
    return await db.Site.findAll({ attributes: ['id'] });
  }
  
  if (role === 'integrator' || role === 'maintenance' || role === 'control_center') {
    return await db.Site.findAll({
      attributes: ['id'],
      include: [{
        model: db.Organization,
        as: 'serviceOrganizations',
        where: { id: organizationId },
        attributes: []
      }]
    });
  }
  
  return await db.Site.findAll({
    attributes: ['id'],
    where: { entrepreneurId: userId }
  });
};

exports.getOpenFaults = async (req, res, next) => {
  try {
    if (!req.user.hasPermission(PERMISSIONS.VIEW_FAULTS)) {
      return next(new AppError('אין לך הרשאה לצפות בתקלות', 403));
    }

    const siteIds = (await getSitesByUserRole(req.user)).map(site => site.id);

    const faults = await db.Fault.findAll({
      where: {
        status: 'פתוח',
        siteId: { [db.Sequelize.Op.in]: siteIds }
      },
      include: [{
        model: db.Site,
        as: 'site',
        attributes: ['name', 'id']
      }],
      order: [['reportedTime', 'DESC']]
    });

    const formattedFaults = faults.map((fault, index) => ({
      id: fault.id,
      site: {
        id: fault.site.id,
        name: fault.site.name
      },
      type: fault.type,
      description: fault.description,
      fault: fault.type === 'אחר' ? fault.description : fault.type,
      serialNumber: index + 1,
      isCritical: fault.isCritical,
      isPartiallyDisabling: fault.isPartiallyDisabling || false
    }));

    res.json(formattedFaults);
  } catch (error) {
    logger.error('Error fetching open faults:', error);
    next(new AppError('שגיאה בשליפת תקלות פתוחות', 500));
  }
};

exports.getRecurringFaults = async (req, res, next) => {
  try {
    if (!req.user.hasPermission(PERMISSIONS.VIEW_FAULTS)) {
      return next(new AppError('אין לך הרשאה לצפות בתקלות', 403));
    }

    const siteIds = (await getSitesByUserRole(req.user)).map(site => site.id);

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const recurringFaults = await db.Fault.findAll({
      where: {
        siteId: { [db.Sequelize.Op.in]: siteIds },
        reportedTime: { [db.Sequelize.Op.gte]: oneMonthAgo },
        status: { [db.Sequelize.Op.in]: ['פתוח', 'סגור', 'בטיפול'] }
      },
      attributes: [
        'type',
        'description',
        [db.sequelize.fn('COUNT', db.sequelize.col('siteId')), 'count']
      ],
      group: ['type', 'description', 'siteId'],
      having: db.sequelize.where(db.sequelize.fn('COUNT', db.sequelize.col('id')), '>', 1),
      order: [[db.sequelize.fn('COUNT', db.sequelize.col('id')), 'DESC']]
    });

    const formattedFaults = recurringFaults.map((fault, index) => ({
      type: fault.type,
      description: fault.description,
      site: null,
      count: parseInt(fault.get('count')),
      serialNumber: index + 1
    }));

    res.json(formattedFaults);
  } catch (error) {
    logger.error('Error fetching recurring faults:', error);
    next(new AppError('שגיאה בשליפת תקלות חוזרות', 500));
  }
};

exports.getCriticalFaults = async (req, res, next) => {
  try {
    if (!req.user.hasPermission(PERMISSIONS.VIEW_FAULTS)) {
      return next(new AppError('אין לך הרשאה לצפות בתקלות', 403));
    }

    const siteIds = (await getSitesByUserRole(req.user)).map(site => site.id);

    const faults = await db.Fault.findAll({
      where: {
        [db.Sequelize.Op.or]: [
          { isCritical: true },
          { isPartiallyDisabling: true }
        ],
        status: 'פתוח',
        siteId: { [db.Sequelize.Op.in]: siteIds }
      },
      include: [{
        model: db.Site,
        as: 'site',
        attributes: ['name', 'id']
      }],
      order: [['reportedTime', 'DESC']]
    });

    const formattedFaults = faults.map((fault, index) => ({
      id: fault.id,
      site: {
        id: fault.site.id,
        name: fault.site.name
      },
      type: fault.type,
      description: fault.description,
      fault: fault.type === 'אחר' ? fault.description : fault.type,
      serialNumber: index + 1,
      isCritical: fault.isCritical,
      isPartiallyDisabling: fault.isPartiallyDisabling || false
    }));

    res.json(formattedFaults);
  } catch (error) {
    logger.error('Error fetching critical faults:', error);
    next(new AppError('שגיאה בשליפת תקלות משביתות', 500));
  }
};

exports.getAllFaults = async (req, res, next) => {
  try {
    if (!req.user.hasPermission(PERMISSIONS.VIEW_FAULTS)) {
      return next(new AppError('אין לך הרשאה לצפות בתקלות', 403));
    }

    const { role, id: userId, organizationId } = req.user;
    const { id, startDate, endDate, sites, isCritical, maintenanceOrg, integratorOrg, entrepreneur, type, description, status } = req.query;

    logger.info('getAllFaults called with params:', {
      role,
      userId,
      organizationId,
      query: req.query
    });

    // Build base where clause
    let whereClause = {};

    // Handle date range
    if (startDate || endDate) {
      whereClause.reportedTime = {};
      if (startDate) {
        whereClause.reportedTime[db.Sequelize.Op.gte] = new Date(startDate);
      }
      if (endDate) {
        whereClause.reportedTime[db.Sequelize.Op.lte] = new Date(endDate);
      }
    }

    // Handle criticality
    if (isCritical !== undefined) {
      if (isCritical === 'true') {
        // For backward compatibility, true returns fully disabling only
        whereClause.isCritical = true;
      } else {
        // For backward compatibility, false returns non disabling and partially disabling
        whereClause.isCritical = false;
      }
    }
    
    // Handle severity if specified directly
    const { severity } = req.query;
    if (severity !== undefined) {
      if (severity === 'fully_disabling') {
        whereClause.isCritical = true;
        whereClause.isPartiallyDisabling = false;
      } else if (severity === 'partially_disabling') {
        whereClause.isCritical = false;
        whereClause.isPartiallyDisabling = true;
      } else if (severity === 'non_disabling') {
        whereClause.isCritical = false;
        whereClause.isPartiallyDisabling = { 
          [db.Sequelize.Op.or]: [false, null] 
        };
      }
    }

    // Handle status
    if (status) {
      whereClause.status = status;
    }

    // Handle type and description
    if (type === 'אחר' && description) {
      whereClause.type = 'אחר';
      whereClause.description = description;
    } else if (type) {
      whereClause.type = type;
    }

    // Get sites based on user role and entrepreneur filter
    let userSites;
    if (role === 'admin' && entrepreneur) {
      userSites = await db.Site.findAll({
        where: { entrepreneurId: entrepreneur },
        attributes: ['id']
      });
    } else {
      userSites = await getSitesByUserRole(req.user);
    }
    const allowedSiteIds = userSites.map(site => site.id);
    
    // Handle site filters
    let finalSiteIds;
    if (sites) {
      const requestedSiteIds = sites.split(',').map(id => parseInt(id, 10));
      finalSiteIds = requestedSiteIds.filter(id => allowedSiteIds.includes(id));
    } else {
      finalSiteIds = allowedSiteIds;
    }

    // Get filtered sites first
    const siteQuery = {
      where: { id: { [db.Sequelize.Op.in]: finalSiteIds } },
      include: [{
        model: db.Organization,
        as: 'serviceOrganizations',
        attributes: ['id', 'name', 'type']
      }]
    };

    // Add organization filters to site query
    if (maintenanceOrg || integratorOrg) {
      siteQuery.include[0].where = {
        [db.Sequelize.Op.or]: [
          maintenanceOrg ? { id: maintenanceOrg, type: 'maintenance' } : null,
          integratorOrg ? { id: integratorOrg, type: 'integrator' } : null
        ].filter(Boolean)
      };
      siteQuery.include[0].required = true;
    }

    // Get filtered sites
    const filteredSites = await db.Site.findAll(siteQuery);
    const filteredSiteIds = filteredSites.map(site => site.id);

    // Update where clause with filtered site IDs
    whereClause.siteId = {
      [db.Sequelize.Op.in]: filteredSiteIds
    };

    // Query faults with filtered sites
    const query = {
      where: whereClause,
      include: [
        {
          model: db.Site,
          as: 'site',
          attributes: ['id', 'name']
        },
        {
          model: db.Organization,
          as: 'maintenanceOrganization',
          attributes: ['id', 'name', 'type']
        },
        {
          model: db.Organization,
          as: 'integratorOrganization',
          attributes: ['id', 'name', 'type']
        }
      ],
      order: [['reportedTime', 'DESC']]
    };

    logger.info('Final query:', query);

    const faults = await db.Fault.findAll(query);

    logger.info('Query result:', {
      faultsCount: faults.length,
      firstFault: faults[0] ? {
        id: faults[0].id,
        site: faults[0].site?.id,
        type: faults[0].type
      } : null
    });

    const formattedFaults = faults.map(fault => ({
      id: fault.id,
      site: {
        id: fault.site.id,
        name: fault.site.name
      },
      maintenanceOrganization: {
        id: fault.maintenanceOrganization?.id,
        name: fault.maintenanceOrganization?.name,
        type: fault.maintenanceOrganization?.type
      },
      integratorOrganization: {
        id: fault.integratorOrganization?.id,
        name: fault.integratorOrganization?.name,
        type: fault.integratorOrganization?.type
      },
      type: fault.type,
      description: fault.description,
      technician: fault.technician,
      technicianNotes: fault.technicianNotes,
      isCritical: fault.isCritical,
      isPartiallyDisabling: fault.isPartiallyDisabling || false,
      reportedTime: fault.reportedTime,
      closedTime: fault.closedTime,
      status: fault.status,
      lastUpdatedTime: fault.lastUpdatedTime
    }));

    res.json(formattedFaults);
  } catch (error) {
    logger.error('Error fetching faults:', error);
    next(new AppError('שגיאה בשליפת תקלות', 500));
  }
};

exports.createFault = async (req, res, next) => {
  try {
    const { siteId, type, description, isCritical, isPartiallyDisabling, severity } = req.body;

    if (!req.user.hasPermission(PERMISSIONS.NEW_FAULT)) {
      return next(new AppError('אין הרשאה ליצירת תקלה', 403));
    }

    const userSites = await getSitesByUserRole(req.user);
    const userSiteIds = userSites.map(site => site.id);
    if (!userSiteIds.includes(siteId)) {
      return next(new AppError('אין לך הרשאה ליצור תקלה באתר זה', 403));
    }

    const site = await db.Site.findByPk(siteId, {
      include: [{
        model: db.Organization,
        as: 'serviceOrganizations',
        attributes: ['id', 'type']
      }]
    });
    
    if (!site) {
      return next(new AppError('אתר לא נמצא', 404));
    }

    const validTypes = db.Fault.rawAttributes.type.values;
    if (!validTypes.includes(type)) {
      return next(new AppError('סוג תקלה לא חוקי', 400));
    }

    if (type === 'אחר' && (!description || !description.trim())) {
      return next(new AppError('חובה להזין תיאור לתקלה מסוג אחר', 400));
    }

    const maintenanceOrg = site.serviceOrganizations.find(org => org.type === 'maintenance');
    const integratorOrg = site.serviceOrganizations.find(org => org.type === 'integrator');

    // Determine isPartiallyDisabling based on severity if not explicitly provided
    let partiallyDisabling = isPartiallyDisabling;
    if (partiallyDisabling === undefined && severity) {
      partiallyDisabling = severity === 'partially_disabling';
    }

    const fault = await db.Fault.create({
      siteId,
      type,
      description: description ? description.trim() : null,
      isCritical: isCritical === true || severity === 'fully_disabling',
      isPartiallyDisabling: partiallyDisabling,
      status: 'פתוח',
      reportedBy: req.user.name,
      reportedTime: new Date(),
      maintenanceOrganizationId: maintenanceOrg?.id || null,
      integratorOrganizationId: integratorOrg?.id || null
    });

    const createdFault = await db.Fault.findByPk(fault.id, {
      include: [
        {
          model: db.Site,
          as: 'site',
          attributes: ['id', 'name']
        },
        {
          model: db.Organization,
          as: 'maintenanceOrganization',
          attributes: ['id', 'name']
        },
        {
          model: db.Organization,
          as: 'integratorOrganization',
          attributes: ['id', 'name']
        }
      ]
    });

    const formattedFault = {
      id: createdFault.id,
      site: {
        id: createdFault.site.id,
        name: createdFault.site.name
      },
      maintenanceOrganization: {
        id: createdFault.maintenanceOrganization?.id,
        name: createdFault.maintenanceOrganization?.name
      },
      integratorOrganization: {
        id: createdFault.integratorOrganization?.id,
        name: createdFault.integratorOrganization?.name
      },
      type: createdFault.type,
      description: createdFault.description,
      isCritical: createdFault.isCritical,
      isPartiallyDisabling: createdFault.isPartiallyDisabling || false,
      reportedTime: createdFault.reportedTime,
      closedTime: createdFault.closedTime,
      status: createdFault.status,
      lastUpdatedTime: createdFault.lastUpdatedTime
    };

    // Send email notification for new fault
    await require('../utils/emailFaultProcessor').processNewFault(createdFault);

    logger.info(`New fault created for site ${siteId}`);
    res.status(201).json(formattedFault);
  } catch (error) {
    logger.error('Error creating fault:', error);
    next(new AppError('שגיאה ביצירת תקלה', 500));
  }
};

exports.updateFaultStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const fault = await db.Fault.findByPk(id, {
      include: [
        {
          model: db.Site,
          as: 'site'
        },
        {
          model: db.Organization,
          as: 'maintenanceOrganization'
        },
        {
          model: db.Organization,
          as: 'integratorOrganization'
        }
      ]
    });

    if (!fault) {
      return next(new AppError('תקלה לא נמצאה', 404));
    }

    // Check if user has permission to update fault status
    if (!req.user.hasPermission(PERMISSIONS.UPDATE_FAULT_STATUS)) {
      return next(new AppError('אין לך הרשאה לעדכן סטטוס תקלה', 403));
    }

    const userSites = await getSitesByUserRole(req.user);
    const userSiteIds = userSites.map(site => site.id);
    if (!userSiteIds.includes(fault.siteId)) {
      return next(new AppError('אין לך הרשאה לעדכן תקלה זו', 403));
    }

    fault.status = status;
    fault.lastUpdatedBy = req.user.name;
    fault.lastUpdatedTime = new Date();

    if (status === 'סגור') {
      fault.closedTime = new Date();
      fault.closedBy = req.user.name;
      
      // Send email notification for fault closure
      await require('../utils/emailFaultProcessor').processFaultClosure(fault);
    }

    await fault.save();

    const formattedFault = {
      id: fault.id,
      site: {
        id: fault.site.id,
        name: fault.site.name
      },
      maintenanceOrganization: {
        id: fault.maintenanceOrganization?.id,
        name: fault.maintenanceOrganization?.name
      },
      integratorOrganization: {
        id: fault.integratorOrganization?.id,
        name: fault.integratorOrganization?.name
      },
      type: fault.type,
      description: fault.description,
      technician: fault.technician,
      isCritical: fault.isCritical,
      isPartiallyDisabling: fault.isPartiallyDisabling || false,
      reportedTime: fault.reportedTime,
      closedTime: fault.closedTime,
      status: fault.status,
      lastUpdatedTime: fault.lastUpdatedTime
    };

    logger.info(`Fault ${id} status updated to ${status}`);
    res.json(formattedFault);
  } catch (error) {
    logger.error('Error updating fault status:', error);
    next(new AppError('שגיאה בעדכון סטטוס תקלה', 500));
  }
};

exports.updateFaultDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
  const { technician, maintenanceOrganizationId, integratorOrganizationId, description, technicianNotes } = req.body;

    const fault = await db.Fault.findByPk(id, {
      include: [
        {
          model: db.Site,
          as: 'site'
        },
        {
          model: db.Organization,
          as: 'maintenanceOrganization'
        },
        {
          model: db.Organization,
          as: 'integratorOrganization'
        }
      ]
    });

    if (!fault) {
      return next(new AppError('תקלה לא נמצאה', 404));
    }

    // Check if user has permission to update fault details
    if (!req.user.hasPermission(PERMISSIONS.UPDATE_FAULT_DETAILS)) {
      return next(new AppError('אין לך הרשאה לעדכן פרטי תקלה', 403));
    }

    const userSites = await getSitesByUserRole(req.user);
    const userSiteIds = userSites.map(site => site.id);
    if (!userSiteIds.includes(fault.siteId)) {
      return next(new AppError('אין לך הרשאה לעדכן תקלה זו', 403));
    }

    if (technician !== undefined) {
      fault.technician = technician;
    }

    if (technicianNotes !== undefined) {
      fault.technicianNotes = technicianNotes;
    }

    if (description !== undefined) {
      fault.description = description;
    }

    if (maintenanceOrganizationId !== undefined) {
      if (maintenanceOrganizationId) {
        const org = await db.Organization.findOne({
          where: { id: maintenanceOrganizationId, type: 'maintenance' }
        });
        if (!org) {
          return next(new AppError('ארגון אחזקה לא נמצא', 404));
        }
      }
      fault.maintenanceOrganizationId = maintenanceOrganizationId;
    }

    if (integratorOrganizationId !== undefined) {
      if (integratorOrganizationId) {
        const org = await db.Organization.findOne({
          where: { id: integratorOrganizationId, type: 'integrator' }
        });
        if (!org) {
          return next(new AppError('ארגון אינטגרציה לא נמצא', 404));
        }
      }
      fault.integratorOrganizationId = integratorOrganizationId;
    }

    fault.lastUpdatedBy = req.user.name;
    fault.lastUpdatedTime = new Date();

    await fault.save();

    const updatedFault = await db.Fault.findByPk(id, {
      include: [
        {
          model: db.Site,
          as: 'site',
          attributes: ['id', 'name']
        },
        {
          model: db.Organization,
          as: 'maintenanceOrganization',
          attributes: ['id', 'name']
        },
        {
          model: db.Organization,
          as: 'integratorOrganization',
          attributes: ['id', 'name']
        }
      ]
    });

    const formattedFault = {
      id: updatedFault.id,
      site: {
        id: updatedFault.site.id,
        name: updatedFault.site.name
      },
      maintenanceOrganization: {
        id: updatedFault.maintenanceOrganization?.id,
        name: updatedFault.maintenanceOrganization?.name
      },
      integratorOrganization: {
        id: updatedFault.integratorOrganization?.id,
        name: updatedFault.integratorOrganization?.name
      },
      type: updatedFault.type,
      description: updatedFault.description,
      technician: updatedFault.technician,
      technicianNotes: updatedFault.technicianNotes,
      isCritical: updatedFault.isCritical,
      isPartiallyDisabling: updatedFault.isPartiallyDisabling || false,
      reportedTime: updatedFault.reportedTime,
      closedTime: updatedFault.closedTime,
      status: updatedFault.status,
      lastUpdatedTime: updatedFault.lastUpdatedTime
    };

    logger.info(`Fault ${id} details updated`);
    res.json(formattedFault);
  } catch (error) {
    logger.error('Error updating fault details:', error);
    next(new AppError('שגיאה בעדכון פרטי תקלה', 500));
  }
};

exports.deleteFault = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'admin') {
      return next(new AppError('אין הרשאה למחיקת תקלה', 403));
    }

    const fault = await db.Fault.findByPk(id);
    if (!fault) {
      return next(new AppError('תקלה לא נמצאה', 404));
    }

    const userSites = await getSitesByUserRole(req.user);
    const userSiteIds = userSites.map(site => site.id);
    if (!userSiteIds.includes(fault.siteId)) {
      return next(new AppError('אין לך הרשאה למחוק תקלה זו', 403));
    }

    if (!fault) {
      return next(new AppError('תקלה לא נמצאה', 404));
    }

    await fault.destroy();

    logger.info(`Fault ${id} deleted by admin`);
    res.status(204).json();
  } catch (error) {
    logger.error('Error deleting fault:', error);
    next(new AppError('שגיאה במחיקת תקלה', 500));
  }
};

exports.getFaultById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const fault = await db.Fault.findByPk(id, {
      include: [
        {
          model: db.Site,
          as: 'site',
          attributes: ['id', 'name']
        },
        {
          model: db.Organization,
          as: 'maintenanceOrganization',
          attributes: ['id', 'name']
        },
        {
          model: db.Organization,
          as: 'integratorOrganization',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!fault) {
      return next(new AppError('תקלה לא נמצאה', 404));
    }

    const userSites = await getSitesByUserRole(req.user);
    const userSiteIds = userSites.map(site => site.id);
    if (!userSiteIds.includes(fault.siteId)) {
      return next(new AppError('אין לך הרשאה לצפות בתקלה זו', 403));
    }

    const formattedFault = {
      id: fault.id,
      site: {
        id: fault.site.id,
        name: fault.site.name
      },
      maintenanceOrganization: {
        id: fault.maintenanceOrganization?.id,
        name: fault.maintenanceOrganization?.name
      },
      integratorOrganization: {
        id: fault.integratorOrganization?.id,
        name: fault.integratorOrganization?.name
      },
      type: fault.type,
      description: fault.description,
      technician: fault.technician,
      isCritical: fault.isCritical,
      isPartiallyDisabling: fault.isPartiallyDisabling || false,
      reportedTime: fault.reportedTime,
      closedTime: fault.closedTime,
      status: fault.status,
      lastUpdatedTime: fault.lastUpdatedTime
    };

    res.json(formattedFault);
  } catch (error) {
    logger.error('Error fetching fault:', error);
    next(new AppError('שגיאה בשליפת תקלה', 500));
  }
};

module.exports = exports;
