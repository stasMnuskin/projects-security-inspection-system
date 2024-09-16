const { validationResult } = require('express-validator');
const db = require('../models');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

exports.createInspection = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();

  try {
    const { siteId, inspectionTypeId, inspectorName, date, criteria, linkedFaults } = req.body;

    // Validate required fields
    if (!siteId || !inspectionTypeId || !inspectorName || !date || !criteria) {
      throw new AppError('Missing required fields', 400);
    }

    // Create the inspection
    const inspection = await db.Inspection.create({
      siteId,
      inspectionTypeId,
      inspectorName,
      date,
      criteria,
      status: 'completed',
      userId: req.user.id
    }, { transaction });

    // Link faults to the inspection
    if (linkedFaults && Object.keys(linkedFaults).length > 0) {
      const faultLinks = Object.entries(linkedFaults).map(([criterionId, faultId]) => ({
        inspectionId: inspection.id,
        criterionId,
        faultId
      }));
      await db.InspectionFault.bulkCreate(faultLinks, { transaction });
    }

    await transaction.commit();

    res.status(201).json(inspection);
    logger.info(`New inspection created: ${inspection.id}`);
  } catch (error) {
    await transaction.rollback();
    logger.error('Error in createInspection:', error);
    next(new AppError('Error creating inspection', 500));
  }
};

exports.getAllInspections = async (req, res, next) => {
  try {
    const inspections = await db.Inspection.findAll({
      include: [
        { model: db.Site, attributes: ['name'] },
        { model: db.InspectionType, attributes: ['name'] },
        { 
          model: db.Fault,
          through: { model: db.InspectionFault, attributes: [] },
          attributes: ['id', 'description']
        }
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
        { model: db.Site, attributes: ['name'] },
        { model: db.InspectionType, attributes: ['name'] },
        { 
          model: db.Fault,
          through: { model: db.InspectionFault, attributes: [] },
          attributes: ['id', 'description']
        }
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
        { model: db.Site, attributes: ['name'] },
        { model: db.InspectionType, attributes: ['name'] },
        { 
          model: db.Fault,
          through: { model: db.InspectionFault, attributes: [] },
          attributes: ['id', 'description']
        }
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
    const { siteId, inspectionTypeId, criteria, status, linkedFaults } = req.body;
    const inspection = await db.Inspection.findByPk(req.params.id, { transaction });

    if (!inspection) {
      await transaction.rollback();
      return next(new AppError('Inspection not found', 404, 'INSPECTION_NOT_FOUND').setRequestDetails(req));
    }

    // Update only the fields that are provided and different from current values
    const updates = {
      siteId: siteId !== undefined && siteId !== inspection.siteId ? siteId : undefined,
      inspectionTypeId: inspectionTypeId !== undefined && inspectionTypeId !== inspection.inspectionTypeId ? inspectionTypeId : undefined,
      criteria: criteria !== undefined && JSON.stringify(criteria) !== JSON.stringify(inspection.criteria) ? criteria : undefined,
      status: status !== undefined && status !== inspection.status ? status : undefined
    };

    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    if (Object.keys(filteredUpdates).length > 0) {
      await inspection.update(filteredUpdates, { transaction });
    }

    // Update linked faults if provided
    if (linkedFaults) {
      await db.InspectionFault.destroy({ where: { inspectionId: inspection.id }, transaction });
      const faultLinks = Object.entries(linkedFaults).map(([criterionId, faultId]) => ({
        inspectionId: inspection.id,
        criterionId,
        faultId
      }));
      await db.InspectionFault.bulkCreate(faultLinks, { transaction });
    }

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
      throw new AppError('Inspection not found', 404, 'INSPECTION_NOT_FOUND').setRequestDetails(req);
    }

    await inspection.destroy();
    res.json({ message: 'Inspection deleted successfully' });
    logger.info(`Function delete called with params: ${JSON.stringify(req.params)}`);
  } catch (error) {
    logger.error('Error in delete:', error);
    next(error);
  }
};