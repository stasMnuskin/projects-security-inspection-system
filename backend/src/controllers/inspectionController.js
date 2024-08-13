const { Inspection, User } = require('../models');
const { validationResult } = require('express-validator');

exports.createInspection = async (req, res) => {
  try {
    const { site, type, details } = req.body;
    const inspection = await Inspection.create({
      site,
      type,
      details,
      UserId: req.user.id,
    });
    res.status(201).json(inspection);
  } catch (error) {
    console.error('Error creating inspection:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getInspections = async (req, res) => {
  try {
    const inspections = await Inspection.findAll({
      include: [{ model: User, attributes: ['username', 'email'] }],
    });
    res.json(inspections);
  } catch (error) {
    console.error('Error fetching inspections:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getInspection = async (req, res) => {
  try {
    const inspection = await Inspection.findByPk(req.params.id, {
      include: [{ model: User, attributes: ['username', 'email'] }],
    });
    if (!inspection) {
      return res.status(404).json({ message: 'Inspection not found' });
    }
    res.json(inspection);
  } catch (error) {
    console.error('Error fetching inspection:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateInspection = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { site, type, details, status } = req.body;
    const inspection = await Inspection.findByPk(req.params.id);
    if (!inspection) {
      return res.status(404).json({ message: 'Inspection not found' });
    }
    await inspection.update({ site, type, details, status });
    res.json(inspection);
  } catch (error) {
    console.error('Error updating inspection:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteInspection = async (req, res) => {
  try {
    const inspection = await Inspection.findByPk(req.params.id);
    if (!inspection) {
      return res.status(404).json({ message: 'Inspection not found' });
    }
    await inspection.destroy();
    res.json({ message: 'Inspection deleted successfully' });
  } catch (error) {
    console.error('Error deleting inspection:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};