const ROLES = {
  admin: 'admin',
  security_officer: 'security_officer',
  entrepreneur: 'entrepreneur',
  integrator: 'integrator',
  maintenance: 'maintenance',
  control_center: 'control_center'
};

const PERMISSIONS = {
  ADMIN: 'admin',
  DASHBOARD: 'dashboard',
  
  NEW_INSPECTION: 'new_inspection',
  VIEW_INSPECTIONS: 'inspections',
  
  NEW_FAULT: 'new_fault',
  VIEW_FAULTS: 'faults',
  UPDATE_FAULT_STATUS: 'update_fault_status',
  UPDATE_FAULT_DETAILS: 'update_fault_details',
  
  NEW_DRILL: 'new_drill',
  VIEW_DRILLS: 'drills'
};

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

const DEFAULT_ROLE_PERMISSIONS = {
  [ROLES.admin]: ALL_PERMISSIONS,
  [ROLES.security_officer]: [],
  [ROLES.entrepreneur]: [],
  [ROLES.integrator]: [],
  [ROLES.maintenance]: [],
  [ROLES.control_center]: []
};

const ROLE_TRANSLATIONS = {
  [ROLES.admin]: 'מנהל על',
  [ROLES.security_officer]: 'קצין ביטחון',
  [ROLES.entrepreneur]: 'יזם',
  [ROLES.integrator]: 'אינטגרטור',
  [ROLES.maintenance]: 'אחזקה',
  [ROLES.control_center]: 'מוקד'
};

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
