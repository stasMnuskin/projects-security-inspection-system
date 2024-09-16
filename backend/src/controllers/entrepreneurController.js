const db = require('../models');
const { validationResult } = require('express-validator');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

exports.createEntrepreneur = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return next(new AppError('Missing required fields', 400, 'MISSING_FIELDS'));
    }
    const entrepreneur = await db.User.create({
      username,
      email,
      password,
      role: 'entrepreneur'
    });
    res.status(201).json(entrepreneur);
  } catch (error) {
    next(error);
  }
};

exports.getAllEntrepreneurs = async (req, res, next) => {
  try {
    logger.info('Fetching all entrepreneurs');
    const entrepreneurs = await db.User.findAll({
      where: { role: 'entrepreneur' },
      attributes: ['id', 'username', 'email'],
      include: [{
        model: db.Site,
        as: 'sites'
      }]
    });
    logger.info(`Found ${entrepreneurs.length} entrepreneurs`);
    if (!entrepreneurs || entrepreneurs.length === 0) {
      logger.warn('No entrepreneurs found');
      return res.json([]);
    }
    logger.info('Entrepreneurs:', entrepreneurs);
    res.json(entrepreneurs);
  } catch (error) {
    logger.error('Error in getAllEntrepreneurs:', error);
    next(error);
  }
};

exports.getEntrepreneur = async (req, res, next) => {
  try {
    const entrepreneur = await db.User.findOne({
      where: { id: req.params.id, role: 'entrepreneur' },
      attributes: ['id', 'username', 'email'],
      include: [{
        model: db.Site,
        as: 'sites'
      }]
    });
    if (!entrepreneur) {
      throw new AppError('Entrepreneur not found', 404, 'NOT_FOUND');
    }
    res.json(entrepreneur);
  } catch (error) {
    logger.error('Error in getEntrepreneur:', error);
    next(error);
  }
};

exports.updateEntrepreneur = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation Error', 400, 'VALIDATION_ERROR'));
  }

  try {
    const entrepreneur = await db.User.findOne({
      where: { id: req.params.id, role: 'entrepreneur' }
    });
    if (!entrepreneur) {
      throw new AppError('Entrepreneur not found', 404, 'NOT_FOUND');
    }
    await entrepreneur.update(req.body);
    res.json(entrepreneur);
  } catch (error) {
    logger.error('Error in updateEntrepreneur:', error);
    next(error);
  }
};

exports.deleteEntrepreneur = async (req, res, next) => {
  try {
    const entrepreneur = await db.User.findOne({
      where: { id: req.params.id, role: 'entrepreneur' }
    });
    if (!entrepreneur) {
      throw new AppError('Entrepreneur not found', 404, 'NOT_FOUND');
    }
    await entrepreneur.destroy();
    res.json({ message: 'Entrepreneur deleted successfully' });
  } catch (error) {
    logger.error('Error in deleteEntrepreneur:', error);
    next(error);
  }
};