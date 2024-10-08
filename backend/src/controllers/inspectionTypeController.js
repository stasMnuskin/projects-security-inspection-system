const db = require('../models');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

exports.createInspectionType = async (req, res, next) => {
  try {
    const { name, formStructure } = req.body;

    if (!name || !formStructure) {
      return next(new AppError('Missing required fields', 400, 'MISSING_FIELDS'));
    }

    const inspectionType = await db.InspectionType.create({
      name,
      formStructure: JSON.stringify(formStructure)
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
      attributes: ['id', 'name', 'formStructure']
    });
    res.json(inspectionTypes);
  } catch (error) {
    logger.error('Error in getAllInspectionTypes:', error);
    next(new AppError('Error fetching inspection types', 500));
  }
};

exports.getInspectionType = async (req, res, next) => {
  try {
    const inspectionType = await db.InspectionType.findByPk(req.params.id);
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
    const { name, formStructure } = req.body;
    const inspectionType = await db.InspectionType.findByPk(req.params.id);
    if (!inspectionType) {
      return next(new AppError('Inspection type not found', 404));
    }

    if (name) inspectionType.name = name;
    if (formStructure) inspectionType.formStructure = JSON.stringify(formStructure);

    await inspectionType.save();
    res.json(inspectionType);
  } catch (error) {
    logger.error('Error in updateInspectionType:', error);
    next(new AppError('Error updating inspection type', 500));
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

exports.getInspectionFormStructure = async (req, res, next) => {
  try {
    const { siteId, inspectionTypeId } = req.params;

    logger.info(`Fetching inspection form structure for siteId: ${siteId}, inspectionTypeId: ${inspectionTypeId}`);

    const site = await db.Site.findByPk(siteId);
    if (!site) {
      logger.error(`Site not found for siteId: ${siteId}`);
      return next(new AppError('Site not found', 404));
    }

    const inspectionType = await db.InspectionType.findByPk(inspectionTypeId);
    
    if (!inspectionType) {
      logger.error(`Inspection type not found for inspectionTypeId: ${inspectionTypeId}`);
      return next(new AppError('Inspection type not found', 404));
    }

    logger.info(`Fetched inspection form structure for siteId: ${siteId}, inspectionTypeId: ${inspectionTypeId}`);
    res.json(JSON.parse(inspectionType.formStructure));
  } catch (error) {
    logger.error('Error in getInspectionFormStructure:', error);
    next(new AppError('Error fetching inspection form structure', 500));
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
      where: { siteId: siteId }
    });
    res.json(inspectionTypes);
  } catch (error) {
    logger.error('Error in getInspectionTypesBySite:', error);
    next(new AppError('Error fetching inspection types', 500));
  }
};