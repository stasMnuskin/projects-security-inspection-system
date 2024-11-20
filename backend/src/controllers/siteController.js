const { Site, User } = require('../models');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

const VALID_SITE_TYPES = ['radar', 'inductive_fence'];

// Helper function to convert single ID or array of IDs to array
const normalizeUserIds = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const validateUser = async (userId, role, errorPrefix) => {
  if (!userId) return null;
  
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError(`${errorPrefix} לא נמצא`, 404, 'USER_NOT_FOUND');
  }
  if (user.role !== role) {
    throw new AppError(`המשתמש שנבחר אינו ${errorPrefix}`, 400, 'INVALID_USER_ROLE');
  }
  return user;
};

const validateUsers = async (userIds, role, errorPrefix, organization) => {
  const ids = normalizeUserIds(userIds);
  if (!ids.length) return [];

  const users = await User.findAll({
    where: { id: ids }
  });

  if (users.length !== ids.length) {
    throw new AppError(`חלק מה${errorPrefix} לא נמצאו`, 404, 'USERS_NOT_FOUND');
  }

  const invalidUsers = users.filter(user => 
    user.role !== role || (organization && user.organization !== organization)
  );
  
  if (invalidUsers.length > 0) {
    throw new AppError(
      organization 
        ? `חלק מהמשתמשים שנבחרו אינם ${errorPrefix} או אינם שייכים לארגון`
        : `חלק מהמשתמשים שנבחרו אינם ${errorPrefix}`,
      400, 
      'INVALID_USER_ROLES'
    );
  }

  return users;
};

exports.createSite = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('שגיאת אימות', 400, 'VALIDATION_ERROR', true, errors.array()));
    }

    const { 
      name, 
      type, 
      entrepreneurId,
      integratorUserIds,
      integratorUserId,
      maintenanceUserIds,
      maintenanceUserId,
      controlCenterUserId,
      customFields 
    } = req.body;

    // Validate site type
    if (!VALID_SITE_TYPES.includes(type)) {
      return next(new AppError('סוג אתר לא תקין', 400, 'INVALID_SITE_TYPE'));
    }

    // Validate entrepreneur exists and is of type entrepreneur
    const entrepreneur = await validateUser(entrepreneurId, 'entrepreneur', 'יזם');

    // Normalize and validate arrays of users
    const normalizedIntegratorIds = normalizeUserIds(integratorUserIds || integratorUserId);
    const normalizedMaintenanceIds = normalizeUserIds(maintenanceUserIds || maintenanceUserId);

    // Validate users with organization check
    await validateUsers(normalizedIntegratorIds, 'integrator', 'אינטגרטורים', entrepreneur.organization);
    await validateUsers(normalizedMaintenanceIds, 'maintenance', 'אנשי אחזקה', entrepreneur.organization);

    // Validate control center user if provided
    if (controlCenterUserId) {
      await validateUser(controlCenterUserId, 'control_center', 'איש מוקד');
    }

    // Validate custom fields format
    if (customFields) {
      if (!Array.isArray(customFields)) {
        return next(new AppError('שדות מותאמים אישית חייבים להיות מערך', 400, 'INVALID_CUSTOM_FIELDS'));
      }
      for (const field of customFields) {
        if (!field.name || !field.value) {
          return next(new AppError('כל שדה מותאם אישית חייב להכיל שם וערך', 400, 'INVALID_CUSTOM_FIELD_FORMAT'));
        }
      }
    }

    const site = await Site.create({
      name,
      type,
      entrepreneurId,
      integratorUserIds: normalizedIntegratorIds,
      maintenanceUserIds: normalizedMaintenanceIds,
      controlCenterUserId,
      customFields: customFields || []
    });

    logger.info(`New site created: ${site.name} for entrepreneur: ${entrepreneurId}`);

    // Fetch the created site with all associations
    const createdSite = await Site.findByPk(site.id, {
      include: [
        {
          model: User,
          as: 'entrepreneur',
          attributes: ['id', 'firstName', 'lastName', 'email', 'organization']
        },
        {
          model: User,
          as: 'controlCenter',
          attributes: ['id', 'firstName', 'lastName']
        }
      ]
    });

    // Fetch integrators and maintenance staff
    const [integrators, maintenanceStaff] = await Promise.all([
      User.findAll({
        where: { id: normalizedIntegratorIds },
        attributes: ['id', 'firstName', 'lastName']
      }),
      User.findAll({
        where: { id: normalizedMaintenanceIds },
        attributes: ['id', 'firstName', 'lastName']
      })
    ]);

    res.status(201).json({
      message: 'האתר נוצר בהצלחה',
      site: {
        ...createdSite.toJSON(),
        integrators,
        maintenanceStaff
      }
    });
  } catch (error) {
    logger.error('Error creating site:', error);
    next(error instanceof AppError ? error : new AppError('שגיאה ביצירת האתר', 500, 'SITE_CREATION_ERROR'));
  }
};

exports.getAllSites = async (req, res, next) => {
  try {
    let where = {};
    const { role, organization } = req.user;
    
    // Integrators, maintenance staff and entrepreneurs only see sites in their organization
    if (['integrator', 'maintenance', 'entrepreneur'].includes(role)) {
      where = {
        '$entrepreneur.organization$': organization
      };
    }

    const sites = await Site.findAll({
      where,
      include: [
        {
          model: User,
          as: 'entrepreneur',
          attributes: ['id', 'firstName', 'lastName', 'email', 'organization']
        },
        {
          model: User,
          as: 'controlCenter',
          attributes: ['id', 'firstName', 'lastName']
        }
      ],
      order: [
        ['name', 'ASC']
      ]
    });

    // Fetch all users for integrators and maintenance staff
    const userIds = new Set();
    sites.forEach(site => {
      site.integratorUserIds?.forEach(id => userIds.add(id));
      site.maintenanceUserIds?.forEach(id => userIds.add(id));
    });

    const users = await User.findAll({
      where: { id: Array.from(userIds) },
      attributes: ['id', 'firstName', 'lastName', 'role']
    });

    const usersMap = new Map(users.map(user => [user.id, user]));

    const sitesWithUsers = sites.map(site => {
      const siteJson = site.toJSON();
      return {
        ...siteJson,
        integrators: (siteJson.integratorUserIds || [])
          .map(id => usersMap.get(id))
          .filter(user => user?.role === 'integrator'),
        maintenanceStaff: (siteJson.maintenanceUserIds || [])
          .map(id => usersMap.get(id))
          .filter(user => user?.role === 'maintenance')
      };
    });

    res.json(sitesWithUsers);
  } catch (error) {
    logger.error('Error getting all sites:', error);
    next(new AppError('שגיאה בשליפת האתרים', 500, 'SITES_FETCH_ERROR'));
  }
};
exports.getSitesByEntrepreneur = async (req, res, next) => {
  try {
    const { entrepreneurId } = req.params;

    // Check access permissions
    if (req.user.role === 'entrepreneur' && req.user.id !== parseInt(entrepreneurId)) {
      return next(new AppError('אין הרשאה לצפות באתרים של יזם אחר', 403, 'FORBIDDEN'));
    }

    // Verify entrepreneur exists
    const entrepreneur = await User.findByPk(entrepreneurId);
    if (!entrepreneur) {
      return next(new AppError('יזם לא נמצא', 404, 'ENTREPRENEUR_NOT_FOUND'));
    }

    const sites = await Site.findAll({
      where: { entrepreneurId },
      include: [
        {
          model: User,
          as: 'entrepreneur',
          attributes: ['id', 'firstName', 'lastName', 'email', 'organization']
        },
        {
          model: User,
          as: 'controlCenter',
          attributes: ['id', 'firstName', 'lastName']
        }
      ],
      order: [['name', 'ASC']]
    });

    // Fetch all users for integrators and maintenance staff
    const userIds = new Set();
    sites.forEach(site => {
      site.integratorUserIds?.forEach(id => userIds.add(id));
      site.maintenanceUserIds?.forEach(id => userIds.add(id));
    });

    const users = await User.findAll({
      where: { id: Array.from(userIds) },
      attributes: ['id', 'firstName', 'lastName', 'role']
    });

    const usersMap = new Map(users.map(user => [user.id, user]));

    const sitesWithUsers = sites.map(site => {
      const siteJson = site.toJSON();
      return {
        ...siteJson,
        integrators: (siteJson.integratorUserIds || [])
          .map(id => usersMap.get(id))
          .filter(user => user?.role === 'integrator'),
        maintenanceStaff: (siteJson.maintenanceUserIds || [])
          .map(id => usersMap.get(id))
          .filter(user => user?.role === 'maintenance')
      };
    });

    res.json(sitesWithUsers);
  } catch (error) {
    logger.error('Error getting entrepreneur sites:', error);
    next(new AppError('שגיאה בשליפת האתרים', 500, 'SITES_FETCH_ERROR'));
  }
};

exports.getSite = async (req, res, next) => {
  try {
    const site = await Site.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'entrepreneur',
          attributes: ['id', 'firstName', 'lastName', 'email', 'organization']
        },
        {
          model: User,
          as: 'controlCenter',
          attributes: ['id', 'firstName', 'lastName']
        }
      ]
    });

    if (!site) {
      return next(new AppError('אתר לא נמצא', 404, 'SITE_NOT_FOUND'));
    }

    // Check access permissions
    if (req.user.role === 'entrepreneur' && site.entrepreneurId !== req.user.id) {
      return next(new AppError('אין הרשאה לצפות באתר זה', 403, 'FORBIDDEN'));
    }

    // Fetch integrators and maintenance staff
    const [integrators, maintenanceStaff] = await Promise.all([
      User.findAll({
        where: { id: site.integratorUserIds || [] },
        attributes: ['id', 'firstName', 'lastName']
      }),
      User.findAll({
        where: { id: site.maintenanceUserIds || [] },
        attributes: ['id', 'firstName', 'lastName']
      })
    ]);

    const siteJson = site.toJSON();
    res.json({
      ...siteJson,
      integrators,
      maintenanceStaff
    });
  } catch (error) {
    logger.error('Error getting site:', error);
    next(new AppError('שגיאה בשליפת האתר', 500, 'SITE_FETCH_ERROR'));
  }
};

exports.updateSite = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('שגיאת אימות', 400, 'VALIDATION_ERROR', true, errors.array()));
    }

    const site = await Site.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'entrepreneur',
        attributes: ['id', 'organization']
      }]
    });
    
    if (!site) {
      return next(new AppError('אתר לא נמצא', 404, 'SITE_NOT_FOUND'));
    }

    const { 
      name, 
      type, 
      entrepreneurId,
      integratorUserIds,
      integratorUserId,
      maintenanceUserIds,
      maintenanceUserId,
      controlCenterUserId,
      customFields 
    } = req.body;

    // Update basic fields
    if (name) site.name = name;
    
    // Update type if provided and valid
    if (type) {
      if (!VALID_SITE_TYPES.includes(type)) {
        return next(new AppError('סוג אתר לא תקין', 400, 'INVALID_SITE_TYPE'));
      }
      site.type = type;
    }

    // Update entrepreneur if provided
    let organization = site.entrepreneur.organization;
    if (entrepreneurId) {
      const newEntrepreneur = await validateUser(entrepreneurId, 'entrepreneur', 'יזם');
      site.entrepreneurId = entrepreneurId;
      organization = newEntrepreneur.organization;
    }

    // Normalize and validate arrays of users if provided
    if (integratorUserIds !== undefined || integratorUserId !== undefined) {
      const normalizedIntegratorIds = normalizeUserIds(integratorUserIds || integratorUserId);
      await validateUsers(normalizedIntegratorIds, 'integrator', 'אינטגרטורים', organization);
      site.integratorUserIds = normalizedIntegratorIds;
    }

    if (maintenanceUserIds !== undefined || maintenanceUserId !== undefined) {
      const normalizedMaintenanceIds = normalizeUserIds(maintenanceUserIds || maintenanceUserId);
      await validateUsers(normalizedMaintenanceIds, 'maintenance', 'אנשי אחזקה', organization);
      site.maintenanceUserIds = normalizedMaintenanceIds;
    }

    // Update control center user if provided
    if (controlCenterUserId !== undefined) {
      if (controlCenterUserId) {
        await validateUser(controlCenterUserId, 'control_center', 'איש מוקד');
      }
      site.controlCenterUserId = controlCenterUserId;
    }

    // Update custom fields if provided
    if (customFields) {
      if (!Array.isArray(customFields)) {
        return next(new AppError('שדות מותאמים אישית חייבים להיות מערך', 400, 'INVALID_CUSTOM_FIELDS'));
      }
      for (const field of customFields) {
        if (!field.name || !field.value) {
          return next(new AppError('כל שדה מותאם אישית חייב להכיל שם וערך', 400, 'INVALID_CUSTOM_FIELD_FORMAT'));
        }
      }
      site.customFields = customFields;
    }
    
    await site.save();
    logger.info(`Site updated: ${site.name}`);

    const updatedSite = await Site.findByPk(site.id, {
      include: [
        {
          model: User,
          as: 'entrepreneur',
          attributes: ['id', 'firstName', 'lastName', 'email', 'organization']
        },
        {
          model: User,
          as: 'controlCenter',
          attributes: ['id', 'firstName', 'lastName']
        }
      ]
    });

    // Fetch integrators and maintenance staff
    const [integrators, maintenanceStaff] = await Promise.all([
      User.findAll({
        where: { id: site.integratorUserIds || [] },
        attributes: ['id', 'firstName', 'lastName']
      }),
      User.findAll({
        where: { id: site.maintenanceUserIds || [] },
        attributes: ['id', 'firstName', 'lastName']
      })
    ]);

    res.json({ 
      message: 'האתר עודכן בהצלחה', 
      site: {
        ...updatedSite.toJSON(),
        integrators,
        maintenanceStaff
      }
    });
  } catch (error) {
    logger.error('Error updating site:', error);
    next(error instanceof AppError ? error : new AppError('שגיאה בעדכון האתר', 500, 'SITE_UPDATE_ERROR'));
  }
};

exports.deleteSite = async (req, res, next) => {
  try {
    const site = await Site.findByPk(req.params.id);
    if (!site) {
      return next(new AppError('אתר לא נמצא', 404, 'SITE_NOT_FOUND'));
    }

    await site.destroy();
    logger.info(`Site deleted: ${site.name}`);
    res.json({ message: 'האתר נמחק בהצלחה' });
  } catch (error) {
    logger.error('Error deleting site:', error);
    next(new AppError('שגיאה במחיקת האתר', 500, 'SITE_DELETE_ERROR'));
  }
};