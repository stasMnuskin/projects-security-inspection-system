const db = require('../models');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

const getSitesByUserRole = async (user) => {
  const { role, id: userId, organizationId } = user;
  
  if (role === 'admin' || role === 'security_officer') {
    return await db.Site.findAll({ attributes: ['id'] });
  }
  
  if (role === 'integrator' || role === 'maintenance') {
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

exports.createFault = async (req, res, next) => {
  try {
    const { siteId, type, description, isCritical } = req.body;

    if (!req.user.hasPermission('new_fault')) {
      return next(new AppError('אין הרשאה ליצירת תקלה', 403));
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

    const validTypes = ['גדר', 'מצלמות', 'תקשורת', 'אחר'];
    if (!validTypes.includes(type)) {
      return next(new AppError('סוג תקלה לא חוקי', 400));
    }

    if (type === 'אחר' && (!description || !description.trim())) {
      return next(new AppError('חובה להזין תיאור לתקלה מסוג אחר', 400));
    }

    const maintenanceOrg = site.serviceOrganizations.find(org => org.type === 'maintenance');
    const integratorOrg = site.serviceOrganizations.find(org => org.type === 'integrator');

    const fault = await db.Fault.create({
      siteId,
      type,
      description: description ? description.trim() : null,
      isCritical,
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
          attributes: ['name']
        },
        {
          model: db.Organization,
          as: 'maintenanceOrganization',
          attributes: ['id', 'name'],
          include: [{
            model: db.User,
            as: 'employees',
            attributes: ['id', 'name'],
            where: { role: 'maintenance' }
          }]
        },
        {
          model: db.Organization,
          as: 'integratorOrganization',
          attributes: ['id', 'name'],
          include: [{
            model: db.User,
            as: 'employees',
            attributes: ['id', 'name'],
            where: { role: 'integrator' }
          }]
        }
      ]
    });

    const formattedFault = {
      id: createdFault.id,
      site: {
        name: createdFault.site.name
      },
      maintenanceOrganization: {
        id: createdFault.maintenanceOrganization?.id,
        name: createdFault.maintenanceOrganization?.name,
        users: createdFault.maintenanceOrganization?.employees?.map(user => ({
          id: user.id,
          name: user.name
        })) || []
      },
      integratorOrganization: {
        id: createdFault.integratorOrganization?.id,
        name: createdFault.integratorOrganization?.name,
        users: createdFault.integratorOrganization?.employees?.map(user => ({
          id: user.id,
          name: user.name
        })) || []
      },
      type: createdFault.type,
      description: createdFault.description,
      isCritical: createdFault.isCritical,
      reportedTime: createdFault.reportedTime,
      closedTime: createdFault.closedTime,
      status: createdFault.status,
      lastUpdatedTime: createdFault.lastUpdatedTime
    };

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
          as: 'maintenanceOrganization',
          include: [{
            model: db.User,
            as: 'employees',
            attributes: ['id', 'name'],
            where: { role: 'maintenance' }
          }]
        },
        {
          model: db.Organization,
          as: 'integratorOrganization',
          include: [{
            model: db.User,
            as: 'employees',
            attributes: ['id', 'name'],
            where: { role: 'integrator' }
          }]
        }
      ]
    });

    if (!fault) {
      return next(new AppError('תקלה לא נמצאה', 404));
    }

    if (req.user.role === 'integrator' || req.user.role === 'maintenance') {
      const userOrgId = req.user.organizationId;
      const isAllowed = fault.maintenanceOrganizationId === userOrgId || 
                       fault.integratorOrganizationId === userOrgId;
      
      if (!isAllowed) {
        return next(new AppError('אין לך הרשאה לעדכן תקלה זו', 403));
      }
    }

    fault.status = status;
    fault.lastUpdatedBy = req.user.name;
    fault.lastUpdatedTime = new Date();

    if (status === 'סגור') {
      fault.closedTime = new Date();
      fault.closedBy = req.user.name;
    }

    await fault.save();

    const formattedFault = {
      id: fault.id,
      site: {
        name: fault.site.name
      },
      maintenanceOrganization: {
        id: fault.maintenanceOrganization?.id,
        name: fault.maintenanceOrganization?.name,
        users: fault.maintenanceOrganization?.employees?.map(user => ({
          id: user.id,
          name: user.name
        })) || []
      },
      integratorOrganization: {
        id: fault.integratorOrganization?.id,
        name: fault.integratorOrganization?.name,
        users: fault.integratorOrganization?.employees?.map(user => ({
          id: user.id,
          name: user.name
        })) || []
      },
      type: fault.type,
      description: fault.description,
      technician: fault.technician,
      isCritical: fault.isCritical,
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
    const { technician, maintenanceOrganizationId, integratorOrganizationId } = req.body;

    const fault = await db.Fault.findByPk(id, {
      include: [
        {
          model: db.Site,
          as: 'site'
        },
        {
          model: db.Organization,
          as: 'maintenanceOrganization',
          include: [{
            model: db.User,
            as: 'employees',
            attributes: ['id', 'name'],
            where: { role: 'maintenance' }
          }]
        },
        {
          model: db.Organization,
          as: 'integratorOrganization',
          include: [{
            model: db.User,
            as: 'employees',
            attributes: ['id', 'name'],
            where: { role: 'integrator' }
          }]
        }
      ]
    });

    if (!fault) {
      return next(new AppError('תקלה לא נמצאה', 404));
    }

    if (req.user.role === 'integrator' || req.user.role === 'maintenance') {
      const userOrgId = req.user.organizationId;
      const isAllowed = fault.maintenanceOrganizationId === userOrgId || 
                       fault.integratorOrganizationId === userOrgId;
      
      if (!isAllowed) {
        return next(new AppError('אין לך הרשאה לעדכן תקלה זו', 403));
      }
    }

    if (technician !== undefined) {
      fault.technician = technician;
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
          attributes: ['name']
        },
        {
          model: db.Organization,
          as: 'maintenanceOrganization',
          attributes: ['id', 'name'],
          include: [{
            model: db.User,
            as: 'employees',
            attributes: ['id', 'name'],
            where: { role: 'maintenance' }
          }]
        },
        {
          model: db.Organization,
          as: 'integratorOrganization',
          attributes: ['id', 'name'],
          include: [{
            model: db.User,
            as: 'employees',
            attributes: ['id', 'name'],
            where: { role: 'integrator' }
          }]
        }
      ]
    });

    const formattedFault = {
      id: updatedFault.id,
      site: {
        name: updatedFault.site.name
      },
      maintenanceOrganization: {
        id: updatedFault.maintenanceOrganization?.id,
        name: updatedFault.maintenanceOrganization?.name,
        users: updatedFault.maintenanceOrganization?.employees?.map(user => ({
          id: user.id,
          name: user.name
        })) || []
      },
      integratorOrganization: {
        id: updatedFault.integratorOrganization?.id,
        name: updatedFault.integratorOrganization?.name,
        users: updatedFault.integratorOrganization?.employees?.map(user => ({
          id: user.id,
          name: user.name
        })) || []
      },
      type: updatedFault.type,
      description: updatedFault.description,
      technician: updatedFault.technician,
      isCritical: updatedFault.isCritical,
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
          attributes: ['name']
        },
        {
          model: db.Organization,
          as: 'maintenanceOrganization',
          attributes: ['id', 'name'],
          include: [{
            model: db.User,
            as: 'employees',
            attributes: ['id', 'name'],
            where: { role: 'maintenance' }
          }]
        },
        {
          model: db.Organization,
          as: 'integratorOrganization',
          attributes: ['id', 'name'],
          include: [{
            model: db.User,
            as: 'employees',
            attributes: ['id', 'name'],
            where: { role: 'integrator' }
          }]
        }
      ]
    });

    if (!fault) {
      return next(new AppError('תקלה לא נמצאה', 404));
    }

    const formattedFault = {
      id: fault.id,
      site: {
        name: fault.site.name
      },
      maintenanceOrganization: {
        id: fault.maintenanceOrganization?.id,
        name: fault.maintenanceOrganization?.name,
        users: fault.maintenanceOrganization?.employees?.map(user => ({
          id: user.id,
          name: user.name
        })) || []
      },
      integratorOrganization: {
        id: fault.integratorOrganization?.id,
        name: fault.integratorOrganization?.name,
        users: fault.integratorOrganization?.employees?.map(user => ({
          id: user.id,
          name: user.name
        })) || []
      },
      type: fault.type,
      description: fault.description,
      technician: fault.technician,
      isCritical: fault.isCritical,
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


exports.getAllFaults = async (req, res, next) => {
  try {
    const { role, id: userId, organizationId } = req.user;
    const { startDate, endDate, site, isCritical, maintenanceOrg, integratorOrg } = req.query;

    let whereClause = {};

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

    if (isCritical !== undefined) {
      whereClause.isCritical = isCritical === 'true';
    }

    let siteWhere = {};
    if (role === 'entrepreneur') {
      siteWhere.entrepreneurId = userId;
    }
    
    if (site) {
      siteWhere.id = site;
    }

    const includes = [
      {
        model: db.Site,
        as: 'site',
        where: siteWhere,
        attributes: ['id', 'name'],
        include: [
          {
            model: db.Organization,
            as: 'serviceOrganizations',
            attributes: ['id', 'name', 'type'],
            ...(maintenanceOrg || integratorOrg ? {
              where: {
                [Op.or]: [
                  maintenanceOrg ? { id: maintenanceOrg, type: 'maintenance' } : null,
                  integratorOrg ? { id: integratorOrg, type: 'integrator' } : null
                ].filter(Boolean)
              }
            } : {})
          }
        ]
      }
    ];

    if (role === 'integrator' || role === 'maintenance') {
      includes[0].include[0].where = {
        id: organizationId,
        type: role === 'integrator' ? 'integrator' : 'maintenance'
      };
    }

    const faults = await db.Fault.findAll({
      where: whereClause,
      include: includes,
      order: [['reportedTime', 'DESC']]
    });

    const formattedFaults = faults.map(fault => ({
      id: fault.id,
      site: {
        id: fault.site.id,
        name: fault.site.name,
        serviceOrganizations: fault.site.serviceOrganizations
      },
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
