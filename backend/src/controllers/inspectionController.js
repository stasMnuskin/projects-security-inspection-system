const { validationResult } = require('express-validator');
const db = require('../models');
const errorHandler = require('../utils/appError');

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

    res.status(201).json(inspection);
  } catch (error) {
    errorHandler(error, req, res);
  }
};

exports.getAllInspections = async (req, res) => {
  try {
    const inspections = await db.Inspection.findAll({
      include: [
        { model: db.Entrepreneur, attributes: ['name'] },
        { model: db.Site, attributes: ['name'] },
        { model: db.InspectionType, attributes: ['name'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(inspections);
  } catch (error) {
    errorHandler(error, req, res);
  }
};

exports.getInspection = async (req, res) => {
  try {
    const inspection = await db.Inspection.findByPk(req.params.id, {
      include: [
        { model: db.Entrepreneur, attributes: ['name'] },
        { model: db.Site, attributes: ['name'] },
        { model: db.InspectionType, attributes: ['name'] }
      ]
    });
    if (!inspection) {
      return res.status(404).json({ message: 'Inspection not found' });
    }
    res.json(inspection);
  } catch (error) {
    errorHandler(error, req, res);
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
    
    if (entrepreneurId && entrepreneurId !== inspection.entrepreneurId) {
      const entrepreneur = await db.Entrepreneur.findByPk(entrepreneurId);
      if (!entrepreneur) {
        return res.status(404).json({ message: 'Entrepreneur not found' });
      }
    }

    if (siteId && siteId !== inspection.siteId) {
      const site = await db.Site.findByPk(siteId);
      if (!site) {
        return res.status(404).json({ message: 'Site not found' });
      }
      if (site.entrepreneurId !== (entrepreneurId || inspection.entrepreneurId)) {
        return res.status(400).json({ message: 'Site does not belong to the specified entrepreneur' });
      }
    }

    if (inspectionTypeId && inspectionTypeId !== inspection.inspectionTypeId) {
      const inspectionType = await db.InspectionType.findByPk(inspectionTypeId);
      if (!inspectionType) {
        return res.status(404).json({ message: 'Inspection Type not found' });
      }
    }

    await inspection.update({
      entrepreneurId: entrepreneurId || inspection.entrepreneurId,
      siteId: siteId || inspection.siteId,
      inspectionTypeId: inspectionTypeId || inspection.inspectionTypeId,
      details: details || inspection.details,
      status: status || inspection.status
    });
    
    res.json(inspection);
  } catch (error) {
    errorHandler(error, req, res);
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
    errorHandler(error, req, res);
  }
};