const { validationResult } = require('express-validator');
const db = require('../models');
const AppError = require('../utils/appError');

exports.createInspection = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation Error', 400, 'Validation_Error').setRequestDetails(req);
  }

  try {
    const { entrepreneurId, siteId, inspectionTypeId, details } = req.body;
    
    const entrepreneur = await db.Entrepreneur.findByPk(entrepreneurId);
    if (!entrepreneur) {
      throw new AppError('Entrepreneur not found', 404, 'Entrepreneur_NOT_FOUND').setRequestDetails(req);
    }

    const site = await db.Site.findByPk(siteId);
    if (!site) {
      throw new AppError('Site not found', 404, 'Site_NOT_FOUND').setRequestDetails(req);
    }

    const inspectionType = await db.InspectionType.findByPk(inspectionTypeId);
    if (!inspectionType) {
      throw new AppError('Inspection Type not found', 404, 'Inspection Type_NOT_FOUND').setRequestDetails(req);
    }

    if (site.entrepreneurId !== entrepreneurId) {
      throw new AppError('Site does not belong to the specified entrepreneur', 400, 'BAD_REQUEST').setRequestDetails(req);
    }

    const inspection = await db.Inspection.create({
      entrepreneurId,
      siteId,
      inspectionTypeId,
      details,
      userId: req.user.id,
    });

    if (!inspection) {
      throw new AppError('INTERNAL_ERROR', 500, 'INTERNAL_ERROR').setRequestDetails(req);
    }

    res.status(201).json(inspection);
  } catch (error) {
    next(error);
  }
};

exports.getAllInspections = async (req, res, next) => {
  try {
    const inspections = await db.Inspection.findAll({
      include: [
        { model: db.Entrepreneur, attributes: ['name'] },
        { model: db.Site, attributes: ['name'] },
        { model: db.InspectionType, attributes: ['name'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    if (!inspections) {
      throw new AppError('Inspections not found', 404, 'INSPECTIONS_NOT_FOUND').setRequestDetails(req);
    }

    res.json(inspections);
  } catch (error) {
    next(error);
  }
};

exports.getInspection = async (req, res, next) => {
  try {
    const inspection = await db.Inspection.findByPk(req.params.id, {
      include: [
        { model: db.Entrepreneur, attributes: ['name'] },
        { model: db.Site, attributes: ['name'] },
        { model: db.InspectionType, attributes: ['name'] }
      ]
    });
    if (!inspection) {
      throw new AppError('Inspection not found', 404, 'INSPECTION_NOT_FOUND').setRequestDetails(req);
    }
    res.json(inspection);
  } catch (error) {
    next(error);
  }
};

exports.updateInspection = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation Error', 400, 'Validation_Error').setRequestDetails(req);
  }

  try {
    const { entrepreneurId, siteId, inspectionTypeId, details, status } = req.body;
    const inspection = await db.Inspection.findByPk(req.params.id);
    if (!inspection) {
      throw new AppError('Inspection not found', 404, 'INSPECTION_NOT_FOUND').setRequestDetails(req);
    }
    
    if (entrepreneurId && entrepreneurId !== inspection.entrepreneurId) {
      const entrepreneur = await db.Entrepreneur.findByPk(entrepreneurId);
      if (!entrepreneur) {
        throw new AppError('Entrepreneur not found', 404, 'Entrepreneur_NOT_FOUND').setRequestDetails(req);
      }
    }

    if (siteId && siteId !== inspection.siteId) {
      const site = await db.Site.findByPk(siteId);
      if (!site) {
        throw new AppError('Site not found', 404, 'Site_NOT_FOUND').setRequestDetails(req);
      }
      if (site.entrepreneurId !== (entrepreneurId || inspection.entrepreneurId)) {
        throw new AppError('Site does not belong to the specified entrepreneur', 400, 'BAD_REQUEST').setRequestDetails(req);
      }
    }

    if (inspectionTypeId && inspectionTypeId !== inspection.inspectionTypeId) {
      const inspectionType = await db.InspectionType.findByPk(inspectionTypeId);
      if (!inspectionType) {
        throw new AppError('Inspection Type not found', 404, 'Inspection_Type_NOT_FOUND').setRequestDetails(req);

      }
    }

    await inspection.update({
      entrepreneurId: entrepreneurId || inspection.entrepreneurId,
      siteId: siteId || inspection.siteId,
      inspectionTypeId: inspectionTypeId || inspection.inspectionTypeId,
      details: details || inspection.details,
      status: status || inspection.status
    });
    
    if (!inspection) {
      throw new AppError('INTERNAL_ERROR', 500, 'INTERNAL_ERROR').setRequestDetails(req);
    }

    res.json(inspection);
  } catch (error) {
    next(error);
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
  } catch (error) {
    next(error);
  }
};