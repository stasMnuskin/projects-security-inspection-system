const db = require('../models');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

exports.createInspectionType = async (req, res, next) => {
  try {
    const { name, siteId, formStructure, frequency } = req.body;

    if (!name || !siteId || !formStructure) {
      return next(new AppError('Missing required fields', 400, 'MISSING_FIELDS'));
    }

    const site = await db.Site.findByPk(siteId);

    if (!site) {
      return next(new AppError('Site not found', 404));
    }

    const inspectionType = await db.InspectionType.create({
      name,
      siteId,
      formStructure,
      frequency
    });

    logger.info(`New inspection type created: ${name}`);
    res.status(201).json(inspectionType);
  } catch (error) {
    logger.error('Error in createInspectionType:', error);
    return next(new AppError('Error creating inspection type', 500));
  }
};

exports.getAllInspectionTypes = async (req, res, next) => {
  try {
    const inspectionTypes = await db.InspectionType.findAll({
      include: [{ model: db.Site, attributes: ['name'] }]
    });
    res.json(inspectionTypes);
  } catch (error) {
    logger.error('Error in getAllInspectionTypes:', error);
    return next(new AppError('Error fetching inspection types', 500));
  }
};

exports.getInspectionType = async (req, res, next) => {
  try {
    const inspectionType = await db.InspectionType.findByPk(req.params.id, {
      include: [{ model: db.Site, attributes: ['name'] }]
    });
    if (!inspectionType) {
      return next(new AppError('Inspection type not found', 404));
    }
    res.json(inspectionType);
  } catch (error) {
    logger.error('Error in getInspectionType:', error);
    return next(new AppError('Error fetching inspection type', 500));
  }
};

exports.updateInspectionType = async (req, res, next) => {
  try {
    const { name, formStructure, frequency } = req.body;
    const inspectionType = await db.InspectionType.findByPk(req.params.id);
    if (!inspectionType) {
      return next(new AppError('Inspection type not found', 404));
    }

    if (name) inspectionType.name = name;
    if (formStructure) inspectionType.formStructure = formStructure;
    if (frequency) inspectionType.frequency = frequency;

    await inspectionType.save();
    res.json(inspectionType);
  } catch (error) {
    next(error);
  }
};

exports.deleteInspectionType = async (req, res, next) => {
  try {
    const inspectionType = await db.InspectionType.findByPk(req.params.id);
    if (!inspectionType) {
      return next(new AppError('Inspection type not found', 404));
    }

    await inspectionType.destroy();
    logger.info(`Inspection type deleted: ${inspectionType.name}`);
    res.json({ message: 'Inspection type deleted successfully' });
  } catch (error) {
    logger.error('Error in deleteInspectionType:', error);
    return next(new AppError('Error deleting inspection type', 500));
  }
};

exports.getInspectionTypesBySite = async (req, res, next) => {
  try {
    const { siteId } = req.params;
    const site = await db.Site.findByPk(siteId);
    if (!site) {
      return next(new AppError('Site not found', 404));
    }

    const inspectionTypes = await db.InspectionType.findAll({
      where: { siteId },
      include: [{ model: db.Site, attributes: ['name'] }]
    });

    res.json(inspectionTypes);
  } catch (error) {
    logger.error('Error in getInspectionTypesBySite:', error);
    return next(new AppError('Error fetching inspection types for site', 500));
  }
};