'use strict';
const bcrypt = require('bcrypt');
const { ROLES, PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } = require('../constants/roles');

// Admin user data
const ADMIN_DATA = {
  name: 'מנהל על',
  email: 'ssllmm290986@gmail.com',
  password: 'Admin123',
  role: ROLES.admin,
  permissions: Object.values(PERMISSIONS)
};

// Common fields for inspections
const INSPECTION_COMMON_FIELDS = [
  { 
    id: 'date', 
    label: 'תאריך', 
    type: 'date', 
    required: true, 
    autoFill: true, 
    fieldType: 'inspection',
    showInForm: false,
    enabled: true
  },
  { 
    id: 'time', 
    label: 'שעה', 
    type: 'time', 
    required: true, 
    autoFill: true, 
    fieldType: 'inspection',
    showInForm: false,
    enabled: true
  },
  { 
    id: 'securityOfficer',
    label: 'שם הקב"ט', 
    type: 'text', 
    required: true, 
    autoFill: true, 
    fieldType: 'inspection',
    showInForm: false,
    enabled: true
  }
];

// Common fields for drills
const DRILL_COMMON_FIELDS = [
  { 
    id: 'date', 
    label: 'תאריך', 
    type: 'date', 
    required: true, 
    autoFill: true, 
    fieldType: 'drill',
    showInForm: false,
    enabled: true
  },
  { 
    id: 'time', 
    label: 'שעה', 
    type: 'time', 
    required: true, 
    autoFill: true, 
    fieldType: 'drill',
    showInForm: false,
    enabled: true
  },
  { 
    id: 'securityOfficer', 
    label: 'שם הקב"ט', 
    type: 'text', 
    required: true, 
    autoFill: true, 
    fieldType: 'drill',
    showInForm: false,
    enabled: true
  }
];

// Fields for inductive fence sites
const INDUCTIVE_FENCE_FIELDS = [
  { id: 'accessRoute', label: 'ציר גישה', type: 'boolean', required: true, fieldType: 'inspection', showInForm: true, enabled: true },
  { id: 'facilityGates', label: 'שערי מתקן', type: 'boolean', required: true, fieldType: 'inspection', showInForm: true, enabled: true },
  { id: 'fence', label: 'גדר', type: 'text', required: true, fieldType: 'inspection', showInForm: true, enabled: true },
  { id: 'cameras', label: 'מצלמות', type: 'text', required: true, fieldType: 'inspection', showInForm: true, enabled: true },
  { id: 'publicAddress', label: 'כריזה', type: 'boolean', required: true, fieldType: 'inspection', showInForm: true, enabled: true },
  { id: 'lighting', label: 'תאורה', type: 'boolean', required: true, fieldType: 'inspection', showInForm: true, enabled: true },
  { id: 'vegetation', label: 'עשביה', type: 'boolean', required: true, fieldType: 'inspection', showInForm: true, enabled: true },
  { id: 'notes', label: 'הערות', type: 'textarea', required: false, fieldType: 'inspection', showInForm: true, enabled: true }
];

// Fields for radar sites
const RADAR_FIELDS = [
  { id: 'accessRoute', label: 'ציר גישה', type: 'boolean', required: true, fieldType: 'inspection', showInForm: true, enabled: true },
  { id: 'facilityGates', label: 'שערי מתקן', type: 'boolean', required: true, fieldType: 'inspection', showInForm: true, enabled: true },
  { id: 'cameras', label: 'מצלמות', type: 'text', required: true, fieldType: 'inspection', showInForm: true, enabled: true },
  { id: 'publicAddress', label: 'כריזה', type: 'boolean', required: true, fieldType: 'inspection', showInForm: true, enabled: true },
  { id: 'lighting', label: 'תאורה', type: 'boolean', required: true, fieldType: 'inspection', showInForm: true, enabled: true },
  { id: 'vegetation', label: 'עשביה', type: 'boolean', required: true, fieldType: 'inspection', showInForm: true, enabled: true },
  { id: 'criticalComponents', label: 'רכיבים קריטיים', type: 'text', required: true, fieldType: 'inspection', showInForm: true, enabled: true },
  { id: 'notes', label: 'הערות', type: 'textarea', required: false, fieldType: 'inspection', showInForm: true, enabled: true }
];

// Fields for simple inspections (police/energy)
const SIMPLE_INSPECTION_FIELDS = [
  { id: 'notes', label: 'הערות', type: 'textarea', required: false, fieldType: 'inspection', showInForm: true, enabled: true }
];

// Define inspection types
const INSPECTION_TYPES = [
  {
    name: 'ביקורת משטרה',
    type: 'inspection',
    formStructure: [
      ...INSPECTION_COMMON_FIELDS,
      ...SIMPLE_INSPECTION_FIELDS
    ]
  },
  {
    name: 'ביקורת משרד האנרגיה',
    type: 'inspection',
    formStructure: [
      ...INSPECTION_COMMON_FIELDS,
      ...SIMPLE_INSPECTION_FIELDS
    ]
  },
  {
    name: 'ביקורת שגרתית - אתר מכ"מ',
    type: 'inspection',
    formStructure: [
      ...INSPECTION_COMMON_FIELDS,
      ...RADAR_FIELDS
    ]
  },
  {
    name: 'ביקורת שגרתית - אתר עם גדר',
    type: 'inspection',
    formStructure: [
      ...INSPECTION_COMMON_FIELDS,
      ...INDUCTIVE_FENCE_FIELDS
    ]
  },
  {
    name: 'תרגיל',
    type: 'drill',
    formStructure: [
      ...DRILL_COMMON_FIELDS,
      {
        id: 'drill_type',
        label: 'סוג תרגיל',
        type: 'select',
        options: ['גדר ללא עדכון', 'כניסה ללא עדכון', 'אחר'],
        required: true,
        enabled: true,
        fieldType: 'drill',
        showInForm: true
      },
      {
        id: 'status',
        label: 'סטטוס',
        type: 'select',
        options: ['תקין', 'לא תקין'],
        required: true,
        enabled: true,
        fieldType: 'drill',
        showInForm: true
      },
      {
        id: 'notes',
        label: 'הערות',
        type: 'textarea',
        required: false,
        enabled: true,
        fieldType: 'drill',
        showInForm: true,
        requiredIf: {
          field: 'status',
          value: 'לא תקין'
        }
      }
    ]
  }
];

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Create role permissions
      const rolePermissions = Object.entries(DEFAULT_ROLE_PERMISSIONS).map(([role, permissions]) => ({
        role,
        permissions: JSON.stringify(permissions),
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      await queryInterface.bulkInsert('RolePermissions', rolePermissions, {});
      console.log('\nCreated Role Permissions');

      // Create admin user
      const adminUser = {
        name: ADMIN_DATA.name,
        email: ADMIN_DATA.email,
        password: await bcrypt.hash(ADMIN_DATA.password, 10),
        role: ADMIN_DATA.role,
        permissions: JSON.stringify(ADMIN_DATA.permissions),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await queryInterface.bulkInsert('Users', [adminUser], {});
      console.log('\nCreated Admin User:', { email: ADMIN_DATA.email, password: ADMIN_DATA.password });

      // Create inspection types
      const inspectionTypes = INSPECTION_TYPES.map(type => ({
        name: type.name,
        type: type.type,
        formStructure: JSON.stringify(type.formStructure),
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      await queryInterface.bulkInsert('InspectionTypes', inspectionTypes, {});
      console.log('\nCreated Inspection Types');
    } catch (error) {
      console.error('Seeding error:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('InspectionTypes', null, {});
    await queryInterface.bulkDelete('Sites', null, {});
    await queryInterface.bulkDelete('Users', null, {});
    await queryInterface.bulkDelete('Organizations', null, {});
    await queryInterface.bulkDelete('RolePermissions', null, {});
  }
};
