const { validationResult } = require('express-validator');
const db = require('../models');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

exports.createInspection = async (req, res, next) => {
  try {
    const { entrepreneurId, siteId, inspectionTypeId } = req.body;
    const inspection = await db.Inspection.create({
      entrepreneurId,
      siteId,
      inspectionTypeId,
      status: 'pending',
      userId: req.user.id 
    });
    res.status(201).json(inspection);
  } catch (error) {
    next(new AppError('Error creating inspection', 500));
  }
};

exports.getAllInspections = async (req, res, next) => {
  try {
    const inspections = await db.Inspection.findAll({
      include: [
        { model: db.User, as: 'entrepreneur', attributes: ['username'] },
        { model: db.Site, attributes: ['name'] },
        { model: db.InspectionType, attributes: ['name'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    if (!inspections) {
      throw new AppError('Inspections not found', 404, 'INSPECTIONS_NOT_FOUND').setRequestDetails(req);
    }

    res.json(inspections);
    logger.info(`Function getAllInspections called with params: ${JSON.stringify(req.params)}`);
  } catch (error) {
    logger.error('Error in getAllInspections:', error);
    next(error);
  }
};

exports.getInspection = async (req, res, next) => {
  try {
    const inspection = await db.Inspection.findByPk(req.params.id, {
      include: [
        { model: db.User, as: 'entrepreneur', attributes: ['username'] },
        { model: db.Site, attributes: ['name'] },
        { model: db.InspectionType, attributes: ['name'] }
      ]
    });
    if (!inspection) {
      throw new AppError('Inspection not found', 404, 'INSPECTION_NOT_FOUND').setRequestDetails(req);
    }
    res.json(inspection);
    logger.info(`Function getInspection called with params: ${JSON.stringify(req.params)}`);
  } catch (error) {
    logger.error('Error in getInspection:', error);
    next(error);
  }
};

exports.getLatestInspection = async (req, res, next) => {
  try {
    const siteId = req.params.siteId;
    const latestInspection = await db.Inspection.findOne({
      where: { siteId: siteId },
      include: [
        { model: db.User, as: 'entrepreneur', attributes: ['username'] },
        { model: db.Site, attributes: ['name'] },
        { model: db.InspectionType, attributes: ['name'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    if (!latestInspection) {
      throw new AppError('No inspection found for this site', 404, 'INSPECTION_NOT_FOUND').setRequestDetails(req);
    }

    res.json(latestInspection);
    logger.info(`Function getLatestInspection called with params: ${JSON.stringify(req.params)}`);
  } catch (error) {
    logger.error('Error in getLatestInspection:', error);
    next(error);
  }
};

exports.updateInspection = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation Error', 400, 'VALIDATION_ERROR').setRequestDetails(req));
  }

  const transaction = await db.sequelize.transaction();

  try {
    const { entrepreneurId, siteId, inspectionTypeId, details, status } = req.body;
    const inspection = await db.Inspection.findByPk(req.params.id, { transaction });

    if (!inspection) {
      await transaction.rollback();
      return next(new AppError('Inspection not found', 404, 'INSPECTION_NOT_FOUND').setRequestDetails(req));
    }

    // Validate relationships if they are being updated
    if (entrepreneurId && entrepreneurId !== inspection.entrepreneurId) {
      const entrepreneur = await db.User.findByPk(entrepreneurId, { transaction });
      if (!entrepreneur) {
        await transaction.rollback();
        return next(new AppError('Entrepreneur not found', 404, 'ENTREPRENEUR_NOT_FOUND').setRequestDetails(req));
      }
    }

    if (siteId && siteId !== inspection.siteId) {
      const site = await db.Site.findByPk(siteId, { transaction });
      if (!site) {
        await transaction.rollback();
        return next(new AppError('Site not found', 404, 'SITE_NOT_FOUND').setRequestDetails(req));
      }
      if (site.entrepreneurId !== (entrepreneurId || inspection.entrepreneurId)) {
        await transaction.rollback();
        return next(new AppError('Site does not belong to the specified entrepreneur', 400, 'INVALID_SITE').setRequestDetails(req));
      }
    }

    if (inspectionTypeId && inspectionTypeId !== inspection.inspectionTypeId) {
      const inspectionType = await db.InspectionType.findByPk(inspectionTypeId, { transaction });
      if (!inspectionType) {
        await transaction.rollback();
        return next(new AppError('Inspection Type not found', 404, 'INSPECTION_TYPE_NOT_FOUND').setRequestDetails(req));
      }
    }

    // Update only the fields that are provided and different from current values
    const updates = {
      entrepreneurId: entrepreneurId !== undefined && entrepreneurId !== inspection.entrepreneurId ? entrepreneurId : undefined,
      siteId: siteId !== undefined && siteId !== inspection.siteId ? siteId : undefined,
      inspectionTypeId: inspectionTypeId !== undefined && inspectionTypeId !== inspection.inspectionTypeId ? inspectionTypeId : undefined,
      details: details !== undefined && JSON.stringify(details) !== JSON.stringify(inspection.details) ? details : undefined,
      status: status !== undefined && status !== inspection.status ? status : undefined
    };

    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    if (Object.keys(filteredUpdates).length === 0) {
      await transaction.rollback();
      return res.status(304).json({ message: 'No changes to update' });
    }

    await inspection.update(filteredUpdates, { transaction });

    await transaction.commit();

    res.json(inspection);
    logger.info(`Inspection updated: ${inspection.id}`, { updates: filteredUpdates });
  } catch (error) {
    await transaction.rollback();
    logger.error('Error in updateInspection:', error);
    next(new AppError('Error updating inspection', 500, 'UPDATE_ERROR').setRequestDetails(req));
  }
};

exports.delete = async (req, res, next) => {
  try {
    const inspection = await db.Inspection.findByPk(req.params.id);

    if (!inspection) {
      throw new AppError('Inspection not found', 404, 'Inspection_NOT_FOUND').setRequestDetails(req);
    }

    await inspection.destroy();
    res.json({ message: 'Inspection deleted successfully' });
    logger.info(`Function delete called with params: ${JSON.stringify(req.params)}`);
  } catch (error) {
    logger.error('Error in delete:', error);
    next(error);
  }
};