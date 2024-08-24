const jwt = require('jsonwebtoken');
const db = require('../models');
const AppError = require('../utils/appError');

module.exports = async (req, res, next) => {
  try {
    const token = req.header('x-auth-token');

    if (!token) {
      throw new AppError('No token, authorization denied', 401, 'UNAUTHORIZED').setRequestDetails(req);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    

    const user = await db.User.findByPk(decoded.user.id, {
      include: [{ model: db.Site }]
    });

    if (!user) {
      throw new AppError('Token is not valid', 401, 'UNAUTHORIZED').setRequestDetails(req);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};