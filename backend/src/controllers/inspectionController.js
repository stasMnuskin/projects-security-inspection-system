const { validationResult } = require('express-validator');
const db = require('../models');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

exports.createDefaultInspectionTypes = async () => {
  try {
    const defaultTypes = [
      {
        name: 'ביקורת שגרתית',
        formStructure: JSON.stringify({
          siteName: { type: 'text', label: 'שם האתר', editable: false },
          date: { type: 'date', label: 'תאריך', editable: false },
          securityOfficerName: { type: 'text', label: 'שם קצין הביטחון', editable: false },
          lastInspectionDate: { type: 'date', label: 'סיור אחרון באתר', editable: false },
          accessRoad: { type: 'boolean', label: 'ציר גישה' },
          gate: { type: 'boolean', label: 'שער' },
          fence: { type: 'boolean', label: 'גדר' },
          cameras: { type: 'boolean', label: 'מצלמות' },
          announcement: { type: 'boolean', label: 'כריזה' },
          lighting: { type: 'boolean', label: 'תאורה' },
          vegetation: { type: 'boolean', label: 'עשבייה' },
          generalNotes: { type: 'text', label: 'הערות כלליות' }
        })
      },
      {
        name: 'ביקורת משטרה',
        formStructure: JSON.stringify({
          siteName: { type: 'text', label: 'שם האתר', editable: false },
          date: { type: 'date', label: 'תאריך', editable: false },
          securityOfficerName: { type: 'text', label: 'שם קצין הביטחון', editable: false },
          lastInspectionDate: { type: 'date', label: 'סיור אחרון באתר', editable: false },
          passed: { type: 'boolean', label: 'עבר בהצלחה' },
          notes: { type: 'text', label: 'הערות' }
        })
      },
      {
        name: 'ביקורת משרד האנרגיה',
        formStructure: JSON.stringify({
          siteName: { type: 'text', label: 'שם האתר', editable: false },
          date: { type: 'date', label: 'תאריך', editable: false },
          securityOfficerName: { type: 'text', label: 'שם קצין הביטחון', editable: false },
          lastInspectionDate: { type: 'date', label: 'סיור אחרון באתר', editable: false },
          passed: { type: 'boolean', label: 'עבר בהצלחה' },
          notes: { type: 'text', label: 'הערות' }
        })
      },
      {
        name: 'תרגיל פנימי',
        formStructure: JSON.stringify({
          siteName: { type: 'text', label: 'שם האתר', editable: false },
          drillType: { type: 'text', label: 'סוג התרגיל' },
          date: { type: 'date', label: 'תאריך', editable: false },
          securityOfficerName: { type: 'text', label: 'שם קצין הביטחון', editable: false },
          passed: { type: 'boolean', label: 'עבר בהצלחה' },
          notes: { type: 'text', label: 'הערות' }
        })
      }
    ];

    for (const type of defaultTypes) {
      await db.InspectionType.findOrCreate({
        where: { name: type.name },
        defaults: type
      });
    }

    logger.info('Default inspection types created successfully');
  } catch (error) {
    logger.error('Error creating default inspection types:', error);
  }
};

exports.createInspection = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();

  try {
    const { siteId, inspectionTypeId, securityOfficerName, date, formData, faults } = req.body;

    if (!siteId || !inspectionTypeId || !securityOfficerName || !date || !formData) {
      await transaction.rollback();
      return next(new AppError('Missing required fields', 400));
    }

    if (faults && !Array.isArray(faults)) {
      await transaction.rollback();
      return next(new AppError('Invalid faults format', 400));
    }

    const inspectionType = await db.InspectionType.findByPk(inspectionTypeId);
    if (!inspectionType) {
      await transaction.rollback();
      return next(new AppError('Inspection type not found', 400));
    }

    const formStructure = JSON.parse(inspectionType.formStructure);
    const validatedFormData = {};

    for (const [key, value] of Object.entries(formData)) {
      if (formStructure[key]) {
        if (formStructure[key].type === 'boolean' && typeof value !== 'boolean') {
          await transaction.rollback();
          return next(new AppError(`Field ${formStructure[key].label} must be a boolean`, 400));
        }
        validatedFormData[key] = value;
      }
    }

    const inspection = await db.Inspection.create({
      siteId,
      inspectionTypeId,
      securityOfficerName,
      date,
      formData: validatedFormData,
      status: 'completed',
      userId: req.user.id
    }, { transaction });

    if (faults && faults.length > 0) {
      for (const fault of faults) {
        if (fault.id) {
          if (fault.resolved) {
            await db.Fault.update({ status: 'closed' }, { 
              where: { id: fault.id },
              transaction 
            });
          }
          await db.InspectionFault.create({
            inspectionId: inspection.id,
            faultId: fault.id,
            fieldId: fault.fieldId
          }, { transaction });
        } else {
          const newFault = await db.Fault.create({
            siteId,
            description: fault.description,
            status: 'open',
            reportedBy: 'inspection',
            reporterName: securityOfficerName,
            entrepreneurName: req.user.entrepreneurName,
            siteName: fault.siteName,
            createdByInspectionId: inspection.id
          }, { transaction });
          await db.InspectionFault.create({
            inspectionId: inspection.id,
            faultId: newFault.id,
            fieldId: fault.fieldId
          }, { transaction });
        }
      }
    }

    await transaction.commit();

    const createdInspection = await db.Inspection.findByPk(inspection.id, {
      include: [
        { model: db.Site, attributes: ['name'] },
        { model: db.InspectionType, attributes: ['name'] },
        { 
          model: db.Fault,
          through: { model: db.InspectionFault, attributes: ['fieldId'] },
          attributes: ['id', 'description', 'status']
        }
      ]
    });

    res.status(201).json(createdInspection);
    logger.info(`New inspection created: ${inspection.id}`);
  } catch (error) {
    await transaction.rollback();
    logger.error('Error creating inspection:', error);
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
          through: { model: db.InspectionFault, attributes: ['fieldId'] },
          attributes: ['id', 'description']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    if (!inspections) {
      throw new AppError('No inspections found', 404, 'INSPECTIONS_NOT_FOUND');
    }

    res.json(inspections);
    logger.info('getAllInspections function called');
  } catch (error) {
    logger.error('Error getting all inspections:', error);
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
          through: { model: db.InspectionFault, attributes: ['fieldId'] },
          attributes: ['id', 'description']
        }
      ]
    });
    if (!inspection) {
      throw new AppError('Inspection not found', 404, 'INSPECTION_NOT_FOUND');
    }
    res.json(inspection);
    logger.info(`getInspection function called with id: ${req.params.id}`);
  } catch (error) {
    logger.error('Error getting inspection:', error);
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
          through: { model: db.InspectionFault, attributes: ['fieldId'] },
          attributes: ['id', 'description']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    if (!latestInspection) {
      throw new AppError('No inspection found for this site', 404, 'INSPECTION_NOT_FOUND');
    }

    res.json(latestInspection);
    logger.info(`getLatestInspection function called for site: ${siteId}`);
  } catch (error) {
    logger.error('Error getting latest inspection:', error);
    next(error);
  }
};

exports.updateInspection = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation error', 400, 'VALIDATION_ERROR'));
  }

  const transaction = await db.sequelize.transaction();

  try {
    const { siteId, inspectionTypeId, formData, status, linkedFaults } = req.body;
    const inspection = await db.Inspection.findByPk(req.params.id, { transaction });

    if (!inspection) {
      await transaction.rollback();
      return next(new AppError('Inspection not found', 404, 'INSPECTION_NOT_FOUND'));
    }

    const updates = {
      siteId: siteId !== undefined && siteId !== inspection.siteId ? siteId : undefined,
      inspectionTypeId: inspectionTypeId !== undefined && inspectionTypeId !== inspection.inspectionTypeId ? inspectionTypeId : undefined,
      formData: formData !== undefined && JSON.stringify(formData) !== JSON.stringify(inspection.formData) ? formData : undefined,
      status: status !== undefined && status !== inspection.status ? status : undefined
    };

    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    if (Object.keys(filteredUpdates).length > 0) {
      await inspection.update(filteredUpdates, { transaction });
    }

    if (linkedFaults) {
      await db.InspectionFault.destroy({ where: { inspectionId: inspection.id }, transaction });
      const faultLinks = linkedFaults.map(({ fieldId, faultId }) => ({
        inspectionId: inspection.id,
        fieldId,
        faultId
      }));
      await db.InspectionFault.bulkCreate(faultLinks, { transaction });
    }

    await transaction.commit();

    const updatedInspection = await db.Inspection.findByPk(inspection.id, {
      include: [
        { model: db.Site, attributes: ['name'] },
        { model: db.InspectionType, attributes: ['name'] },
        { 
          model: db.Fault,
          through: { model: db.InspectionFault, attributes: ['fieldId'] },
          attributes: ['id', 'description']
        }
      ]
    });

    res.json(updatedInspection);
    logger.info(`Inspection updated: ${inspection.id}`, { updates: filteredUpdates });
  } catch (error) {
    await transaction.rollback();
    logger.error('Error updating inspection:', error);
    next(new AppError('Error updating inspection', 500, 'UPDATE_ERROR'));
  }
};

exports.deleteInspection = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();

  try {
    const inspection = await db.Inspection.findByPk(req.params.id, { transaction });

    if (!inspection) {
      await transaction.rollback();
      return next(new AppError('Inspection not found', 404, 'INSPECTION_NOT_FOUND'));
    }

    await db.InspectionFault.destroy({ where: { inspectionId: inspection.id }, transaction });
    await inspection.destroy({ transaction });

    await transaction.commit();

    res.json({ message: 'Inspection deleted successfully' });
    logger.info(`Inspection deleted: ${req.params.id}`);
  } catch (error) {
    await transaction.rollback();
    logger.error('Error deleting inspection:', error);
    next(new AppError('Error deleting inspection', 500, 'DELETE_ERROR'));
  }
};

exports.getInspectionFormStructure = async (req, res, next) => {
  try {
    const inspectionTypeId = req.params.inspectionTypeId;
    const inspectionType = await db.InspectionType.findByPk(inspectionTypeId);

    if (!inspectionType) {
      throw new AppError('Inspection type not found', 404, 'INSPECTION_TYPE_NOT_FOUND');
    }

    const formStructure = JSON.parse(inspectionType.formStructure);

    res.json(formStructure);
    logger.info(`getInspectionFormStructure function called for inspection type: ${inspectionTypeId}`);
  } catch (error) {
    logger.error('Error getting inspection form structure:', error);
    next(error);
  }
};

// Call this function when the server starts to ensure default inspection types exist
exports.createDefaultInspectionTypes();
