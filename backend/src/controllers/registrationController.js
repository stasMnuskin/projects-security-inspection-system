const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const { getActiveSecrets } = require('../utils/secretManager');
const { sendRegistrationLink, sendRegistrationComplete } = require('../utils/emailService');
const { Op } = require('sequelize');

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

    const { email, firstName, lastName, organization, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return next(new AppError('משתמש קיים במערכת', 400, 'USER_ALREADY_EXISTS'));
    }

    // Validate role
    const validRoles = ['admin', 'security_officer', 'entrepreneur', 'integrator', 'maintenance', 'control_center'];
    if (!validRoles.includes(role)) {
      return next(new AppError('תפקיד לא תקין', 400, 'INVALID_ROLE'));
    }

    // For integrator and maintenance roles, validate organization exists
    if (role === 'integrator' || role === 'maintenance') {
      if (!organization) {
        return next(new AppError('נדרש שם ארגון למשתמש מסוג אינטגרטור או אחזקה', 400, 'ORGANIZATION_REQUIRED'));
      }

      // Check if organization exists (entrepreneur with this organization name)
      const entrepreneurExists = await User.findOne({
        where: {
          role: 'entrepreneur',
          organization: organization
        }
      });

      if (!entrepreneurExists) {
        return next(new AppError('הארגון שצוין אינו קיים במערכת', 400, 'INVALID_ORGANIZATION'));
      }
    }

    // Get default permissions for role
    const defaultPermissions = await User.getDefaultPermissions(role);
    
    // Create user with role and default permissions
    const user = await User.create({
      email,
      firstName,
      lastName,
      organization,
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
      firstName: user.firstName,
      organization: user.organization,
      token
    });

    logger.info(`Registration initiated for: ${email}, Role: ${role}, Organization: ${organization}, Permissions: ${defaultPermissions.join(', ')}`);
    res.status(200).json({ 
      message: 'קישור הרשמה נשלח בהצלחה',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        organization: user.organization,
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
    const user = await User.findOne({ where: { email } });
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
        firstName: user.firstName,
        organization: user.organization
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

    const { email, firstName, lastName, password, token } = req.body;

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
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return next(new AppError('משתמש לא נמצא', 404, 'USER_NOT_FOUND'));
    }

    // Check if registration is already completed
    if (user.password) {
      return next(new AppError('ההרשמה כבר הושלמה', 400, 'REGISTRATION_COMPLETED'));
    }

    // Update user with password to complete registration
    user.firstName = firstName;
    user.lastName = lastName;
    user.password = password;
    await user.save();

    // Send registration completion email
    await sendRegistrationComplete({
      email: user.email,
      firstName: user.firstName,
      organization: user.organization
    });

    logger.info(`Registration completed for user: ${email}`);
    res.status(200).json({
      message: 'הרשמה הושלמה בהצלחה',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        organization: user.organization,
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

// Helper function to get organizations (used by frontend autocomplete)
exports.getOrganizations = async (req, res, next) => {
  try {
    const organizations = await User.findAll({
      attributes: ['organization'],
      where: {
        role: 'entrepreneur',
        organization: {
          [Op.not]: null
        }
      },
      group: ['organization']
    });

    res.json(organizations.map(u => u.organization));
  } catch (error) {
    logger.error('Error fetching organizations:', error);
    next(new AppError('שגיאה בשליפת ארגונים', 500));
  }
};
