const { Organization, User, Site, sequelize } = require('../models');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const { ROLES } = require('../constants/roles');

exports.createOrganization = async (req, res, next) => {
  try {
    // Only admin can create organizations
    if (req.user.role !== 'admin') {
      return next(new AppError('אין הרשאה לבצע פעולה זו', 403, 'FORBIDDEN'));
    }

    const { name, type } = req.body;

    // Validate organization type - must be one of the roles except admin
    const validTypes = Object.values(ROLES).filter(role => role !== 'admin');
    if (!validTypes.includes(type)) {
      return next(new AppError('סוג ארגון לא תקין', 400, 'INVALID_ORGANIZATION_TYPE'));
    }

    // Check if organization already exists with same name and type
    const existingOrg = await Organization.findOne({
      where: {
        name,
        type
      }
    });
    if (existingOrg) {
      return next(new AppError('ארגון קיים במערכת', 400, 'ORGANIZATION_EXISTS'));
    }

    // Create organization
    const organization = await Organization.create({
      name,
      type
    });

    logger.info(`Organization created: ${name}, Type: ${type}`);
    res.status(201).json({
      message: 'ארגון נוצר בהצלחה',
      organization
    });
  } catch (error) {
    logger.error('Error creating organization:', error);
    next(new AppError('שגיאה ביצירת ארגון', 500));
  }
};

exports.getOrganizations = async (req, res, next) => {
  try {
    const { type } = req.query;
    const where = {};

    // Filter by type if provided
    if (type) {
      const validTypes = Object.values(ROLES).filter(role => role !== 'admin');
      if (!validTypes.includes(type)) {
        return next(new AppError('סוג ארגון לא תקין', 400, 'INVALID_ORGANIZATION_TYPE'));
      }
      where.type = type;
    }
    const organizations = await Organization.findAll({
      where,
      include: [{
        model: User,
        as: 'employees',
        where: {
          deletedAt: null,
          role: where.type
        },
        required: true,
        attributes: [] 
      }]
    });

    res.json(organizations);
  } catch (error) {
    logger.error('Error fetching organizations:', error);
    next(new AppError('שגיאה בשליפת ארגונים', 500));
  }
};

exports.getOrganizationsBySites = async (req, res, next) => {
  try {
    const { type } = req.params;
    const { siteIds } = req.query;

    logger.info(`Getting organizations for type: ${type} and sites: ${siteIds}`);

    // Validate organization type
    const validTypes = Object.values(ROLES).filter(role => role !== 'admin');
    if (!validTypes.includes(type)) {
      return next(new AppError('סוג ארגון לא תקין', 400, 'INVALID_ORGANIZATION_TYPE'));
    }

    // Validate siteIds
    if (!siteIds) {
      return next(new AppError('נדרשים מזהי אתרים', 400, 'SITE_IDS_REQUIRED'));
    }

    const siteIdsArray = siteIds.split(',').map(id => parseInt(id, 10));

    // Use scope to get organizations with active users of specific type
    const organizations = await Organization.scope('withActiveUsersOfType', type).findAll({
      where: {
        type,
        '$servicedSites.id$': { [Op.in]: siteIdsArray }
      },
      include: [{
        model: Site,
        as: 'servicedSites',
        attributes: [],
        through: { attributes: [] }
      }],
      attributes: ['id', 'name', 'type']
    });

    logger.info(`Found organizations:`, organizations);
    res.json(organizations);
  } catch (error) {
    logger.error('Error fetching organizations by sites:', error);
    next(new AppError('שגיאה בשליפת ארגונים', 500));
  }
};

exports.getOrganization = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Use scope to get organization with active users
    const organization = await Organization.scope('withActiveUsers').findByPk(id);

    if (!organization) {
      return next(new AppError('ארגון לא נמצא או אין לו משתמשים פעילים', 404, 'ORGANIZATION_NOT_FOUND'));
    }

    res.json(organization);
  } catch (error) {
    logger.error('Error fetching organization:', error);
    next(new AppError('שגיאה בשליפת ארגון', 500));
  }
};

exports.updateOrganization = async (req, res, next) => {
  try {
    // Only admin can update organizations
    if (req.user.role !== 'admin') {
      return next(new AppError('אין הרשאה לבצע פעולה זו', 403, 'FORBIDDEN'));
    }

    const { id } = req.params;
    const { name, type } = req.body;

    const organization = await Organization.findByPk(id);
    if (!organization) {
      return next(new AppError('ארגון לא נמצא', 404, 'ORGANIZATION_NOT_FOUND'));
    }

    // Check if new name already exists with same type (excluding current organization)
    if (name) {
      const existingOrg = await Organization.findOne({
        where: {
          name,
          type: type || organization.type,
          id: { [Op.ne]: id }
        }
      });
      if (existingOrg) {
        return next(new AppError('שם ארגון קיים במערכת', 400, 'ORGANIZATION_EXISTS'));
      }
    }

    // Validate type if provided
    if (type) {
      const validTypes = Object.values(ROLES).filter(role => role !== 'admin');
      if (!validTypes.includes(type)) {
        return next(new AppError('סוג ארגון לא תקין', 400, 'INVALID_ORGANIZATION_TYPE'));
      }
    }

    // Update organization
    await organization.update({ name, type });

    logger.info(`Organization updated: ${id}`);
    res.json({
      message: 'ארגון עודכן בהצלחה',
      organization
    });
  } catch (error) {
    logger.error('Error updating organization:', error);
    next(new AppError('שגיאה בעדכון ארגון', 500));
  }
};

exports.deleteOrganization = async (req, res, next) => {
  try {
    // Only admin can delete organizations
    if (req.user.role !== 'admin') {
      return next(new AppError('אין הרשאה לבצע פעולה זו', 403, 'FORBIDDEN'));
    }

    const { id } = req.params;

    const organization = await Organization.findByPk(id);
    if (!organization) {
      return next(new AppError('ארגון לא נמצא', 404, 'ORGANIZATION_NOT_FOUND'));
    }

    // Check if organization has active employees
    const employeeCount = await User.count({ 
      where: { 
        organizationId: id,
        deletedAt: null
      } 
    });
    if (employeeCount > 0) {
      return next(new AppError('לא ניתן למחוק ארגון שיש לו עובדים פעילים', 400, 'ORGANIZATION_HAS_EMPLOYEES'));
    }

    // Delete organization
    await organization.destroy();

    logger.info(`Organization deleted: ${id}`);
    res.json({
      message: 'ארגון נמחק בהצלחה'
    });
  } catch (error) {
    logger.error('Error deleting organization:', error);
    next(new AppError('שגיאה במחיקת ארגון', 500));
  }
};
