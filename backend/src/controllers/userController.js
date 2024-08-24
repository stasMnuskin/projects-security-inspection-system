const { User } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const AppError = require('../utils/appError');

exports.registerUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation Error', 400, 'Validation_Error').setRequestDetails(req);
  }

  const { username, email, password, role } = req.body;

  try {
    let user = await User.findOne({ where: { email } });
    if (user) {
      throw new AppError('User already exists', 400, 'BAD_REQUEST').setRequestDetails(req);
    }

    user = await User.create({
      username,
      email,
      password,
      role
    });

    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (error) {
    next(error);
  }
};

exports.loginUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('User already exists', 400, 'BAD_REQUEST').setRequestDetails(req);
  }

  const { email, password } = req.body;

  try {
    let user = await User.findOne({ where: { email } });
    if (!user) {
      throw new AppError('Invalid Credentials', 400, 'BAD_REQUEST').setRequestDetails(req);
    }

    const isMatch = await user.validPassword(password);
    if (!isMatch) {
      throw new AppError('Invalid Credentials', 400, 'BAD_REQUEST').setRequestDetails(req);
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (error) {
    next(error);
  }
};

exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND').setRequestDetails(req);
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation Error', 400, 'Validation_Error').setRequestDetails(req);
  }

  try {
    const { username, email, role } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND').setRequestDetails(req);
    }

    user.username = username || user.username;
    user.email = email || user.email;
    user.role = role || user.role;

    await user.save();

    res.json(user);
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND').setRequestDetails(req);
    }

    await user.destroy();
    res.json({ msg: 'User deleted' });
  } catch (error) {
    next(error);
  }
};

exports.assignSiteToUser = async (req, res, next) => {
  try {
    const { userId, siteId } = req.body;
    const user = await db.User.findByPk(userId);
    const site = await db.Site.findByPk(siteId);

    if (!user || !site) {
      throw new AppError('User or Site not found', 404, 'USER_OR_SITE_NOT_FOUND').setRequestDetails(req);
    }

    await user.addSite(site);
    res.json({ message: 'Site assigned to user successfully' });
  } catch (error) {
    next(error);
  }
};