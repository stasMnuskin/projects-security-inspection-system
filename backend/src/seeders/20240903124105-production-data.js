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

const ENTREPRENEURS_DATA = [
  {
    name: 'EDF',
    email: 'edf@example.com',
    password: 'EDF123',
    role: ROLES.entrepreneur,
    // sites: [
    //   'זמורות', 'משאבי שדה', 'אשלים', 'קטורה', 'תמנע', 'גבולות', 'תלמי אליהו',
    //   'כרם שלום', 'נחל עוז', 'בטחה', 'זוהר', 'כוכב מיכאל', 'משמר הנגב', 'סמר',
    //   'ברור חייל', 'מצפה', 'שורש', 'רנן', 'פדויים', 'מפלסים', 'גבים', 'בורגתא',
    //   'הודיה', 'גליה', 'לוחמי', 'מעברות', 'חצב', 'להב', 'כפר מימון', 'כמהין',
    //   'אביגדור', 'חצובה', 'חוגלה', 'לוחמי הגטאות', 'עין דור', 'יזרעל', 'סגולה'
    // ]
    sites:[]
  },
  {
    name: 'דוראל',
    email: 'doral@example.com',
    password: 'Doral123',
    role: ROLES.entrepreneur,
    // sites: [
    //   'כרמיה', 'כפר וורבורג', 'יהל', 'יוטבתה', 'גדות', 'גבולות דוראל', 'תל יוסף',
    //   'רשפים', 'עברון', 'גברעם'
    // ]
    sites:[]
  },
  {
    name: 'שיכון ובינוי',
    email: 'shikun@example.com',
    password: 'Shikun123',
    role: ROLES.entrepreneur,
    // sites: [
    //   'נבטים', 'שחר', 'ברוש', 'שיבולים', 'גבועלים', 'אורים'
    // ]
    sites:[]
  },
  {
    name: 'טרילט',
    email: 'trilet@example.com',
    password: 'Trilet123',
    role: ROLES.entrepreneur,
    // sites: ['נעמ"ה']
    sites
  },
  {
    name: 'ביוגז',
    email: 'biogaz@example.com',
    password: 'Biogaz123',
    role: ROLES.entrepreneur,
    // sites: ['ערד']
    sites:[]
  },
  {
    name: 'טרה',
    email: 'terra@example.com',
    password: 'Terra123',
    role: ROLES.entrepreneur,
    // sites: ['בית נקופה']
    sites:[]
  },
  {
    name: 'יבולי שער הנגב',
    email: 'yevulei@example.com',
    password: 'Yevulei123',
    role: ROLES.entrepreneur,
    // sites: ['צובה', 'פלמחים']
    sites:[]
  },
  {
    name: 'צבר',
    email: 'tzabar@example.com',
    password: 'Tzabar123',
    role: ROLES.entrepreneur,
    // sites: ['מעיין צבי']
    sites:[]
  }
];

// Service organizations data
const SERVICE_ORGANIZATIONS = [
  // {
  //   name: 'חברת אינטגרציה 1',
  //   type: 'integrator'
  // },
  // {
  //   name: 'חברת אינטגרציה 2',
  //   type: 'integrator'
  // },
  // {
  //   name: 'חברת אחזקה 1',
  //   type: 'maintenance'
  // },
  // {
  //   name: 'חברת אחזקה 2',
  //   type: 'maintenance'
  // }
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

      // Create service organizations
      const organizations = SERVICE_ORGANIZATIONS.map(org => ({
        name: org.name,
        type: org.type,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      await queryInterface.bulkInsert('Organizations', organizations, {});
      console.log('\nCreated Service Organizations');

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

      // Create entrepreneur users
      const entrepreneurs = await Promise.all(ENTREPRENEURS_DATA.map(async entrepreneur => ({
        name: entrepreneur.name,
        email: entrepreneur.email,
        password: await bcrypt.hash(entrepreneur.password, 10),
        role: entrepreneur.role,
        permissions: JSON.stringify(DEFAULT_ROLE_PERMISSIONS[entrepreneur.role]),
        createdAt: new Date(),
        updatedAt: new Date()
      })));

      await queryInterface.bulkInsert('Users', entrepreneurs, {});

      // Get the inserted entrepreneurs
      const users = await queryInterface.sequelize.query(
        `SELECT id, email FROM "Users" WHERE role = '${ROLES.entrepreneur}'`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      // Create sites for each entrepreneur
      const sites = [];
      users.forEach(user => {
        const entrepreneur = ENTREPRENEURS_DATA.find(e => e.email === user.email);
        if (entrepreneur) {
          entrepreneur.sites.forEach(siteName => {
            sites.push({
              name: siteName,
              type: 'inductive_fence',
              entrepreneurId: user.id,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          });
        }
      });

      await queryInterface.bulkInsert('Sites', sites, {});

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

      // Log created entrepreneurs
      console.log('\nCreated Entrepreneurs:');
      ENTREPRENEURS_DATA.forEach(e => {
        console.log(`${e.name}:`, { email: e.email, password: e.password });
      });

      // Log created organizations
      console.log('\nCreated Service Organizations:');
      SERVICE_ORGANIZATIONS.forEach(org => {
        console.log(`${org.name} (${org.type})`);
      });
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
