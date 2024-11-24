const { Organization, User } = require('../models');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

exports.createOrganization = async (req, res, next) => {
  try {
    // Only admin can create organizations
    if (req.user.role !== 'admin') {
      return next(new AppError('אין הרשאה לבצע פעולה זו', 403, 'FORBIDDEN'));
    }

    const { name, type } = req.body;

    // Validate organization type
    if (!['integrator', 'maintenance'].includes(type)) {
      return next(new AppError('סוג ארגון לא תקין', 400, 'INVALID_ORGANIZATION_TYPE'));
    }

    // Check if organization already exists
    const existingOrg = await Organization.findOne({ where: { name } });
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
      if (!['integrator', 'maintenance'].includes(type)) {
        return next(new AppError('סוג ארגון לא תקין', 400, 'INVALID_ORGANIZATION_TYPE'));
      }
      where.type = type;
    }

    const organizations = await Organization.findAll({
      where,
      include: [{
        model: User,
        as: 'employees',
        attributes: ['id', 'name', 'email', 'role']
      }]
    });

    res.json(organizations);
  } catch (error) {
    logger.error('Error fetching organizations:', error);
    next(new AppError('שגיאה בשליפת ארגונים', 500));
  }
};

exports.getOrganization = async (req, res, next) => {
  try {
    const { id } = req.params;

    const organization = await Organization.findByPk(id, {
      include: [{
        model: User,
        as: 'employees',
        attributes: ['id', 'name', 'email', 'role']
      }]
    });

    if (!organization) {
      return next(new AppError('ארגון לא נמצא', 404, 'ORGANIZATION_NOT_FOUND'));
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
    const { name } = req.body;

    const organization = await Organization.findByPk(id);
    if (!organization) {
      return next(new AppError('ארגון לא נמצא', 404, 'ORGANIZATION_NOT_FOUND'));
    }

    // Check if new name already exists (excluding current organization)
    if (name) {
      const existingOrg = await Organization.findOne({
        where: {
          name,
          id: { [Op.ne]: id }
        }
      });
      if (existingOrg) {
        return next(new AppError('שם ארגון קיים במערכת', 400, 'ORGANIZATION_EXISTS'));
      }
    }

    // Update organization
    await organization.update({ name });

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

    // Check if organization has employees
    const employeeCount = await User.count({ where: { organizationId: id } });
    if (employeeCount > 0) {
      return next(new AppError('לא ניתן למחוק ארגון שיש לו עובדים', 400, 'ORGANIZATION_HAS_EMPLOYEES'));
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
