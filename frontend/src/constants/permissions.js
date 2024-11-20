// Base permissions
export const PERMISSIONS = {
  admin: 'מנהל מערכת',
  dashboard: 'דשבורד',
  new_inspection: 'ביקורת חדשה',
  inspections: 'ביקורות',
  new_fault: 'תקלה חדשה',
  faults: 'תקלות',
  new_drill: 'תרגיל חדש',
  drills: 'תרגילים',
  update_fault_status: 'עדכון סטטוס תקלה',
  update_fault_details: 'עדכון הערות תקלה'
};

// User roles
export const ROLES = {
  admin: 'מנהל על',
  security_officer: 'קצין ביטחון',
  entrepreneur: 'יזם',
  integrator: 'אינטגרטור',
  maintenance: 'אחזקה',
  control_center: 'מוקד',
};

// Default permissions by role
export const DEFAULT_ROLE_PERMISSIONS = {
  admin: Object.keys(PERMISSIONS),
  security_officer: ['new_inspection', 'inspections', 'new_drill', 'drills'],
  entrepreneur: ['dashboard', 'inspections', 'faults', 'drills'],
  control_center: ['new_fault'],
  maintenance: ['faults', 'update_fault_status', 'update_fault_details'],
  integrator: ['faults', 'update_fault_status', 'update_fault_details'],
};

// Helper functions
export const getPermissionLabel = (permissionId) => PERMISSIONS[permissionId] || permissionId;
export const getRoleLabel = (roleId) => ROLES[roleId] || roleId;
export const getDefaultPermissions = (role) => DEFAULT_ROLE_PERMISSIONS[role] || [];

// Get permissions as array for select/checkbox components
export const getPermissionsArray = () => 
  Object.entries(PERMISSIONS).map(([id, label]) => ({ id, label }));

// Get roles as array for select components
export const getRolesArray = () =>
  Object.entries(ROLES)
    .filter(([id]) => id !== 'pending') 
    .map(([id, label]) => ({ id, label }));
