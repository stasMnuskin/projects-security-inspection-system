const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const { User, sequelize } = require('../models');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const { getActiveSecrets } = require('../utils/secretManager')

const activeSecrets = getActiveSecrets();

exports.registerUser = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;

    if (!['security_officer', 'admin'].includes(role)) {
      return next(new AppError('Invalid role', 400, 'INVALID_ROLE'));
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return next(new AppError('User already exists', 400, 'USER_ALREADY_EXISTS'));
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role
    });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      activeSecrets[0],
      { expiresIn: '1d' }
    );
    
    res.status(201).json({ token, role: user.role });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return next(new AppError('Username or email already exists', 400, 'DUPLICATE_USER'));
    }
    next(new AppError('Error registering user', 500, 'REGISTRATION_ERROR'));
  }
};

exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return next(new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS'));
    }

    console.log('Stored password:', user.password);
    console.log('Provided password:', password);


    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS'));
    }
    console.log('Password match:', isMatch);
    const token = jwt.sign(
      { id: user.id, role: user.role },
      activeSecrets[0],
      { expiresIn: '1d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    res.json({ 
      token, 
      role: user.role, 
      passwordChangeRequired: user.passwordChangeRequired 
    });
  } catch (error) {
    console.error('Login error:', error);
    next(new AppError('Error logging in', 500, 'LOGIN_ERROR'));
  }
};

exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    if (!user) return next(new AppError('User not found', 404));
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const [updatedRows] = await User.update(req.body, {
      where: { id: req.user.id },
      returning: true
    });
    if (updatedRows === 0) return next(new AppError('User not found', 404));
    res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    });
    res.json(users);
  } catch (error) {
    next(new AppError('Error fetching users', 500));
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
    }

    await user.destroy();
    logger.info(`User deleted: ${user.email}`);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    logger.error(`Delete user error: ${err.message}`);
    next(new AppError('Server error', 500, 'SERVER_ERROR', true, err));
  }
};

exports.changeUserRole = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation error', 400, 'VALIDATION_ERROR', true, errors.array()));
  }

  const { role } = req.body;

  try {
    let user = await User.findByPk(req.params.id);
    if (!user) {
      return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
    }

    user.role = role;
    await user.save();

    logger.info(`User role changed: ${user.email}, New role: ${role}`);
    res.json({ message: 'User role updated successfully' });
  } catch (err) {
    logger.error(`Change user role error: ${err.message}`);
    next(new AppError('Server error', 500, 'SERVER_ERROR', true, err));
  }
};

exports.logoutUser = async (req, res, next) => {
  try {
    logger.info('Logout process started');

    logger.info(`Current cookies: ${JSON.stringify(req.cookies)}`);

    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    logger.info('Token cookie cleared');

    logger.info(`Updated cookies: ${JSON.stringify(req.cookies)}`);

    logger.info('User logged out successfully');
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error:', error);
    next(new AppError('Error logging out', 500, 'LOGOUT_ERROR'));
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return next(new AppError('Current password is incorrect', 400, 'INVALID_PASSWORD'));
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.passwordChangeRequired = false;
    await user.save();

    res.json({ 
      message: 'Password changed successfully',
      role: user.role
    });
  } catch (error) {
    next(new AppError('Error changing password', 500, 'CHANGE_PASSWORD_ERROR'));
  }
};

exports.checkUsersAndResetSequence = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: ['id'],
      order: [['id', 'DESC']],
    });

    logger.info(`Existing users: ${JSON.stringify(users)}`);

    if (users.length > 0) {
      const maxId = users[0].id;
      const resetQuery = `ALTER SEQUENCE "Users_id_seq" RESTART WITH ${maxId + 1}`;
      await sequelize.query(resetQuery);
      logger.info(`Sequence reset to ${maxId + 1}`);
    }

    res.json({ message: 'User check completed and sequence reset if necessary' });
  } catch (error) {
    logger.error('Error checking users and resetting sequence:', error);
    next(new AppError('Error checking users', 500, 'USER_CHECK_ERROR'));
  }
};