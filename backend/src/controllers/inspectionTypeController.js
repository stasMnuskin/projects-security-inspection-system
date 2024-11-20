const db = require('../models');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

exports.getEnabledFields = async (req, res, next) => {
  try {
    const { siteId } = req.params;
    const { type } = req.query;

    if (!type || !['inspection', 'drill'].includes(type)) {
      return next(new AppError('Type must be either inspection or drill', 400));
    }

    const site = await db.Site.findByPk(siteId);
    if (!site) {
      return next(new AppError('Site not found', 404));
    }

    let fields;
    if (type === 'drill') {
      // For drills, get fields from drill type
      fields = await db.InspectionType.getDrillTypeFields();
    } else {
      // For inspections, get fields based on site type
      fields = await db.InspectionType.getTableFields(site.type);
    }

    res.json({
      status: 'success',
      data: {
        fields
      }
    });
  } catch (error) {
    logger.error('Error getting enabled fields:', error);
    next(new AppError('Error fetching enabled fields', 500));
  }
};
exports.createInspectionType = async (req, res, next) => {
  try {
    const { name, type, formStructure } = req.body;

    if (!name || !type) {
      return next(new AppError('Name and type are required', 400));
    }

    if (!['inspection', 'drill'].includes(type)) {
      return next(new AppError('Type must be either inspection or drill', 400));
    }

    // For drills, validate required fields
    if (type === 'drill') {
      const requiredFields = ['date', 'time', 'securityOfficer'];
      const hasAllRequired = requiredFields.every(field => 
        formStructure.some(f => f.id === field && f.required)
      );
      if (!hasAllRequired) {
        return next(new AppError('Drill must include required fields: date, time, securityOfficer', 400));
      }
    }

    // Ensure all fields have showInForm property
    const updatedFormStructure = formStructure.map(field => ({
      ...field,
      showInForm: field.showInForm !== false
    }));

    const inspectionType = await db.InspectionType.create({
      name,
      type,
      formStructure: updatedFormStructure
    });

    logger.info(`New inspection type created: ${name} (${type})`);

    res.status(201).json({
      status: 'success',
      data: inspectionType
    });
  } catch (error) {
    logger.error('Error in createInspectionType:', error);
    next(new AppError('Error creating inspection type', 500));
  }
};

exports.getFieldTypes = async (req, res, next) => {
  try {
    // Return predefined field types
    const types = [
      { value: 'text', label: 'טקסט' },
      { value: 'textarea', label: 'טקסט ארוך' },
      { value: 'boolean', label: 'תקין/לא תקין' },
      { value: 'date', label: 'תאריך' },
      { value: 'time', label: 'שעה' },
      { value: 'select', label: 'בחירה מרשימה' }
    ];

    res.json({
      status: 'success',
      data: {
        types
      }
    });
  } catch (error) {
    logger.error('Error getting field types:', error);
    next(new AppError('Error fetching field types', 500));
  }
};

exports.getAvailableFields = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentType = await db.InspectionType.findByPk(id);
    
    if (!currentType) {
      return next(new AppError('Inspection type not found', 404));
    }

    // Get current type's fields
    const currentFields = Array.isArray(currentType.formStructure) ? currentType.formStructure : [];
    
    // Create a map of fields with their enabled status
    const fields = currentFields.map(field => ({
      ...field,
      enabled: field.enabled || false,
      showInForm: field.showInForm !== false
    }));

    res.json({
      status: 'success',
      data: {
        fields
      }
    });
  } catch (error) {
    logger.error('Error getting available fields:', error);
    next(new AppError('Error fetching available fields', 500));
  }
};

exports.updateFieldStatus = async (req, res, next) => {
  try {
    const { id, fieldId } = req.params;
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return next(new AppError('Enabled status must be a boolean', 400));
    }

    const inspectionType = await db.InspectionType.findByPk(id);
    if (!inspectionType) {
      return next(new AppError('Inspection type not found', 404));
    }

    // For drills, don't allow disabling required fields
    if (inspectionType.type === 'drill') {
      const field = inspectionType.formStructure.find(f => f.id === fieldId);
      if (field && field.required && !enabled) {
        return next(new AppError('Cannot disable required drill field', 400));
      }
    }

    await inspectionType.updateFieldStatus(fieldId, enabled);

    res.json({
      status: 'success',
      message: `Field ${enabled ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    logger.error('Error updating field status:', error);
    next(new AppError('Error updating field status', 500));
  }
};

exports.addCustomField = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { label, type: fieldType, fieldType: formType, id: fieldId } = req.body;

    if (!label || !fieldType || !fieldId) {
      return next(new AppError('Label, type and id are required', 400));
    }

    const inspectionType = await db.InspectionType.findByPk(id);
    if (!inspectionType) {
      return next(new AppError('Inspection type not found', 404));
    }

    const field = {
      id: fieldId,
      label,
      type: fieldType,
      fieldType: formType || inspectionType.type,
      required: false,
      showInForm: true
    };

    // Add field to all inspection types of the same type
    const allTypes = await db.InspectionType.findAll({
      where: { type: inspectionType.type }
    });

    for (const type of allTypes) {
      let typeFields = Array.isArray(type.formStructure) ? type.formStructure : [];
      
      // Add field if it doesn't exist
      if (!typeFields.some(f => f.id === field.id)) {
        typeFields.push({
          ...field,
          enabled: type.id === parseInt(id) // Enable only for current type, disable for others
        });
        type.formStructure = typeFields;
        await type.save();
      }
    }

    res.json({
      status: 'success',
      message: 'Field added successfully'
    });
  } catch (error) {
    logger.error('Error adding field:', error);
    next(new AppError(error.message, 500));
  }
};

exports.deleteField = async (req, res, next) => {
  try {
    const { id, fieldId } = req.params;

    const inspectionType = await db.InspectionType.findByPk(id);
    if (!inspectionType) {
      return next(new AppError('Inspection type not found', 404));
    }

    // For drills, don't allow deleting required fields
    if (inspectionType.type === 'drill') {
      const field = inspectionType.formStructure.find(f => f.id === fieldId);
      if (field && field.required) {
        return next(new AppError('Cannot delete required drill field', 400));
      }
    }

    await inspectionType.deleteField(fieldId);

    res.json({
      status: 'success',
      message: 'Field deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting field:', error);
    next(new AppError('Error deleting field', 500));
  }
};

exports.getAllInspectionTypes = async (req, res, next) => {
  try {
    const { type } = req.query;
    const where = type ? { type } : {};

    const inspectionTypes = await db.InspectionType.findAll({
      where,
      attributes: ['id', 'name', 'type', 'formStructure']
    });
    
    if (!inspectionTypes || inspectionTypes.length === 0) {
      logger.warn('No inspection types found');
      return res.status(404).json({ message: 'No inspection types found' });
    }

    res.json({
      status: 'success',
      data: inspectionTypes,
      count: inspectionTypes.length
    });
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

    res.json({
      status: 'success',
      data: inspectionType
    });
  } catch (error) {
    logger.error('Error in getInspectionType:', error);
    return next(new AppError('Error fetching inspection type', 500));
  }
};

exports.updateInspectionType = async (req, res, next) => {
  try {
    const { name, type, formStructure } = req.body;
    const inspectionType = await db.InspectionType.findByPk(req.params.id);
    if (!inspectionType) {
      return next(new AppError('Inspection type not found', 404));
    }

    // For drills, validate required fields
    if (type === 'drill' && formStructure) {
      const requiredFields = ['date', 'time', 'securityOfficer'];
      const hasAllRequired = requiredFields.every(field => 
        formStructure.some(f => f.id === field && f.required)
      );
      if (!hasAllRequired) {
        return next(new AppError('Drill must include required fields: date, time, securityOfficer', 400));
      }
    }

    // Update fields
    if (name) inspectionType.name = name;
    if (type && ['inspection', 'drill'].includes(type)) {
      inspectionType.type = type;
    }
    if (formStructure) {
      // Ensure all fields have showInForm property
      const updatedFormStructure = formStructure.map(field => ({
        ...field,
        showInForm: field.showInForm !== false
      }));
      inspectionType.formStructure = updatedFormStructure;
    }

    await inspectionType.save();

    res.json({
      status: 'success',
      data: inspectionType
    });
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

    // Don't allow deleting drill types
    if (inspectionType.type === 'drill') {
      return next(new AppError('Cannot delete drill types', 400));
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

    // Check if this is a routine inspection and site type matches
    if (inspectionType.name.includes('ביקורת שגרתית')) {
      const isValidSiteType = (
        (site.type === 'radar' && inspectionType.name.includes('מכ"מ')) ||
        (site.type === 'inductive_fence' && inspectionType.name.includes('גדר'))
      );

      if (!isValidSiteType) {
        return next(new AppError('Invalid inspection type for this site type', 400));
      }
    }

    // Get only enabled non-automatic fields for the form
    const fields = await inspectionType.getFormFields();

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

exports.getInspectionTypesBySite = async (req, res, next) => {
  try {
    const { siteId } = req.params;
    const { type } = req.query;

    logger.info(`Fetching inspection types for siteId: ${siteId}, type: ${type}`);

    // Validate type parameter
    if (!type || !['inspection', 'drill'].includes(type)) {
      return next(new AppError('Type must be either inspection or drill', 400));
    }

    // Get site
    const site = await db.Site.findByPk(siteId);
    if (!site) {
      logger.error(`Site not found for siteId: ${siteId}`);
      return next(new AppError('Site not found', 404));
    }

    // Get inspection types
    const inspectionTypes = await db.InspectionType.findAll({
      where: { type },
      attributes: ['id', 'name', 'type', 'formStructure']
    });

    // Filter inspection types based on site type
    const filteredTypes = inspectionTypes.filter(inspType => {
      // Allow all non-routine inspections
      if (!inspType.name.includes('ביקורת שגרתית')) return true;

      // Filter routine inspections based on site type
      if (site.type === 'radar') {
        return inspType.name.includes('מכ"מ');
      } else if (site.type === 'inductive_fence') {
        return inspType.name.includes('גדר');
      }

      return false;
    });

    logger.info(`Found ${filteredTypes.length} inspection types for site ${siteId}`);

    res.json({
      status: 'success',
      data: filteredTypes
    });
  } catch (error) {
    logger.error('Error in getInspectionTypesBySite:', error);
    next(new AppError('Error fetching inspection types', 500));
  }
};

exports.addCustomField = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { label, type: fieldType, fieldType: formType, id: fieldId } = req.body;

    if (!label || !fieldType || !fieldId) {
      return next(new AppError('Label, type and id are required', 400));
    }

    const inspectionType = await db.InspectionType.findByPk(id);
    if (!inspectionType) {
      return next(new AppError('Inspection type not found', 404));
    }

    const field = {
      id: fieldId,
      label,
      type: fieldType,
      fieldType: formType || inspectionType.type,
      required: false,
      showInForm: true
    };

    // Add field to all inspection types (disabled by default)
    await inspectionType.addCustomField(field);

    res.json({
      status: 'success',
      message: 'Field added successfully'
    });
  } catch (error) {
    logger.error('Error adding field:', error);
    next(new AppError(error.message, 500));
  }
};
