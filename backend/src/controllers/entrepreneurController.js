const { Entrepreneur } = require('../models');
const { validationResult } = require('express-validator');
const errorHandler = require('../utils/appError');

exports.createEntrepreneur = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const entrepreneur = await Entrepreneur.create(req.body);
    res.status(201).json(entrepreneur);
  } catch (error) {
    errorHandler(error, req, res);
  }
};

exports.getAllEntrepreneurs = async (req, res) => {
  try {
    const entrepreneurs = await Entrepreneur.findAll();
    res.json(entrepreneurs);
  } catch (error) {
    errorHandler(error, req, res);
  }
};

exports.getEntrepreneur = async (req, res) => {
  try {
    const entrepreneur = await Entrepreneur.findByPk(req.params.id);
    if (!entrepreneur) {
      return res.status(404).json({ message: 'Entrepreneur not found' });
    }
    res.json(entrepreneur);
  } catch (error) {
    errorHandler(error, req, res);
  }
};

exports.updateEntrepreneur = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const entrepreneur = await Entrepreneur.findByPk(req.params.id);
    if (!entrepreneur) {
      return res.status(404).json({ message: 'Entrepreneur not found' });
    }
    await entrepreneur.update(req.body);
    res.json(entrepreneur);
  } catch (error) {
    errorHandler(error, req, res);
  }
};

exports.deleteEntrepreneur = async (req, res) => {
  try {
    const entrepreneur = await Entrepreneur.findByPk(req.params.id);
    if (!entrepreneur) {
      return res.status(404).json({ message: 'Entrepreneur not found' });
    }
    await entrepreneur.destroy();
    res.json({ message: 'Entrepreneur deleted successfully' });
  } catch (error) {
    errorHandler(error, req, res);
  }
};