const { Site, User, Organization } = require('../models');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

const VALID_SITE_TYPES = ['radar', 'inductive_fence'];

const validateUser = async (userId, role, errorPrefix) => {
  if (!userId) return null;
  
  const user = await User.findOne({
    where: { 
      id: userId,
      role
    }
  });
  if (!user) {
    throw new AppError(`${errorPrefix} לא נמצא`, 404, 'USER_NOT_FOUND');
  }
  return user;
};

const validateOrganizations = async (organizationIds, type, errorPrefix) => {
  if (!organizationIds || organizationIds.length === 0) return [];

  // Find organizations by ID and type, with active users
  const organizations = await Organization.findAll({
    where: { 
      id: organizationIds,
      type
    },
    include: [{
      model: User,
      as: 'employees',
      where: {
        deletedAt: null,
        role: type
      },
      required: true,
      attributes: []
    }]
  });

  if (organizations.length !== organizationIds.length) {
    throw new AppError(`חלק מה${errorPrefix} לא נמצאו או אין להם משתמשים פעילים`, 404, 'ORGANIZATION_NOT_FOUND');
  }

  return organizations;
};

const validateNotificationRecipients = async (recipientIds) => {
  if (!recipientIds || !Array.isArray(recipientIds)) return [];

  const users = await User.findAll({
    where: { 
      id: recipientIds
    },
    attributes: ['id', 'name', 'email', 'role']
  });

  if (users.length !== recipientIds.length) {
    throw new AppError('חלק מהמשתמשים שנבחרו לא נמצאו או נמחקו מהמערכת', 404, 'USERS_NOT_FOUND');
  }

  return users;
};

const getBaseInclude = () => [
  {
    model: User.scope('withOrganization'),
    as: 'entrepreneur',
    attributes: ['id', 'name', 'email'],
    required: false
  },
  {
    model: Organization.scope('withActiveUsers'),
    as: 'serviceOrganizations',
    attributes: ['id', 'name', 'type'],
    required: false
  },
  {
    model: User,
    as: 'notificationRecipients',
    attributes: ['id', 'name', 'email', 'role'],
    required: false
  }
];

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
      integratorOrganizationIds,
      maintenanceOrganizationIds,
      controlCenterOrganizationIds,
      customFields,
      notificationRecipientIds
    } = req.body;

    // Validate site type
    if (!VALID_SITE_TYPES.includes(type)) {
      return next(new AppError('סוג אתר לא תקין', 400, 'INVALID_SITE_TYPE'));
    }

    // Validate entrepreneur exists and is of type entrepreneur
    const entrepreneur = await validateUser(entrepreneurId, 'entrepreneur', 'יזם');

    // Validate organizations
    const integratorOrgs = await validateOrganizations(integratorOrganizationIds, 'integrator', 'ארגוני אינטגרציה');
    const maintenanceOrgs = await validateOrganizations(maintenanceOrganizationIds, 'maintenance', 'ארגוני אחזקה');
    const controlCenterOrgs = await validateOrganizations(controlCenterOrganizationIds, 'control_center', 'ארגוני מוקד');

    // Validate notification recipients if provided
    const notificationRecipients = await validateNotificationRecipients(notificationRecipientIds);

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
      customFields: customFields || []
    });

    // Set up organization relationships
    const organizationIds = [
      ...(integratorOrgs.map(org => org.id) || []),
      ...(maintenanceOrgs.map(org => org.id) || []),
      ...(controlCenterOrgs.map(org => org.id) || [])
    ];
    
    if (organizationIds.length > 0) {
      await site.setServiceOrganizations(organizationIds);
    }

    // Set up notification recipients
    if (notificationRecipients.length > 0) {
      await site.setNotificationRecipients(notificationRecipients.map(user => user.id));
    }

    logger.info(`New site created: ${site.name} for entrepreneur: ${entrepreneurId}`);

    // Fetch the created site with all associations
    const createdSite = await Site.findByPk(site.id, {
      include: getBaseInclude()
    });

    res.status(201).json({
      message: 'האתר נוצר בהצלחה',
      site: createdSite
    });
  } catch (error) {
    logger.error('Error creating site:', error);
    next(error instanceof AppError ? error : new AppError('שגיאה ביצירת האתר', 500, 'SITE_CREATION_ERROR'));
  }
};

exports.getAllSites = async (req, res, next) => {
  try {
    let where = {};
    let include = getBaseInclude();
    
    if (req.user.role === 'entrepreneur') {
      where.entrepreneurId = req.user.id;
    }
    else if (['control_center', 'maintenance', 'integrator'].includes(req.user.role)) {
      include.push({
        model: Organization.scope('withActiveUsers'),
        as: 'serviceOrganizations',
        where: { id: req.user.organizationId },
        required: true
      });
    }
    else if (req.user.role === 'security_officer' || req.user.role === 'admin') {
    }

    const sites = await Site.findAll({
      where,
      include,
      order: [['name', 'ASC']]
    });

    res.json(sites);
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

    // Verify entrepreneur exists (including deleted)
    const entrepreneur = await User.scope('withDeleted').findByPk(entrepreneurId);
    if (!entrepreneur) {
      return next(new AppError('יזם לא נמצא', 404, 'ENTREPRENEUR_NOT_FOUND'));
    }

    const sites = await Site.findAll({
      where: { entrepreneurId },
      include: getBaseInclude(),
      order: [['name', 'ASC']]
    });

    res.json(sites);
  } catch (error) {
    logger.error('Error getting entrepreneur sites:', error);
    next(new AppError('שגיאה בשליפת האתרים', 500, 'SITES_FETCH_ERROR'));
  }
};

exports.getSite = async (req, res, next) => {
  try {
    const site = await Site.findByPk(req.params.id, {
      include: getBaseInclude()
    });

    if (!site) {
      return next(new AppError('אתר לא נמצא', 404, 'SITE_NOT_FOUND'));
    }

    // Check access permissions
    if (req.user.role === 'entrepreneur' && site.entrepreneurId !== req.user.id) {
      return next(new AppError('אין הרשאה לצפות באתר זה', 403, 'FORBIDDEN'));
    }

    res.json(site);
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

    const site = await Site.findByPk(req.params.id);
    if (!site) {
      return next(new AppError('אתר לא נמצא', 404, 'SITE_NOT_FOUND'));
    }

    const { 
      name, 
      type, 
      entrepreneurId,
      integratorOrganizationIds,
      maintenanceOrganizationIds,
      controlCenterOrganizationIds,
      customFields,
      notificationRecipientIds
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
    if (entrepreneurId) {
      await validateUser(entrepreneurId, 'entrepreneur', 'יזם');
      site.entrepreneurId = entrepreneurId;
    }

    // Update organizations
    if (integratorOrganizationIds !== undefined || maintenanceOrganizationIds !== undefined || controlCenterOrganizationIds !== undefined) {
      const integratorOrgs = await validateOrganizations(integratorOrganizationIds, 'integrator', 'ארגוני אינטגרציה');
      const maintenanceOrgs = await validateOrganizations(maintenanceOrganizationIds, 'maintenance', 'ארגוני אחזקה');
      const controlCenterOrgs = await validateOrganizations(controlCenterOrganizationIds, 'control_center', 'ארגוני מוקד');
      
      const organizationIds = [
        ...(integratorOrgs.map(org => org.id) || []),
        ...(maintenanceOrgs.map(org => org.id) || []),
        ...(controlCenterOrgs.map(org => org.id) || [])
      ];

      await site.setServiceOrganizations(organizationIds);
    }


    // Update notification recipients if provided
    if (notificationRecipientIds !== undefined) {
      const notificationRecipients = await validateNotificationRecipients(notificationRecipientIds);
      await site.setNotificationRecipients(notificationRecipients.map(user => user.id));
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
      include: getBaseInclude()
    });

    res.json({ 
      message: 'האתר עודכן בהצלחה', 
      site: updatedSite
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
