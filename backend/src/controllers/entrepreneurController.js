const { Entrepreneur } = require('../models');
const { validationResult } = require('express-validator');
const AppError = require('../utils/appError');

exports.createEntrepreneur = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation Error', 400, 'Validation_Error').setRequestDetails(req);
  }

  try {
    const entrepreneur = await Entrepreneur.create(req.body);
    if (!entrepreneur) {
      throw new AppError('entrepreneur not found', 404, 'NOT_FOUND').setRequestDetails(req);
    }
    res.status(201).json(entrepreneur);
  } catch (error) {
    next(error);
  }
};

exports.getAllEntrepreneurs = async (req, res, next) => {
  try {
    const entrepreneurs = await Entrepreneur.findAll();
    if (!entrepreneurs) {
      throw new AppError('entrepreneurs not found', 404, 'NOT_FOUND').setRequestDetails(req);
    }
    res.json(entrepreneurs);
  } catch (error) {
    next(error);
  }
};

exports.getEntrepreneur = async (req, res, next) => {
  try {
    const entrepreneur = await Entrepreneur.findByPk(req.params.id);
    if (!entrepreneur) {
      throw new AppError('entrepreneur not found', 404, 'NOT_FOUND').setRequestDetails(req);
    }
    res.json(entrepreneur);
  } catch (error) {
    next(error);
  }
};

exports.updateEntrepreneur = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation Error', 400, 'Validation_Error').setRequestDetails(req);
  }

  try {
    const entrepreneur = await Entrepreneur.findByPk(req.params.id);
    if (!entrepreneur) {
      throw new AppError('entrepreneur not found', 404, 'NOT_FOUND').setRequestDetails(req);
    }
    await entrepreneur.update(req.body);
    res.json(entrepreneur);
  } catch (error) {
    next(error);
  }
};

exports.deleteEntrepreneur = async (req, res, next) => {
  try {
    const entrepreneur = await Entrepreneur.findByPk(req.params.id);
    if (!entrepreneur) {
      throw new AppError('entrepreneur not found', 404, 'NOT_FOUND').setRequestDetails(req);
    }
    await entrepreneur.destroy();
    res.json({ message: 'Entrepreneur deleted successfully' });
  } catch (error) {
    next(error);
  }
};