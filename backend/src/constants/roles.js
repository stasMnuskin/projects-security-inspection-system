// Role definitions
const ROLES = {
  admin: 'admin',
  security_officer: 'security_officer',
  entrepreneur: 'entrepreneur',
  integrator: 'integrator',
  maintenance: 'maintenance',
  control_center: 'control_center'
};

// Permission definitions
const PERMISSIONS = {
  // System permissions
  ADMIN: 'admin',
  DASHBOARD: 'dashboard',
  
  // Inspection permissions
  NEW_INSPECTION: 'new_inspection',
  VIEW_INSPECTIONS: 'inspections',
  
  // Fault permissions
  NEW_FAULT: 'new_fault',
  VIEW_FAULTS: 'faults',
  UPDATE_FAULT_STATUS: 'update_fault_status',
  UPDATE_FAULT_DETAILS: 'update_fault_details',
  
  // Drill permissions
  NEW_DRILL: 'new_drill',
  VIEW_DRILLS: 'drills'
};

// List of all available permissions
const ALL_PERMISSIONS = Object.values(PERMISSIONS);

// Default role permissions
const DEFAULT_ROLE_PERMISSIONS = {
  [ROLES.admin]: ALL_PERMISSIONS,
  [ROLES.security_officer]: [
    PERMISSIONS.VIEW_INSPECTIONS,
    PERMISSIONS.NEW_INSPECTION,
    PERMISSIONS.VIEW_FAULTS,
    PERMISSIONS.NEW_FAULT,
    PERMISSIONS.VIEW_DRILLS,
    PERMISSIONS.NEW_DRILL
  ],
  [ROLES.entrepreneur]: [
    PERMISSIONS.VIEW_INSPECTIONS,
    PERMISSIONS.VIEW_FAULTS,
    PERMISSIONS.VIEW_DRILLS,
    PERMISSIONS.DASHBOARD
  ],
  [ROLES.integrator]: [
    PERMISSIONS.VIEW_FAULTS,
    PERMISSIONS.UPDATE_FAULT_STATUS,
    PERMISSIONS.UPDATE_FAULT_DETAILS
  ],
  [ROLES.maintenance]: [
    PERMISSIONS.VIEW_FAULTS,
    PERMISSIONS.UPDATE_FAULT_STATUS,
    PERMISSIONS.UPDATE_FAULT_DETAILS
  ],
  [ROLES.control_center]: [
    PERMISSIONS.VIEW_INSPECTIONS,
    PERMISSIONS.VIEW_FAULTS,
    PERMISSIONS.NEW_FAULT,
    PERMISSIONS.UPDATE_FAULT_STATUS
  ]
};

// Hebrew translations for roles
const ROLE_TRANSLATIONS = {
  [ROLES.admin]: 'מנהל על',
  [ROLES.security_officer]: 'קצין ביטחון',
  [ROLES.entrepreneur]: 'יזם',
  [ROLES.integrator]: 'אינטגרטור',
  [ROLES.maintenance]: 'אחזקה',
  [ROLES.control_center]: 'מוקד'
};

// Hebrew translations for permissions
const PERMISSION_TRANSLATIONS = {
  [PERMISSIONS.ADMIN]: 'מנהל מערכת',
  [PERMISSIONS.DASHBOARD]: 'דשבורד',
  [PERMISSIONS.NEW_INSPECTION]: 'יצירת ביקורת',
  [PERMISSIONS.VIEW_INSPECTIONS]: 'צפייה בביקורות',
  [PERMISSIONS.NEW_FAULT]: 'יצירת תקלה',
  [PERMISSIONS.VIEW_FAULTS]: 'צפייה בתקלות',
  [PERMISSIONS.UPDATE_FAULT_STATUS]: 'עדכון סטטוס תקלה',
  [PERMISSIONS.UPDATE_FAULT_DETAILS]: 'עדכון פרטי תקלה',
  [PERMISSIONS.NEW_DRILL]: 'יצירת תרגיל',
  [PERMISSIONS.VIEW_DRILLS]: 'צפייה בתרגילים'
};

module.exports = {
  ROLES,
  PERMISSIONS,
  ALL_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  ROLE_TRANSLATIONS,
  PERMISSION_TRANSLATIONS
};
