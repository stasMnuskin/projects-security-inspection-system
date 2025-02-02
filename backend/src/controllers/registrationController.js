const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { User, Organization, sequelize } = require('../models');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const { getActiveSecrets } = require('../utils/secretManager');
const { sendRegistrationLink, sendRegistrationComplete } = require('../utils/emailService');
const { ROLES } = require('../constants/roles');

const activeSecrets = getActiveSecrets();

exports.generateRegistrationLink = async (req, res, next) => {
  try {
    // Only admin can generate registration links
    if (req.user.role !== 'admin') {
      return next(new AppError('אין הרשאה לבצע פעולה זו', 403, 'FORBIDDEN'));
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('שגיאת אימות', 400, 'VALIDATION_ERROR', true, errors.array()));
    }

    const { email, name, organizationName, role } = req.body;

    const transaction = await sequelize.transaction();
    
    try {
      // Check if user exists (including soft-deleted users)
      const existingUser = await User.scope('withDeleted').findOne({ 
        where: { email },
        transaction
      });
      
      if (existingUser) {
        if (existingUser.deletedAt) {
          // If user was soft-deleted, perform hard delete
          await existingUser.destroy({ force: true, transaction });
          logger.info(`Hard deleted previously soft-deleted user: ${email}`);
        } else {
          await transaction.rollback();
          return next(new AppError('משתמש קיים במערכת', 400, 'USER_ALREADY_EXISTS'));
        }
      }
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    // Validate role
    const validRoles = Object.values(ROLES);
    if (!validRoles.includes(role)) {
      return next(new AppError('תפקיד לא תקין', 400, 'INVALID_ROLE'));
    }

    // Organization is required for all roles
    if (!organizationName) {
      return next(new AppError('נדרש שם ארגון', 400, 'ORGANIZATION_REQUIRED'));
    }

    let organizationId = null;

    // Handle organization creation/validation
    let organization = await Organization.findOne({
      where: { 
        name: organizationName,
        type: role
      }
    });

    if (!organization) {
      // Create new organization with type based on user role
      organization = await Organization.create({
        name: organizationName,
        type: role
      });
      logger.info(`Created new organization: ${organizationName}, Type: ${role}`);
    } else {
      // Validate organization type matches user role
      if (organization.type !== role) {
        return next(new AppError('סוג הארגון אינו תואם לתפקיד המשתמש', 400, 'ORGANIZATION_TYPE_MISMATCH'));
      }
    }

    organizationId = organization.id;

    // Get default permissions for role
    const defaultPermissions = await User.getDefaultPermissions(role);
    
    // Create user with role and default permissions
    const user = await User.create({
      email,
      name,
      organizationId,
      role,
      permissions: defaultPermissions,
      password: null
    });

    // Generate token with user data
    const token = jwt.sign({
      email: user.email,
      userId: user.id,
      selectedRole: role,
      permissions: defaultPermissions
    }, activeSecrets[0], { expiresIn: '24h' });

    // Send registration link via email
    await sendRegistrationLink({
      email: user.email,
      name: user.name,
      token
    });

    logger.info(`Registration initiated for: ${email}, Role: ${role}, Organization: ${organizationName}, Permissions: ${defaultPermissions.join(', ')}`);
    res.status(200).json({ 
      message: 'קישור הרשמה נשלח בהצלחה',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        organizationId: user.organizationId,
        organizationName,
        role: role,
        permissions: defaultPermissions
      }
    });
  } catch (error) {
    logger.error('Error generating registration link:', error);
    next(new AppError('שגיאה בשליחת קישור הרשמה', 500, 'REGISTRATION_LINK_ERROR'));
  }
};

exports.validateRegistrationToken = async (req, res, next) => {
  try {
    const { email, token } = req.query;

    if (!email || !token) {
      return next(new AppError('חסרים פרטים נדרשים', 400, 'MISSING_PARAMS'));
    }

    // Check if user exists
    const user = await User.findOne({
      where: { email },
      include: [{
        model: Organization,
        as: 'organization',
        attributes: ['name']
      }]
    });

    if (!user) {
      return next(new AppError('משתמש לא נמצא', 404, 'USER_NOT_FOUND'));
    }

    // Check if registration is already completed (user has password)
    if (user.password) {
      return next(new AppError('ההרשמה כבר הושלמה', 400, 'REGISTRATION_COMPLETED'));
    }

    // Verify token and check user data
    try {
      const decoded = jwt.verify(token, activeSecrets[0]);
      if (decoded.email !== email || decoded.userId !== user.id) {
        return next(new AppError('קישור הרשמה לא תקין', 400, 'INVALID_TOKEN'));
      }
    } catch (error) {
      return next(new AppError('קישור הרשמה לא תקין או שפג תוקפו', 400, 'INVALID_TOKEN'));
    }

    res.status(200).json({ 
      message: 'קישור הרשמה תקין',
      user: {
        email: user.email,
        name: user.name,
        organizationName: user.organization?.name
      }
    });
  } catch (error) {
    logger.error('Error validating registration token:', error);
    next(new AppError('שגיאה באימות קישור הרשמה', 500, 'TOKEN_VALIDATION_ERROR'));
  }
};

exports.registerUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('שגיאת אימות', 400, 'VALIDATION_ERROR', true, errors.array()));
    }

    const { email, password, token } = req.body;

    // Verify token and get stored data
    let decoded;
    try {
      decoded = jwt.verify(token, activeSecrets[0]);
      if (decoded.email !== email) {
        return next(new AppError('קישור הרשמה לא תקין', 400, 'INVALID_TOKEN'));
      }
    } catch (error) {
      return next(new AppError('קישור הרשמה לא תקין או שפג תוקפו', 400, 'INVALID_TOKEN'));
    }

    // Find user
    const user = await User.findOne({
      where: { email },
      include: [{
        model: Organization,
        as: 'organization',
        attributes: ['name']
      }]
    });

    if (!user) {
      return next(new AppError('משתמש לא נמצא', 404, 'USER_NOT_FOUND'));
    }

    // Check if registration is already completed
    if (user.password) {
      return next(new AppError('ההרשמה כבר הושלמה', 400, 'REGISTRATION_COMPLETED'));
    }

    // Check if this will be the last user in the organization
    const userCount = await User.count({
      where: { 
        organizationId: user.organizationId,
        deletedAt: null,
        id: { [sequelize.Op.ne]: user.id }
      }
    });

    // If this is the last user, delete the organization
    if (userCount === 0) {
      await Organization.destroy({
        where: { id: user.organizationId }
      });
      logger.info(`Deleted organization ${user.organizationId} as it has no more active users`);
    }

    // Hash the password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user with hashed password to complete registration
    user.password = hashedPassword;
    await user.save();

    // Send registration completion email
    await sendRegistrationComplete({
      email: user.email,
      name: user.name,
      organizationName: user.organization?.name
    });

    logger.info(`Registration completed for user: ${email}`);
    res.status(200).json({
      message: 'הרשמה הושלמה בהצלחה',
      user: {
        id: user.id,
        name: user.name,
        organizationId: user.organizationId,
        organizationName: user.organization?.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (error) {
    logger.error('Error completing registration:', error);
    next(new AppError('שגיאה בהשלמת ההרשמה', 500, 'REGISTRATION_ERROR'));
  }
};

exports.getOrganizations = async (req, res, next) => {
  try {
    const { type } = req.query;

    // If no type specified or invalid type, return empty array
    if (!type || !Object.values(ROLES).includes(type)) {
      return res.json([]);
    }

    // Use scope to get organizations with active users of the specified role
    const organizations = await Organization.scope(type).findAll();

    // Format response
    const formattedOrganizations = organizations.map(org => ({
      id: org.id,
      name: org.name,
      type: org.type,
      activeUsers: org.employees.length,
      employees: org.employees
    }));

    res.json(formattedOrganizations);
  } catch (error) {
    logger.error('Error fetching organizations:', error);
    next(new AppError('שגיאה בשליפת ארגונים', 500));
  }
};
