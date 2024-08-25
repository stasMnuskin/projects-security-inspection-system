const jwt = require('jsonwebtoken');
const { User } = require('../models');
const AppError = require('../utils/appError');

module.exports = async (req, res, next) => {
  try {
    const token = req.header('x-auth-token');

    if (!token) {
      return next(new AppError('No token, authorization denied', 401, 'NO_TOKEN'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    next(new AppError('Token is not valid', 401, 'INVALID_TOKEN'));
  }
};