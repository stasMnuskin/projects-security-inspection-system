const { validationResult } = require('express-validator');
const db = require('../models');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

exports.getAllInspections = async (req, res, next) => {
  try {
    const { role, id: userId, organizationId } = req.user;
    const { startDate, endDate, site, type, maintenanceOrg, integratorOrg, securityOfficer } = req.query;

    let whereClause = {};

    // Handle date filters
    if (startDate && endDate) {
      whereClause.createdAt = {
        [db.Sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      whereClause.createdAt = {
        [db.Sequelize.Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      whereClause.createdAt = {
        [db.Sequelize.Op.lte]: new Date(endDate)
      };
    }

    // Handle inspection type filter
    if (type) {
      whereClause.type = type;
    }

    // Handle site access based on user role
    let siteWhere = {};
    if (role === 'entrepreneur') {
      siteWhere.entrepreneurId = userId;
    }
    
    if (site) {
      siteWhere.id = site;
    }

    // Build includes with proper filtering
    const includes = [
      {
        model: db.Site,
        where: siteWhere,
        attributes: ['id', 'name'],
        include: [
          {
            model: db.Organization,
            as: 'serviceOrganizations',
            attributes: ['id', 'name', 'type'],
            ...(maintenanceOrg || integratorOrg ? {
              where: {
                [db.Sequelize.Op.or]: [
                  maintenanceOrg ? { id: maintenanceOrg, type: 'maintenance' } : null,
                  integratorOrg ? { id: integratorOrg, type: 'integrator' } : null
                ].filter(Boolean)
              }
            } : {})
          }
        ]
      },
      { 
        model: db.InspectionType, 
        attributes: ['id', 'name', 'type', 'formStructure']
      }
    ];

    // Handle organization-specific access
    if (role === 'integrator' || role === 'maintenance') {
      includes[0].include[0].where = {
        id: organizationId,
        type: role === 'integrator' ? 'integrator' : 'maintenance'
      };
    }

    // Handle security officer filter
    if (securityOfficer) {
      whereClause['$formData.securityOfficer$'] = securityOfficer;
    }

    const inspections = await db.Inspection.findAll({
      where: whereClause,
      include: includes,
      order: [['createdAt', 'DESC']]
    });

    res.json(inspections);
    logger.info(`getAllInspections function called by ${role}`);
  } catch (error) {
    logger.error('Error getting inspections:', error);
    next(new AppError('Error fetching inspections', 500));
  }
};

exports.createInspection = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();

  try {
    const { siteId, inspectionTypeId, formData, type } = req.body;

    if (!siteId || !inspectionTypeId || !formData) {
      await transaction.rollback();
      return next(new AppError('Missing required fields', 400));
    }

    const user = await db.User.findByPk(req.user.id);
    formData.securityOfficer = user.name;

    if (type === 'drill') {
      if (!formData.drill_type) {
        await transaction.rollback();
        return next(new AppError('Missing drill type', 400));
      }

      if (formData.drill_type !== 'אחר' && !formData.status) {
        await transaction.rollback();
        return next(new AppError('Status is required for this drill type', 400));
      }

      const notesRequired = formData.drill_type === 'אחר' || formData.status === 'לא תקין';
      if (notesRequired && !formData.notes?.trim()) {
        await transaction.rollback();
        return next(new AppError('Notes are required for this drill type/status', 400));
      }
    }

    const inspectionType = await db.InspectionType.findByPk(inspectionTypeId);
    if (!inspectionType) {
      await transaction.rollback();
      return next(new AppError('Inspection type not found', 400));
    }

    try {
      
      const inspection = await db.Inspection.create({
        siteId,
        inspectionTypeId,
        formData,
        type,  
        userId: req.user.id
      }, { transaction });

      const createdInspection = await db.Inspection.findByPk(inspection.id, {
        include: [
          { 
            model: db.Site, 
            attributes: ['id', 'name', 'entrepreneurId']
          },
          { 
            model: db.InspectionType, 
            attributes: ['id', 'name', 'type', 'formStructure']
          }
        ],
        transaction
      });

      await transaction.commit();

      res.status(201).json(createdInspection);
      logger.info(`New ${type} created: ${inspection.id}`);
    } catch (error) {
      await transaction.rollback();
      if (error.name === 'SequelizeValidationError') {
        return next(new AppError(error.message, 400));
      }
      throw error; 
    }
  } catch (error) {
    await transaction.rollback();
    logger.error('Error creating inspection:', error);
    next(new AppError(error.message || 'Error creating inspection', 500));
  }
};


exports.getInspection = async (req, res, next) => {
  try {
    const inspection = await db.Inspection.findByPk(req.params.id, {
      include: [
        { model: db.Site, attributes: ['name'] },
        { model: db.InspectionType, attributes: ['name'] }
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

exports.updateInspection = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation error', 400, 'VALIDATION_ERROR'));
  }

  const transaction = await db.sequelize.transaction();

  try {
    const { siteId, inspectionTypeId, formData } = req.body;
    const inspection = await db.Inspection.findByPk(req.params.id, { transaction });

    if (!inspection) {
      await transaction.rollback();
      return next(new AppError('Inspection not found', 404, 'INSPECTION_NOT_FOUND'));
    }

    const updates = {
      siteId: siteId !== undefined && siteId !== inspection.siteId ? siteId : undefined,
      inspectionTypeId: inspectionTypeId !== undefined && inspectionTypeId !== inspection.inspectionTypeId ? inspectionTypeId : undefined,
      formData: formData !== undefined && JSON.stringify(formData) !== JSON.stringify(inspection.formData) ? formData : undefined
    };

    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    if (Object.keys(filteredUpdates).length > 0) {
      await inspection.update(filteredUpdates, { transaction });
    }

    await transaction.commit();

    const updatedInspection = await db.Inspection.findByPk(inspection.id, {
      include: [
        { model: db.Site, attributes: ['name'] },
        { model: db.InspectionType, attributes: ['name'] }
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

exports.saveDraftInspection = async (req, res, next) => {
  try {
    const { id, siteId, inspectionTypeId, formData, newFaults, resolvedFaults } = req.body;
    const userId = req.user.id;

    let draftInspection;
    if (id) {
      draftInspection = await db.DraftInspection.findOne({ where: { id, userId } });
      if (!draftInspection) {
        return next(new AppError('Draft inspection not found', 404));
      }
      await draftInspection.update({ siteId, inspectionTypeId, formData, newFaults, resolvedFaults });
    } else {
      draftInspection = await db.DraftInspection.create({
        userId,
        siteId,
        inspectionTypeId,
        formData,
        newFaults,
        resolvedFaults
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        id: draftInspection.id,
        message: 'Draft inspection saved successfully'
      }
    });
  } catch (error) {
    logger.error('Error in saveDraftInspection:', error);
    next(new AppError('Error saving draft inspection', 500));
  }
};

exports.getDraftInspection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const draftInspection = await db.DraftInspection.findOne({
      where: { id, userId },
      include: [
        { model: db.Site, as: 'site' },
        { model: db.InspectionType, as: 'inspectionType' }
      ]
    });

    if (!draftInspection) {
      return next(new AppError('Draft inspection not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: draftInspection
    });
  } catch (error) {
    logger.error('Error in getDraftInspection:', error);
    next(new AppError('Error retrieving draft inspection', 500));
  }
};

exports.deleteDraftInspection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const draftInspection = await db.DraftInspection.findOne({ where: { id, userId } });
    if (!draftInspection) {
      return next(new AppError('Draft inspection not found', 404));
    }

    await draftInspection.destroy();

    res.status(200).json({
      status: 'success',
      message: 'Draft inspection deleted successfully'
    });
  } catch (error) {
    logger.error('Error in deleteDraftInspection:', error);
    next(new AppError('Error deleting draft inspection', 500));
  }
};

exports.getUserDraftInspections = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const draftInspections = await db.DraftInspection.findAll({
      where: { userId },
      include: [
        { model: db.Site, as: 'site' },
        { model: db.InspectionType, as: 'inspectionType' }
      ],
      order: [['updatedAt', 'DESC']]
    });

    res.status(200).json({
      status: 'success',
      data: draftInspections
    });
  } catch (error) {
    logger.error('Error in getUserDraftInspections:', error);
    next(new AppError('Error retrieving user draft inspections', 500));
  }
};

exports.getLatestInspection = async (req, res, next) => {
  try {
    let inspection;

    if (req.params.id === 'latest') {
      inspection = await db.Inspection.findOne({
        order: [['createdAt', 'DESC']],
        include: [
          { model: db.Site, attributes: ['name'] },
          { model: db.InspectionType, attributes: ['name'] }
        ]
      });
    } else {
      inspection = await db.Inspection.findByPk(req.params.id, {
        include: [
          { model: db.Site, attributes: ['name'] },
          { model: db.InspectionType, attributes: ['name'] }
        ]
      });
    }

    if (!inspection) {
      return next(new AppError('No inspections found', 404, 'NO_INSPECTIONS'));
    }

    res.json(inspection);
    logger.info(`getLatestInspection function called with param: ${req.params.id}`);
  } catch (error) {
    logger.error('Error getting inspection:', error);
    next(new AppError('Error fetching inspection', 500, 'FETCH_INSPECTION_ERROR'));
  }
};

exports.getSitesByEntrepreneur = async (req, res, next) => {
  try {
    const { entrepreneurId } = req.params;
    
    const sites = await db.Site.findAll({
      where: { entrepreneurId: entrepreneurId },
      attributes: ['id', 'name']
    });

    if (!sites || sites.length === 0) {
      return res.status(404).json({
        error: 'No sites found',
        message: `No sites found for entrepreneur with id ${entrepreneurId}.`
      });
    }

    res.json(sites);
    logger.info(`getSitesByEntrepreneur function called for entrepreneur: ${entrepreneurId}`);
  } catch (error) {
    logger.error('Error getting sites by entrepreneur:', error);
    next(new AppError('Error fetching sites', 500, 'FETCH_SITES_ERROR'));
  }
};

exports.getLatestRoutineInspection = async (req, res, next) => {
  try {
    const latestRoutineInspection = await db.Inspection.findOne({
      where: {
        siteId: req.params.siteId,
        type: 'inspection',
        '$InspectionType.name$': 'ביקורת שגרתית'
      },
      include: [
        { model: db.Site, attributes: ['name'] },
        { model: db.InspectionType, attributes: ['name'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    if (!latestRoutineInspection) {
      return next(new AppError('No routine inspections found for this site', 404, 'NO_ROUTINE_INSPECTIONS'));
    }

    res.json(latestRoutineInspection);
    logger.info(`getLatestRoutineInspection function called for site: ${req.params.siteId}`);
  } catch (error) {
    logger.error('Error getting latest routine inspection:', error);
    next(new AppError('Error fetching latest routine inspection', 500, 'FETCH_LATEST_ROUTINE_INSPECTION_ERROR'));
  }
};

exports.getDrillSuccessRate = async (req, res, next) => {
  try {
    const drills = await db.Inspection.findAll({
      where: {
        siteId: req.params.siteId,
        type: 'drill'
      },
      include: [{ 
        model: db.InspectionType, 
        attributes: ['name', 'formStructure'] 
      }]
    });

    if (drills.length === 0) {
      return res.json({ successRate: 0, totalDrills: 0 });
    }

    const successfulDrills = drills.filter(drill => {
      const successField = drill.InspectionType.formStructure.find(field => field.id === 'success');
      if (!successField) return false;
      
      const successValue = drill.formData.success;
      return successField.options && successField.options[0] === successValue; 
    }).length;

    const successRate = (successfulDrills / drills.length) * 100;

    res.json({
      successRate: Math.round(successRate * 100) / 100,
      totalDrills: drills.length
    });
    logger.info(`getDrillSuccessRate function called for site: ${req.params.siteId}`);
  } catch (error) {
    logger.error('Error calculating drill success rate:', error);
    next(new AppError('Error calculating drill success rate', 500));
  }
};

exports.getLatestInspections = async (req, res, next) => {
  try {
    const latestInspections = await db.Inspection.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [
        { model: db.Site, attributes: ['name'] },
        { model: db.InspectionType, attributes: ['name'] }
      ]
    });

    res.json(latestInspections);
    logger.info('getLatestInspections function called');
  } catch (error) {
    logger.error('Error getting latest inspections:', error);
    next(new AppError('Error fetching latest inspections', 500, 'FETCH_LATEST_INSPECTIONS_ERROR'));
  }
};

exports.getInspectionsBySite = async (req, res, next) => {
  try {
    const { siteId } = req.params;
    const { type, startDate, endDate, drillType, maintenanceOrg, integratorOrg } = req.query;

    if (!siteId) {
      return next(new AppError('Site ID is required', 400));
    }

    const whereClause = { siteId };
    
    if (type) {
      whereClause.type = type;
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt[db.Sequelize.Op.gte] = new Date(startDate);
      }
      if (endDate) {
        whereClause.createdAt[db.Sequelize.Op.lte] = new Date(endDate);
      }
    }

    if (drillType && type === 'drill') {
      whereClause['$InspectionType.name$'] = drillType;
    }

    const siteInclude = {
      model: db.Site,
      attributes: ['id', 'name', 'entrepreneurId'],
      include: [{
        model: db.User,
        as: 'entrepreneur',
        attributes: ['id', 'name'],
        include: [{
          model: db.Organization,
          as: 'organization',
          attributes: ['id', 'name', 'type']
        }]
      }]
    };

    if (maintenanceOrg || integratorOrg) {
      siteInclude.include.push({
        model: db.Organization,
        as: 'serviceOrganizations',  
        where: {
          [db.Sequelize.Op.or]: [
            maintenanceOrg ? { id: maintenanceOrg, type: 'maintenance' } : null,
            integratorOrg ? { id: integratorOrg, type: 'integrator' } : null
          ].filter(Boolean)
        },
        required: true
      });
    }

    // Fetch inspections with associations
    const inspections = await db.Inspection.findAll({
      where: whereClause,
      include: [
        siteInclude,
        { 
          model: db.InspectionType, 
          attributes: ['id', 'name', 'type', 'formStructure']
        },
        {
          model: db.User,
          as: 'inspector',
          attributes: ['id', 'name'],
          include: [{
            model: db.Organization,
            as: 'organization',
            attributes: ['id', 'name', 'type']
          }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Return empty array instead of error when no inspections found
    res.json(inspections || []);
    logger.info(`getInspectionsBySite function called for site: ${siteId}, type: ${type}, drillType: ${drillType}`);
  } catch (error) {
    logger.error('Error getting inspections by site:', error);
    // Send more detailed error information
    next(new AppError(`Error fetching inspections: ${error.message}`, 500));
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

    const fields = Array.isArray(inspectionType.formStructure) ? 
      inspectionType.formStructure.filter(field => field.enabled && field.showInForm !== false) : [];

    logger.info(`Fetched inspection form structure for siteId: ${siteId}, inspectionTypeId: ${inspectionTypeId}`);
    res.json({
      status: 'success',
      data: {
        inspectionType: inspectionType.name,
        type: inspectionType.type,
        siteId: site.id,
        siteName: site.name,
        siteType: site.type,
        fields
      }
    });
  } catch (error) {
    logger.error('Error in getInspectionFormStructure:', error);
    next(new AppError('Error fetching inspection form structure', 500));
  }
};
