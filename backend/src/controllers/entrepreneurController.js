const { Entrepreneur } = require('../models');
const { validationResult } = require('express-validator');

exports.createEntrepreneur = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const entrepreneur = await Entrepreneur.create(req.body);
    res.status(201).json(entrepreneur);
  } catch (error) {
    next(error);
  }
};

exports.getAllEntrepreneurs = async (req, res) => {
  try {
    const entrepreneurs = await Entrepreneur.findAll();
    res.json(entrepreneurs);
  } catch (error) {
    next(error);;
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
    next(error);
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
    next(error);
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
    next(error);
  }
};