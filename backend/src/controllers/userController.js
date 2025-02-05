const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const { User, Site, Organization, Fault, Inspection, Notification, SiteNotificationRecipients, sequelize } = require('../models');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const { getActiveSecrets } = require('../utils/secretManager');
const { sendPasswordResetEmail, sendPasswordResetConfirmation } = require('../utils/emailService');
const { Op } = require('sequelize');
const { ROLES, PERMISSIONS, ROLE_TRANSLATIONS } = require('../constants/roles');

const activeSecrets = getActiveSecrets();

exports.getOrganizations = async (req, res, next) => {
  try {
    const organizations = await Organization.findAll({
      attributes: ['id', 'name', 'type'],
      order: [['name', 'ASC']]
    });
    res.json(organizations);
  } catch (error) {
    logger.error('Error fetching organizations:', error);
    next(new AppError('שגיאה בשליפת ארגונים', 500, 'ORGANIZATIONS_FETCH_ERROR'));
  }
};

exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    logger.info(`Login attempt for email: ${email}`);

    // Find user with organization data
    const user = await User.findOne({ 
      where: { email },
      include: [{
        model: Organization,
        as: 'organization',
        attributes: ['id', 'name', 'type']
      }]
    });

    if (!user) {
      logger.warn(`Login failed: User not found for email: ${email}`);
      return next(new AppError('אימייל או סיסמה שגויים', 401, 'INVALID_CREDENTIALS'));
    }

    // Check if registration is incomplete
    if (!user.password) {
      logger.warn(`Login failed: Registration incomplete for ${email}`);
      return next(new AppError('נדרש להשלים את תהליך ההרשמה', 403, 'REGISTRATION_INCOMPLETE'));
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn(`Login failed: Invalid password for email: ${email}`);
      return next(new AppError('אימייל או סיסמה שגויים', 401, 'INVALID_CREDENTIALS'));
    }

    // If user is entrepreneur, fetch their sites
    let sites = [];
    if (user.role === 'entrepreneur') {
      const userWithSites = await User.findByPk(user.id, {
        include: [{
          model: Site,
          as: 'sites',
          attributes: ['id', 'name', 'type']
        }]
      });
      sites = userWithSites.sites || [];
    }

    // Create token with user data
    const token = jwt.sign(
      { 
        id: user.id, 
        role: user.role,
        permissions: user.permissions,
        email: user.email
      },
      activeSecrets[0],
      { expiresIn: '1d' }
    );

    // Set token in cookie and header
    const isSecure = process.env.API_URL.startsWith('https');
    res.cookie('token', token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });
    res.setHeader('x-auth-token', token);

    logger.info(`Login successful for user: ${user.email}`);
    res.json({ 
      token, 
      role: user.role,
      name: user.name,
      email: user.email,
      permissions: user.permissions,
      organization: user.organization,
      sites,
      passwordChangeRequired: user.passwordChangeRequired
    });
  } catch (error) {
    logger.error('Login error:', error);
    next(new AppError('שגיאה בהתחברות למערכת', 500, 'LOGIN_ERROR'));
  }
};

exports.getCurrentUser = async (req, res, next) => {
  try {
    const include = [{
      model: Organization,
      as: 'organization',
      attributes: ['id', 'name', 'type']
    }];
    
    if (req.user.role === 'entrepreneur') {
      include.push({
        model: Site,
        as: 'sites',
        attributes: ['id', 'name', 'type']
      });
    }

    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include
    });

    if (!user) {
      return next(new AppError('משתמש לא נמצא', 404, 'USER_NOT_FOUND'));
    }

    // Get user's permissions based on role
    let permissions;
    if (user.role === 'admin') {
      permissions = Object.values(PERMISSIONS);
    } else {
      const rolePermissions = await User.getRolePermissions(user.role);
      permissions = rolePermissions;
    }

    // Add permissions to user object
    const userWithPermissions = user.toJSON();
    userWithPermissions.permissions = permissions;

    res.status(200).json(userWithPermissions);
  } catch (error) {
    logger.error('Get current user error:', error);
    next(new AppError('שגיאה בשליפת פרטי משתמש', 500, 'USER_FETCH_ERROR'));
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      where: {
        deletedAt: null // Explicitly exclude soft-deleted users
      },
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Site,
          as: 'sites',
          attributes: ['id', 'name', 'type']
        },
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name', 'type']
        }
      ]
    });
    res.json(users);
  } catch (error) {
    logger.error('Get all users error:', error);
    next(new AppError('שגיאה בשליפת משתמשים', 500, 'USERS_FETCH_ERROR'));
  }
};

exports.getEntrepreneurs = async (req, res, next) => {
  try {
    const users = await User.findAll({
      where: { 
        role: ROLES.entrepreneur,
        deletedAt: null // Explicitly exclude soft-deleted users
      },
      attributes: ['id', 'name', 'email'],
      include: [
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name', 'type']
        },
        {
          model: Site,
          as: 'sites',
          attributes: ['id', 'name', 'type']
        }
      ]
    });
    res.json(users);
  } catch (error) {
    logger.error('Error fetching entrepreneurs:', error);
    next(new AppError('שגיאה בשליפת יזמים', 500));
  }
};

exports.getSecurityOfficers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      where: { 
        role: 'security_officer',
        deletedAt: null // Explicitly exclude soft-deleted users
      },
      attributes: ['id', 'name']
    });
    res.json(users);
  } catch (error) {
    logger.error('Error fetching security officers:', error);
    next(new AppError('שגיאה בשליפת קציני ביטחון', 500));
  }
};

exports.getMaintenanceStaff = async (req, res, next) => {
  try {
    const whereClause = { 
      role: 'maintenance',
      deletedAt: null // Explicitly exclude soft-deleted users
    };
    
    // For integrator/maintenance users, only show users from their organization
    if ((req.user.role === 'integrator' || req.user.role === 'maintenance' || req.user.role === 'entrepreneur') 
        && req.user.organizationId) {
      whereClause.organizationId = req.user.organizationId;
    }
    // For admin/security_officer/control_center, use query param if provided
    else if (req.query.organizationId) {
      whereClause.organizationId = req.query.organizationId;
    }

    const users = await User.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'organizationId']
    });
    res.json(users);
  } catch (error) {
    logger.error('Error fetching maintenance staff:', error);
    next(new AppError('שגיאה בשליפת צוות אחזקה', 500));
  }
};

exports.getIntegrators = async (req, res, next) => {
  try {
    const whereClause = { 
      role: 'integrator',
      deletedAt: null 
    };
    
    // For integrator/maintenance users, only show users from their organization
    if ((req.user.role === 'integrator' || req.user.role === 'maintenance' || req.user.role === 'entrepreneur') 
        && req.user.organizationId) {
      whereClause.organizationId = req.user.organizationId;
    }
    // For admin/security_officer/control_center, use query param if provided
    else if (req.query.organizationId) {
      whereClause.organizationId = req.query.organizationId;
    }

    const users = await User.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'organizationId']
    });
    res.json(users);
  } catch (error) {
    logger.error('Error fetching integrators:', error);
    next(new AppError('שגיאה בשליפת אינטגרטורים', 500));
  }
};

exports.updateUserDetails = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('שגיאת אימות', 400, 'VALIDATION_ERROR', true, errors.array()));
    }

    const { name, email, organizationId, role } = req.body;
    const userId = req.params.id;

    // Log initial request
    logger.info(`Starting user update for ID ${userId}:`, {
      requestData: {
        name,
        email,
        organizationId,
        role
      }
    });

    // Find the user with organization
    const user = await User.findByPk(userId, {
      include: [{
        model: Organization,
        as: 'organization',
        attributes: ['id', 'name', 'type']
      }],
      transaction
    });
    
    if (!user) {
      await transaction.rollback();
      return next(new AppError('משתמש לא נמצא', 404, 'USER_NOT_FOUND'));
    }

    // Log current user state
    logger.info(`Current user state:`, {
      userId,
      currentRole: user.role,
      currentOrganizationId: user.organizationId,
      currentOrganizationName: user.organization?.name
    });

    // Check if email is being changed and if it's already in use
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ 
        where: { email },
        transaction
      });
      if (existingUser) {
        await transaction.rollback();
        return next(new AppError('כתובת האימייל כבר קיימת במערכת', 400, 'EMAIL_EXISTS'));
      }
    }

    // If role is being changed, get the default permissions for the new role
    let permissions = user.permissions;
    if (role && role !== user.role) {
      permissions = await User.getDefaultPermissions(role);
    }

    const updateData = {
      name: name || user.name,
      email: email || user.email,
      organizationId: organizationId !== undefined ? organizationId : user.organizationId,
      role: role || user.role,
      permissions
    };

    // Log update attempt
    logger.info(`Attempting to update user with data:`, updateData);

    // Handle organization update
    if (req.body.organization?.name && user.role !== 'admin') {
      // Check if organization exists with same name and type
      const existingOrg = await Organization.findOne({
        where: { 
          name: req.body.organization.name,
          type: user.role
        },
        transaction
      });

      if (existingOrg) {
        await transaction.rollback();
        return next(new AppError('ארגון קיים במערכת', 400, 'ORGANIZATION_EXISTS'));
      }

      // Create new organization
      const newOrg = await Organization.create({
        name: req.body.organization.name,
        type: user.role
      }, { transaction });
      
      updateData.organizationId = newOrg.id;
      logger.info(`Created new organization:`, {
        id: newOrg.id,
        name: newOrg.name,
        type: newOrg.type
      });
    }

    // Update user within transaction
    await user.update(updateData, { transaction });

    // Force reload within transaction to ensure we have latest data
    await user.reload({ transaction });

    // Fetch updated user with organization
    const updatedUser = await User.findByPk(userId, {
      include: [{
        model: Organization,
        as: 'organization',
        attributes: ['id', 'name', 'type'],
        required: false
      }],
      transaction
    });

    if (!updatedUser) {
      await transaction.rollback();
      throw new Error('Failed to fetch updated user data');
    }

    // Verify organization update if needed
    if (req.body.organization?.name && 
        (!updatedUser.organization || updatedUser.organization.name !== req.body.organization.name)) {
      await transaction.rollback();
      logger.error('Organization name update verification failed', {
        expected: req.body.organization.name,
        actual: updatedUser.organization?.name
      });
      throw new Error('Failed to update organization name');
    }

    // Log final state before commit
    logger.info(`Final user state before commit:`, {
      userId: updatedUser.id,
      role: updatedUser.role,
      organizationId: updatedUser.organizationId,
      organizationName: updatedUser.organization?.name
    });

    await transaction.commit();

    // Log successful update
    logger.info(`User update completed successfully for ID ${userId}`);
    res.json({ 
      message: 'המשתמש עודכן בהצלחה',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        organizationId: updatedUser.organizationId,
        organization: updatedUser.organization,
        role: updatedUser.role,
        permissions: updatedUser.permissions
      }
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('Error updating user:', {
      error: error.message,
      stack: error.stack,
      userId: req.params.id,
      requestData: req.body
    });
    
    // Check for specific validation errors
    if (error.name === 'SequelizeValidationError') {
      return next(new AppError(error.message, 400, 'VALIDATION_ERROR'));
    }
    
    next(new AppError('שגיאה בעדכון המשתמש', 500, 'USER_UPDATE_ERROR'));
  }
};

exports.deleteUser = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return next(new AppError('משתמש לא נמצא', 404, 'USER_NOT_FOUND'));
    }

    // Clear user references in Sites
    await Site.update(
      {
        entrepreneurId: null
      },
      {
        where: {
          entrepreneurId: user.id
        },
        transaction
      }
    );

    // Clear user references in Faults
    await Fault.update(
      {
        maintenanceUserId: null,
        integratorUserId: null
      },
      {
        where: {
          [Op.or]: [
            { maintenanceUserId: user.id },
            { integratorUserId: user.id }
          ]
        },
        transaction
      }
    );

    // Clear user references in Inspections
    await Inspection.update(
      { userId: null },
      {
        where: { userId: user.id },
        transaction
      }
    );

    // Delete user's notifications
    await Notification.destroy({
      where: { userId: user.id },
      transaction
    });

    // Remove user from site notification recipients
    await SiteNotificationRecipients.destroy({
      where: { userId: user.id },
      transaction
    });

    // Soft delete the user
    await user.destroy({ transaction });

    await transaction.commit();
    logger.info(`User deleted and all references cleared: ${user.email}`);
    res.json({ message: 'משתמש נמחק בהצלחה' });
  } catch (error) {
    await transaction.rollback();
    logger.error('Error deleting user:', error);
    next(new AppError('שגיאה במחיקת המשתמש', 500, 'USER_DELETE_ERROR'));
  }
};

exports.logoutUser = async (req, res, next) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    logger.info('User logged out successfully');
    res.status(200).json({ message: 'התנתקת מהמערכת בהצלחה' });
  } catch (error) {
    logger.error('Logout error:', error);
    next(new AppError('שגיאה בהתנתקות מהמערכת', 500, 'LOGOUT_ERROR'));
  }
};

exports.requestPasswordReset = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('שגיאת אימות', 400, 'VALIDATION_ERROR', true, errors.array()));
    }

    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    // Don't reveal if user exists or not
    if (user) {
      const resetToken = jwt.sign(
        { 
          email: user.email,
          id: user.id,
          type: 'password_reset'
        },
        activeSecrets[0],
        { expiresIn: '1h' }
      );

      await sendPasswordResetEmail(email, resetToken);
      logger.info(`Password reset email sent to: ${email}`);
    }

    res.json({ message: 'אם האימייל קיים במערכת, נשלחו הוראות לאיפוס סיסמה' });
  } catch (error) {
    logger.error('Password reset request error:', error);
    next(new AppError('שגיאה בבקשה לאיפוס סיסמה', 500, 'RESET_REQUEST_ERROR'));
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('שגיאת אימות', 400, 'VALIDATION_ERROR', true, errors.array()));
    }

    const { email, password, token } = req.body;

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, activeSecrets[0]);
      if (decoded.type !== 'password_reset' || decoded.email !== email) {
        return next(new AppError('קישור לא תקין', 400, 'INVALID_RESET_TOKEN'));
      }
    } catch (error) {
      return next(new AppError('קישור לא תקין או שפג תוקפו', 400, 'INVALID_RESET_TOKEN'));
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return next(new AppError('משתמש לא נמצא', 404, 'USER_NOT_FOUND'));
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Update user
    user.password = hashedPassword;
    user.passwordChangeRequired = false;
    await user.save();

    // Send confirmation email
    await sendPasswordResetConfirmation(user);

    logger.info(`Password reset completed for user: ${email}`);
    res.json({ message: 'הסיסמה אופסה בהצלחה' });
  } catch (error) {
    logger.error('Password reset error:', error);
    next(new AppError('שגיאה באיפוס הסיסמה', 500, 'RESET_ERROR'));
  }
};


exports.getRolePermissions = async (req, res, next) => {
  try {
    const { role } = req.params;
    if (!role) {
      return next(new AppError('נדרש לציין תפקיד', 400));
    }

    let currentPermissions;
    if (role === 'admin') {
      currentPermissions = Object.values(PERMISSIONS);
    } else {
      currentPermissions = await User.getRolePermissions(role);
    }
    
    // Get all available permissions to show what can be added/removed
    const availablePermissions = Object.values(PERMISSIONS);
    
    res.json({
      success: true,
      data: {
        role,
        currentPermissions,
        availablePermissions,
        // Show which permissions can be added (not currently assigned)
        addablePermissions: availablePermissions.filter(p => !currentPermissions.includes(p)),
        // Show which permissions can be removed (currently assigned)
        removablePermissions: currentPermissions
      }
    });
  } catch (error) {
    logger.error('Error getting role permissions:', error);
    next(new AppError('שגיאה בטעינת הרשאות', 500));
  }
};

exports.getAllRolePermissions = async (req, res, next) => {
  try {
    const roles = Object.values(ROLES);
    const allPermissions = {};

    // Get permissions for each role
    for (const role of roles) {
      if (role === 'admin') {
        // Admin has all permissions
        allPermissions[role] = Object.values(PERMISSIONS);
      } else {
        const permissions = await User.getRolePermissions(role);
        allPermissions[role] = permissions;
      }
    }
    
    res.json({
      success: true,
      data: {
        roles: allPermissions,
        availablePermissions: Object.values(PERMISSIONS)
      }
    });
  } catch (error) {
    logger.error('Error getting all role permissions:', error);
    next(new AppError('שגיאה בטעינת הרשאות', 500));
  }
};

exports.updateRolePermissions = async (req, res, next) => {
  try {
    const { role } = req.params;
    const { permissions } = req.body;

    if (!role) {
      return next(new AppError('נדרש לציין תפקיד', 400));
    }

    // Don't allow modifying admin permissions
    if (role === 'admin') {
      return next(new AppError('לא ניתן לשנות הרשאות מנהל מערכת', 403));
    }

    // Validate permissions
    const validPermissions = Object.values(PERMISSIONS);
    const invalidPermissions = permissions.filter(p => !validPermissions.includes(p));
    if (invalidPermissions.length > 0) {
      return next(new AppError(`הרשאות לא תקינות: ${invalidPermissions.join(', ')}`, 400));
    }

    // Update permissions and get result
    const result = await User.updateRolePermissions(role, permissions);
    
    res.json({
      success: true,
      message: `הרשאות עודכנו בהצלחה עבור תפקיד: ${ROLE_TRANSLATIONS[role] || role}`,
      data: {
        role,
        newPermissions: permissions,
        changes: result.changes,
        usersUpdated: result.usersUpdated
      }
    });
  } catch (error) {
    logger.error('Error updating role permissions:', error);
    if (error.message === 'Cannot modify admin permissions') {
      next(new AppError('לא ניתן לשנות הרשאות מנהל מערכת', 403));
    } else {
      next(new AppError('שגיאה בעדכון הרשאות', 500));
    }
  }
};

exports.getUsersByRole = async (req, res, next) => {
  try {
    const { role } = req.query;
    if (!role || !Object.values(ROLES).includes(role)) {
      return next(new AppError('סוג משתמש לא תקין', 400));
    }

    const users = await User.findAll({
      where: { 
        role,
        deletedAt: null // Explicitly exclude soft-deleted users
      },
      attributes: ['id', 'name', 'email'],
      include: [{
        model: Organization,
        as: 'organization',
        attributes: ['id', 'name', 'type']
      }]
    });

    res.json(users);
  } catch (error) {
    logger.error('Error fetching users by role:', error);
    next(new AppError('שגיאה בשליפת משתמשים', 500));
  }
};

module.exports = exports;
