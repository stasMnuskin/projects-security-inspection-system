const { validationResult } = require('express-validator');
const db = require('../models');
const notificationController = require('./notificationController');

exports.createInspection = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { entrepreneurId, siteId, inspectionTypeId, details } = req.body;
    
    const entrepreneur = await db.Entrepreneur.findByPk(entrepreneurId);
    if (!entrepreneur) {
      return res.status(404).json({ message: 'Entrepreneur not found' });
    }

    const site = await db.Site.findByPk(siteId);
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }

    const inspectionType = await db.InspectionType.findByPk(inspectionTypeId);
    if (!inspectionType) {
      return res.status(404).json({ message: 'Inspection Type not found' });
    }

    if (site.entrepreneurId !== entrepreneurId) {
      return res.status(400).json({ message: 'Site does not belong to the specified entrepreneur' });
    }

    const inspection = await db.Inspection.create({
      entrepreneurId,
      siteId,
      inspectionTypeId,
      details,
      userId: req.user.id,
    });

    if (inspection.status === 'requires_action') {
      await notificationController.createNotification(
        req.user.id,
        `New inspection requires action: ${inspection.id}`,
        'warning'
      );
    }
    
    res.status(201).json(inspection);
  } catch (error) {
    console.error('Error creating inspection:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getAllInspections = async (req, res) => {
  try {
    const inspections = await db.Inspection.findAll({
      include: [
        { model: db.Entrepreneur },
        { model: db.Site },
        { model: db.InspectionType }
      ]
    });
    res.json(inspections);
  } catch (error) {
    console.error('Error fetching inspections:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getInspection = async (req, res) => {
  try {
    const inspection = await db.Inspection.findByPk(req.params.id, {
      include: [
        { model: db.Entrepreneur },
        { model: db.Site },
        { model: db.InspectionType }
      ]
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
    const { entrepreneurId, siteId, inspectionTypeId, details, status } = req.body;
    const inspection = await db.Inspection.findByPk(req.params.id);
    if (!inspection) {
      return res.status(404).json({ message: 'Inspection not found' });
    }
    await inspection.update({
      entrepreneurId,
      siteId,
      inspectionTypeId,
      details,
      status
    });
    res.json(inspection);
  } catch (error) {
    console.error('Error updating inspection:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const inspection = await db.Inspection.findByPk(req.params.id);
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