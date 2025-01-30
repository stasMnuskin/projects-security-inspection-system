import axios from 'axios';
import { AppError } from '../utils/errorHandler';

const API_URL = process.env.REACT_APP_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      return Promise.reject(new AppError(error.response.data.message, error.response.status, error.response.data.errorCode));
    } else if (error.request) {
      return Promise.reject(new AppError('No response received from server', 500, 'NO_RESPONSE'));
    } else {
      return Promise.reject(new AppError('Error setting up the request', 500, 'REQUEST_SETUP_ERROR'));
    }
  }
);

// Helper function to handle API calls
const apiCall = async (method, url, data = null) => {
  try {
    const response = await api[method](url, data);
    return response.data;
  } catch (error) {
    console.error(`Error in ${method} ${url}:`, error);
    throw error;
  }
};

// Authentication
export const login = (credentials) => apiCall('post', '/users/login', credentials);
export const logoutUser = () => apiCall('post', '/users/logout');
export const register = (registrationData) => apiCall('post', '/auth/register/complete', registrationData);
export const generateRegistrationLink = (userData) => apiCall('post', '/auth/register/initial', userData);
export const validateRegistrationToken = (params) => apiCall('get', '/auth/register/validate', { params });
export const requestPasswordReset = (email) => apiCall('post', '/users/forgot-password', { email });
export const resetPassword = (resetData) => apiCall('post', '/users/reset-password', resetData);
export const getCurrentUser = () => apiCall('get', '/users/me');
export const getUsers = () => apiCall('get', '/users');
export const updateUser = (userData) => apiCall('put', `/users/${userData.id}`, userData);
export const deleteUser = (userId) => apiCall('delete', `/users/${userId}`);
export const changePassword = (passwordData) => apiCall('post', '/users/change-password', passwordData);

// Role and Permission Management
export const getRolePermissions = () => apiCall('get', '/users/roles/permissions/all');
export const getRolePermissionsForRole = (role) => apiCall('get', `/users/roles/${role}/permissions`);
export const updateRolePermissions = (role, permissions) => apiCall('put', `/users/roles/${role}/permissions`, { permissions });

// Organization Management
export const getOrganizations = (type) => apiCall('get', '/organizations', { params: { type } });
export const getRegistrationOrganizations = (type) => apiCall('get', '/auth/register/organizations', { params: { type } });
export const createOrganization = (orgData) => apiCall('post', '/organizations', orgData);
export const updateOrganization = (orgId, orgData) => apiCall('put', `/organizations/${orgId}`, orgData);
export const deleteOrganization = (orgId) => apiCall('delete', `/organizations/${orgId}`);
export const getOrganizationById = (orgId) => apiCall('get', `/organizations/${orgId}`);

// Organization Management for Sites
export const getOrganizationsBySites = (siteIds, type) => 
  apiCall('get', `/organizations/${type}/sites`, { params: { siteIds: siteIds.join(',') } });

// Site Management
export const getSites = () => apiCall('get', '/sites');
export const getSiteById = (siteId) => apiCall('get', `/sites/${siteId}`);
export const createSite = (siteData) => apiCall('post', '/sites', siteData);
export const updateSite = (siteId, siteData) => apiCall('put', `/sites/${siteId}`, siteData);
export const deleteSite = (siteId) => apiCall('delete', `/sites/${siteId}`);
export const getSitesByEntrepreneur = (entrepreneurId) => apiCall('get', `/sites/entrepreneur/${entrepreneurId}`);

// Entrepreneur Management
export const getEntrepreneurs = () => apiCall('get', '/users/entrepreneurs');
export const createEntrepreneur = (entrepreneurData) => apiCall('post', '/users/entrepreneurs', entrepreneurData);

// Fault Management
export const getAllFaults = (filters = {}) => {
  const params = { ...filters };
  // Convert arrays to comma-separated strings
  if (params.sites && Array.isArray(params.sites)) {
    params.sites = params.sites.join(',');
  }
  return apiCall('get', '/faults', { params });
};
export const updateFault = (faultId, faultData) => apiCall('put', `/faults/${faultId}`, faultData);
export const getFaultsBySite = (siteId) => apiCall('get', `/faults/site/${siteId}`);
export const createFault = (faultData) => apiCall('post', '/faults', faultData);
export const updateFaultStatus = (faultId, statusData) => apiCall('put', `/faults/${faultId}/status`, statusData);
export const updateFaultDetails = (faultId, detailsData) => apiCall('put', `/faults/${faultId}/details`, detailsData);
export const getFaultById = (faultId) => apiCall('get', `/faults/${faultId}`);
export const deleteFault = (faultId) => apiCall('delete', `/faults/${faultId}`);
export const getFaultTypes = () => apiCall('get', '/faults/types');

// Dashboard Data
export const getDashboardData = (filters) => apiCall('get', '/analytics/dashboard/overview', { params: filters });
export const getDashboardFilters = () => apiCall('get', '/analytics/dashboard/filters');

// Inspection Type Management
export const getAllInspectionTypes = () => apiCall('get', '/inspection-types');
export const getInspectionType = (id) => apiCall('get', `/inspection-types/${id}`);
export const getInspectionTypesBySite = (siteId, type) => 
  apiCall('get', `/inspection-types/site/${siteId}`, { params: { type } });
export const createInspectionType = (typeData) => {
  // Ensure type field is present
  if (!typeData.type) {
    typeData.type = typeData.name.toLowerCase().includes('תרגיל') ? 'drill' : 'inspection';
  }
  return apiCall('post', '/inspection-types', typeData);
};
export const updateInspectionType = (id, typeData) => {
  // Ensure type field is preserved
  if (!typeData.type && typeData.name) {
    typeData.type = typeData.name.toLowerCase().includes('תרגיל') ? 'drill' : 'inspection';
  }
  return apiCall('put', `/inspection-types/${id}`, typeData);
};
export const deleteInspectionType = (id) => apiCall('delete', `/inspection-types/${id}`);
export const getFieldTypes = () => apiCall('get', '/inspection-types/field-types');
export const getAvailableFields = (id) => apiCall('get', `/inspection-types/${id}/available-fields`);
export const updateFieldStatus = (id, fieldId, enabled) => 
  apiCall('patch', `/inspection-types/${id}/fields/${fieldId}`, { enabled });
export const addCustomField = (id, label, type, fieldType) => {
  // Generate a unique ID that includes Hebrew characters
  const fieldId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return apiCall('post', `/inspection-types/${id}/fields`, { 
    id: fieldId,
    label, 
    type, 
    fieldType 
  });
};
export const deleteCustomField = (id, fieldId) =>
  apiCall('delete', `/inspection-types/${id}/fields/${fieldId}`);
export const getEnabledFields = (siteId, type) => 
  apiCall('get', siteId 
    ? `/inspection-types/site/${siteId}/enabled-fields` 
    : '/inspection-types/enabled-fields', 
    { params: { type } }
  );

// Inspection Management
export const getInspectionTypes = () => apiCall('get', '/inspection-types');
export const getInspectionFormStructure = (siteId, inspectionTypeId) => 
  apiCall('get', `/inspections/form-structure/${siteId}/${inspectionTypeId}`);
export const getLatestInspections = (filters) => apiCall('get', '/inspections/latest', { params: filters });
export const getInspections = (filters = {}) => apiCall('get', '/inspections', { params: filters });
export const createInspection = (inspectionData) => apiCall('post', '/inspections', inspectionData);
export const getInspection = (inspectionId) => apiCall('get', `/inspections/${inspectionId}`);
export const updateInspection = (inspectionId, inspectionData) => apiCall('put', `/inspections/${inspectionId}`, inspectionData);
export const deleteInspection = (inspectionId) => apiCall('delete', `/inspections/${inspectionId}`);

// Inspections and Drills by Site
export const getInspectionsBySite = (siteId, params = {}) => 
  apiCall('get', `/inspections/site/${siteId}`, { params: { ...params, type: 'inspection' } });
export const getDrillsBySite = (siteId, params = {}) => 
  apiCall('get', `/inspections/site/${siteId}`, { params: { ...params, type: 'drill' } });

export const getLatestRoutineInspection = (siteId) => apiCall('get', `/inspections/latest-routine/${siteId}`);

// Analytics & Statistics
export const getStatistics = () => apiCall('get', '/analytics/statistics');
export const getAlerts = () => apiCall('get', '/analytics/alerts');
export const getDrillSuccessRate = (siteId) => apiCall('get', `/inspections/drill-success-rate/${siteId}`);
export const getOfficialInspectionComments = () => apiCall('get', '/analytics/official-inspection-comments');
export const getStatisticsBySite = (siteId) => apiCall('get', `/faults/statistics/site${siteId ? `/${siteId}` : ''}`);
export const getStatisticsByLocation = (siteId) => apiCall('get', `/faults/statistics/location${siteId ? `/${siteId}` : ''}`);

// Dashboard Filters
export const getSecurityOfficers = () => apiCall('get', '/users/security-officers');
export const getMaintenanceStaff = () => apiCall('get', '/users/maintenance');
export const getIntegrators = () => apiCall('get', '/users/integrators');

// Draft Inspections
export const saveDraftInspection = (draftData) => apiCall('post', '/inspections/draft', draftData);
export const getDraftInspection = (draftId) => apiCall('get', `/inspections/draft/${draftId}`);
export const deleteDraftInspection = (draftId) => apiCall('delete', `/inspections/draft/${draftId}`);
export const getUserDraftInspections = () => apiCall('get', '/inspections/user/drafts');
export const getUsersByOrganizationType = async (type) => {
  const response = await api.get(`/users/by-organization-type/${type}`);
  return response.data;
};

// User Management by Role for Notifications
export const getUsersByRole = (role) => apiCall('get', '/users/by-role', { params: { role } });

// Site Notification Recipients
export const getSiteNotificationRecipients = (siteId) => apiCall('get', `/sites/${siteId}/notification-recipients`);
export const updateSiteNotificationRecipients = (siteId, recipientIds) => 
  apiCall('put', `/sites/${siteId}/notification-recipients`, { notificationRecipientIds: recipientIds });

export default api;
