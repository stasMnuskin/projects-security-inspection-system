const db = require('../models');
const { validationResult } = require('express-validator');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

exports.createEntrepreneur = async (req, res, next) => {
  try {
    const { name, contactPerson, email, phone } = req.body;
    if (!name || !contactPerson || !email || !phone) {
      return next(new AppError('Missing required fields', 400, 'MISSING_FIELDS'));
    }
    const entrepreneur = await db.Entrepreneur.create(req.body);
    res.status(201).json(entrepreneur);
  } catch (error) {
    next(error);
  }
};

exports.getAllEntrepreneurs = async (req, res, next) => {
  try {
    const entrepreneurs = await db.Entrepreneur.findAll();
    if (!entrepreneurs) {
      throw new AppError('entrepreneurs not found', 404, 'NOT_FOUND').setRequestDetails(req);
    }
    res.json(entrepreneurs);
    logger.info(`Function getAllEntrepreneurs called with params: ${JSON.stringify(req.params)}`);
  } catch (error) {
    logger.error('Error in getAllEntrepreneurs:', error);
    next(error);
  }
};

exports.getEntrepreneur = async (req, res, next) => {
  try {
    const entrepreneur = await db.Entrepreneur.findByPk(req.params.id);
    if (!entrepreneur) {
      throw new AppError('entrepreneur not found', 404, 'NOT_FOUND').setRequestDetails(req);
    }
    res.json(entrepreneur);
    logger.info(`Function getEntrepreneur called with params: ${JSON.stringify(req.params)}`);
  } catch (error) {
    logger.error('Error in getEntrepreneur:', error);
    next(error);
  }
};

exports.updateEntrepreneur = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation Error', 400, 'Validation_Error').setRequestDetails(req);
  }

  try {
    const entrepreneur = await db.Entrepreneur.findByPk(req.params.id);
    if (!entrepreneur) {
      throw new AppError('entrepreneur not found', 404, 'NOT_FOUND').setRequestDetails(req);
    }
    await entrepreneur.update(req.body);
    res.json(entrepreneur);
    logger.info(`Function updateEntrepreneur called with params: ${JSON.stringify(req.params)}`);
  } catch (error) {
    logger.error('Error in updateEntrepreneur:', error);
    next(error);
  }
};

exports.deleteEntrepreneur = async (req, res, next) => {
  try {
    const entrepreneur = await db.Entrepreneur.findByPk(req.params.id);
    if (!entrepreneur) {
      throw new AppError('entrepreneur not found', 404, 'NOT_FOUND').setRequestDetails(req);
    }
    await entrepreneur.destroy();
    res.json({ message: 'Entrepreneur deleted successfully' });
    logger.info(`Function deleteEntrepreneur called with params: ${JSON.stringify(req.params)}`);
  } catch (error) {
    logger.error('Error in deleteEntrepreneur:', error);
    next(error);
  }
};