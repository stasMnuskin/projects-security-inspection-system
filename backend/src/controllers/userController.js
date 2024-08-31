const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const { User } = require('../models');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const { getActiveSecrets } = require('../utils/secretManager')

exports.registerUser = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;

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
    const activeSecrets = getActiveSecrets();
    const token = jwt.sign(
      { id: user.id, role: user.role },
      activeSecrets[0],
      { expiresIn: '1d' }
    );

    logger.info(`New user registered: ${email}`);
    res.status(201).json({ token });
  } catch (error) {
    logger.error(`Registration error: ${error.message}`, { stack: error.stack });
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

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS'));
    }
    const activeSecrets = getActiveSecrets();
    const token = jwt.sign(
      { id: user.id, role: user.role },
      activeSecrets[0],
      { expiresIn: '1d' }
    );

    logger.info(`User logged in: ${email}`);
    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    logger.error(`Login error: ${error.message}`);
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
    logger.info('All users fetched');
    res.json(users);
  } catch (err) {
    logger.error(`Error fetching all users: ${err.message}`);
    next(new AppError('Server error', 500, 'SERVER_ERROR', true, err));
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