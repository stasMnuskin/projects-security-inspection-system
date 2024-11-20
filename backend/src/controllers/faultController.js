const db = require('../models');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

// Helper function to get sites based on user role and organization
const getSitesByUserRole = async (user) => {
  const { role, id: userId, organization } = user;
  
  if (role === 'admin' || role === 'security_officer') {
    return await db.Site.findAll({ attributes: ['id'] });
  }
  
  if (role === 'integrator' || role === 'maintenance') {
    // Get all sites in their organization
    return await db.Site.findAll({
      attributes: ['id'],
      include: [{
        model: db.User,
        as: 'entrepreneur',
        where: { organization },
        attributes: []
      }]
    });
  }
  
  // For entrepreneurs, get their sites
  return await db.Site.findAll({
    attributes: ['id'],
    where: { entrepreneurId: userId }
  });
};

// Get open faults for dashboard
exports.getOpenFaults = async (req, res, next) => {
  try {
    const siteIds = (await getSitesByUserRole(req.user)).map(site => site.id);

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
      order: [['reportedTime', 'DESC']]
    });

    const formattedFaults = faults.map((fault, index) => ({
      site: fault.site.name,
      fault: fault.type === 'אחר' ? fault.description : fault.type,
      serialNumber: index + 1
    }));

    res.json(formattedFaults);
  } catch (error) {
    logger.error('Error fetching open faults:', error);
    next(new AppError('שגיאה בשליפת תקלות פתוחות', 500));
  }
};

// Get recurring faults for dashboard
exports.getRecurringFaults = async (req, res, next) => {
  try {
    const siteIds = (await getSitesByUserRole(req.user)).map(site => site.id);

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const faults = await db.Fault.findAll({
      where: {
        siteId: { [Op.in]: siteIds },
        reportedTime: { [Op.gte]: oneMonthAgo }
      },
      attributes: [
        'type',
        'description',
        [db.sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['type', 'description'],
      having: db.sequelize.literal('COUNT(*) > 1'),
      order: [[db.sequelize.literal('count'), 'DESC']]
    });

    const formattedFaults = faults.map((fault, index) => ({
      count: parseInt(fault.get('count')),
      fault: fault.type === 'אחר' ? fault.description : fault.type,
      serialNumber: index + 1
    }));

    res.json(formattedFaults);
  } catch (error) {
    logger.error('Error fetching recurring faults:', error);
    next(new AppError('שגיאה בשליפת תקלות חוזרות', 500));
  }
};

// Get critical faults for dashboard
exports.getCriticalFaults = async (req, res, next) => {
  try {
    const siteIds = (await getSitesByUserRole(req.user)).map(site => site.id);

    const faults = await db.Fault.findAll({
      where: {
        isCritical: true,
        status: { [Op.ne]: 'סגור' },
        siteId: { [Op.in]: siteIds }
      },
      include: [{
        model: db.Site,
        as: 'site',
        attributes: ['name']
      }],
      order: [['reportedTime', 'DESC']]
    });

    const formattedFaults = faults.map((fault, index) => ({
      site: fault.site.name,
      fault: fault.type === 'אחר' ? fault.description : fault.type,
      serialNumber: index + 1
    }));

    res.json(formattedFaults);
  } catch (error) {
    logger.error('Error fetching critical faults:', error);
    next(new AppError('שגיאה בשליפת תקלות משביתות', 500));
  }
};

// Create new fault
exports.createFault = async (req, res, next) => {
  try {
    const { siteId, type, description, isCritical } = req.body;

    if (!req.user.hasPermission('new_fault')) {
      return next(new AppError('אין הרשאה ליצירת תקלה', 403));
    }

    const site = await db.Site.findByPk(siteId, {
      include: [{
        model: db.User,
        as: 'entrepreneur',
        attributes: ['organization']
      }]
    });
    
    if (!site) {
      return next(new AppError('אתר לא נמצא', 404));
    }

    const validTypes = ['גדר', 'מצלמות', 'תקשורת', 'אחר'];
    if (!validTypes.includes(type)) {
      return next(new AppError('סוג תקלה לא חוקי', 400));
    }

    if (type === 'אחר' && (!description || !description.trim())) {
      return next(new AppError('חובה להזין תיאור לתקלה מסוג אחר', 400));
    }

    // Get assigned users from site's organization
    const [maintenanceUser, integratorUser] = await Promise.all([
      site.maintenanceUserIds?.length > 0 ? db.User.findOne({
        where: {
          id: site.maintenanceUserIds[0],
          role: 'maintenance',
          organization: site.entrepreneur.organization
        }
      }) : null,
      site.integratorUserIds?.length > 0 ? db.User.findOne({
        where: {
          id: site.integratorUserIds[0],
          role: 'integrator',
          organization: site.entrepreneur.organization
        }
      }) : null
    ]);

    const fault = await db.Fault.create({
      siteId,
      type,
      description: description ? description.trim() : null,
      isCritical,
      status: 'פתוח',
      reportedBy: req.user.firstName + ' ' + req.user.lastName,
      reportedTime: new Date(),
      maintenanceUserId: maintenanceUser?.id || null,
      integratorUserId: integratorUser?.id || null
    });

    const createdFault = await db.Fault.findByPk(fault.id, {
      include: [{
        model: db.Site,
        as: 'site',
        attributes: ['name']
      }]
    });

    const formattedFault = {
      id: createdFault.id,
      site: {
        name: createdFault.site.name
      },
      type: createdFault.type,
      description: createdFault.description,
      isCritical: createdFault.isCritical,
      reportedTime: createdFault.reportedTime,
      closedTime: createdFault.closedTime,
      status: createdFault.status,
      lastUpdatedTime: createdFault.lastUpdatedTime,
      maintenanceUser: maintenanceUser ? {
        id: maintenanceUser.id,
        name: `${maintenanceUser.firstName} ${maintenanceUser.lastName}`
      } : null,
      integratorUser: integratorUser ? {
        id: integratorUser.id,
        name: `${integratorUser.firstName} ${integratorUser.lastName}`
      } : null,
      controlCenterUser: null
    };

    logger.info(`New fault created for site ${siteId}`);
    res.status(201).json(formattedFault);
  } catch (error) {
    logger.error('Error creating fault:', error);
    next(new AppError('שגיאה ביצירת תקלה', 500));
  }
};

// Update fault status
exports.updateFaultStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const fault = await db.Fault.findByPk(id, {
      include: [{
        model: db.Site,
        as: 'site',
        include: [{
          model: db.User,
          as: 'entrepreneur',
          attributes: ['organization']
        }]
      }]
    });

    if (!fault) {
      return next(new AppError('תקלה לא נמצאה', 404));
    }

    // Check if user has permission to update this fault
    if (req.user.role === 'integrator' || req.user.role === 'maintenance') {
      // Check only organization match
      const isSameOrg = req.user.organization === fault.site.entrepreneur.organization;
      if (!isSameOrg) {
        return next(new AppError('אין לך הרשאה לעדכן תקלה זו', 403));
      }
    }

    fault.status = status;
    fault.lastUpdatedBy = req.user.firstName + ' ' + req.user.lastName;
    fault.lastUpdatedTime = new Date();

    if (status === 'סגור') {
      fault.closedTime = new Date();
      fault.closedBy = req.user.firstName + ' ' + req.user.lastName;
    }

    await fault.save();

    logger.info(`Fault ${id} status updated to ${status}`);
    res.json(fault);
  } catch (error) {
    logger.error('Error updating fault status:', error);
    next(new AppError('שגיאה בעדכון סטטוס תקלה', 500));
  }
};

// Update fault details
exports.updateFaultDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { technician, maintenanceUserId, integratorUserId } = req.body;

    const fault = await db.Fault.findByPk(id, {
      include: [{
        model: db.Site,
        as: 'site',
        include: [{
          model: db.User,
          as: 'entrepreneur',
          attributes: ['organization']
        }]
      }]
    });

    if (!fault) {
      return next(new AppError('תקלה לא נמצאה', 404));
    }

    // Check if user has permission to update this fault
    if (req.user.role === 'integrator' || req.user.role === 'maintenance') {
      // Check only organization match
      const isSameOrg = req.user.organization === fault.site.entrepreneur.organization;
      if (!isSameOrg) {
        return next(new AppError('אין לך הרשאה לעדכן תקלה זו', 403));
      }
    }

    if (technician !== undefined) {
      fault.technician = technician;
    }

    // Update maintenance user if provided
    if (maintenanceUserId !== undefined) {
      // Verify user exists and has maintenance role in the organization
      const maintenanceUser = await db.User.findOne({
        where: {
          id: maintenanceUserId,
          role: 'maintenance',
          organization: fault.site.entrepreneur.organization
        }
      });
      
      if (maintenanceUserId && !maintenanceUser) {
        return next(new AppError('משתמש אחזקה לא נמצא או אינו שייך לארגון', 404));
      }

      fault.maintenanceUserId = maintenanceUserId || null;
    }

    // Update integrator user if provided
    if (integratorUserId !== undefined) {
      // Verify user exists and has integrator role in the organization
      const integratorUser = await db.User.findOne({
        where: {
          id: integratorUserId,
          role: 'integrator',
          organization: fault.site.entrepreneur.organization
        }
      });
      
      if (integratorUserId && !integratorUser) {
        return next(new AppError('משתמש אינטגרטור לא נמצא או אינו שייך לארגון', 404));
      }

      fault.integratorUserId = integratorUserId || null;
    }

    fault.lastUpdatedBy = req.user.firstName + ' ' + req.user.lastName;
    fault.lastUpdatedTime = new Date();

    await fault.save();

    const updatedFault = await db.Fault.findByPk(id, {
      include: [
        {
          model: db.Site,
          as: 'site',
          attributes: ['name']
        },
        {
          model: db.User,
          as: 'maintenanceUser',
          attributes: ['firstName', 'lastName']
        },
        {
          model: db.User,
          as: 'integratorUser',
          attributes: ['firstName', 'lastName']
        }
      ]
    });

    logger.info(`Fault ${id} details updated`);
    res.json(updatedFault);
  } catch (error) {
    logger.error('Error updating fault details:', error);
    next(new AppError('שגיאה בעדכון פרטי תקלה', 500));
  }
};

// Delete fault
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

    await fault.destroy();

    logger.info(`Fault ${id} deleted by admin`);
    res.status(204).json();
  } catch (error) {
    logger.error('Error deleting fault:', error);
    next(new AppError('שגיאה במחיקת תקלה', 500));
  }
};

// Get fault by ID
exports.getFaultById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const fault = await db.Fault.findByPk(id, {
      include: [{
        model: db.Site,
        as: 'site',
        attributes: ['name']
      }]
    });

    if (!fault) {
      return next(new AppError('תקלה לא נמצאה', 404));
    }

    res.json(fault);
  } catch (error) {
    logger.error('Error fetching fault:', error);
    next(new AppError('שגיאה בשליפת תקלה', 500));
  }
};

// Get all faults with filters
exports.getAllFaults = async (req, res, next) => {
  try {
    const { role, id: userId, organization } = req.user;
    const { startDate, endDate, site, isCritical, maintenance, integrator } = req.query;

    // Base query
    let whereClause = {};

    // Date range
    if (startDate && endDate) {
      whereClause.reportedTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      whereClause.reportedTime = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      whereClause.reportedTime = {
        [Op.lte]: new Date(endDate)
      };
    }

    // isCritical filter
    if (isCritical !== undefined) {
      whereClause.isCritical = isCritical === 'true';
    }

    // Role-based site access
    let siteWhere = {};
    let entrepreneurWhere = {};
    
    if (role === 'entrepreneur') {
      siteWhere.entrepreneurId = userId;
    } else if (role === 'integrator' || role === 'maintenance') {
      entrepreneurWhere.organization = organization;
    }
    if (site) {
      siteWhere.id = site;
    }

    // Build include array
    let includeArray = [{
      model: db.Site,
      as: 'site',
      where: Object.keys(siteWhere).length > 0 ? siteWhere : undefined,
      attributes: ['id', 'name'],
      include: [{
        model: db.User,
        as: 'entrepreneur',
        where: Object.keys(entrepreneurWhere).length > 0 ? entrepreneurWhere : undefined,
        attributes: ['organization']
      }]
    }];

    // Add maintenance user
    if (maintenance) {
      includeArray.push({
        model: db.User,
        as: 'maintenanceUser',
        where: { id: maintenance },
        attributes: ['firstName', 'lastName'],
        required: true
      });
    } else {
      includeArray.push({
        model: db.User,
        as: 'maintenanceUser',
        attributes: ['firstName', 'lastName'],
        required: false
      });
    }

    // Add integrator user
    if (integrator) {
      includeArray.push({
        model: db.User,
        as: 'integratorUser',
        where: { id: integrator },
        attributes: ['firstName', 'lastName'],
        required: true
      });
    } else {
      includeArray.push({
        model: db.User,
        as: 'integratorUser',
        attributes: ['firstName', 'lastName'],
        required: false
      });
    }

    // Add control center user
    includeArray.push({
      model: db.User,
      as: 'controlCenterUser',
      attributes: ['firstName', 'lastName'],
      required: false
    });

    // Execute query
    const faults = await db.Fault.findAll({
      where: whereClause,
      include: includeArray,
      order: [['reportedTime', 'DESC']]
    });

    // Format response
    const formattedFaults = faults.map(fault => ({
      id: fault.id,
      site: {
        id: fault.site.id,
        name: fault.site.name,
        organization: fault.site.entrepreneur.organization
      },
      maintenanceUser: fault.maintenanceUser ? {
        id: fault.maintenanceUser.id,
        name: `${fault.maintenanceUser.firstName} ${fault.maintenanceUser.lastName}`
      } : null,
      integratorUser: fault.integratorUser ? {
        id: fault.integratorUser.id,
        name: `${fault.integratorUser.firstName} ${fault.integratorUser.lastName}`
      } : null,
      controlCenterUser: fault.controlCenterUser ? {
        name: `${fault.controlCenterUser.firstName} ${fault.controlCenterUser.lastName}`
      } : null,
      type: fault.type,
      description: fault.description,
      technician: fault.technician,
      isCritical: fault.isCritical,
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
