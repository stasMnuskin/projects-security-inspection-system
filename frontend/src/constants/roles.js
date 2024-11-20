// Role definitions
export const ROLES = {
  admin: 'admin',
  security_officer: 'security_officer',
  entrepreneur: 'entrepreneur',
  integrator: 'integrator',
  maintenance: 'maintenance',
  control_center: 'control_center'
};

// Permission definitions
export const PERMISSIONS = {
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

// Hebrew translations for roles
export const ROLE_TRANSLATIONS = {
  [ROLES.admin]: 'מנהל על',
  [ROLES.security_officer]: 'קצין ביטחון',
  [ROLES.entrepreneur]: 'יזם',
  [ROLES.integrator]: 'אינטגרטור',
  [ROLES.maintenance]: 'אחזקה',
  [ROLES.control_center]: 'מוקד'
};

// Hebrew translations for permissions
export const PERMISSION_TRANSLATIONS = {
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

// Role options for dropdowns
export const ROLE_OPTIONS = Object.entries(ROLES).map(([key, value]) => ({
  value,
  label: ROLE_TRANSLATIONS[value]
}));

// Permission options for dropdowns
export const PERMISSION_OPTIONS = Object.entries(PERMISSIONS).map(([key, value]) => ({
  value,
  label: PERMISSION_TRANSLATIONS[value]
}));
