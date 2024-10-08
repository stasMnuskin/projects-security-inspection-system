import axios from 'axios';
import { handleApiError } from '../utils/errorHandler';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

if (!API_URL) {
  throw new Error('REACT_APP_API_URL לא מוגדר');
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true 
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
}, (error) => {
  return Promise.reject(handleApiError(error));
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(handleApiError(error))
);

export const login = (email, password) => api.post('/users/login', { email, password });
export const register = (username, email, password, role) => 
  api.post('/users/register', { username, email, password, role });
export const getCurrentUser = () => api.get('/users/me');
export const getUsers = () => api.get('/users');
export const logoutUser = () => api.post('/users/logout');
export const changePassword = async (currentPassword, newPassword) => {
  const response = await api.post('/users/change-password', { currentPassword, newPassword });
  if (response.data.role) {
    localStorage.setItem('userRole', response.data.role);
  }
  return response;
};

export const getInspections = () => api.get('/inspections');
export const createInspection = (data) => api.post('/inspections', data);
export const updateInspection = (id, data) => api.put(`/inspections/${id}`, data);
export const getLatestInspection = (siteId) => api.get(`/inspections/latest/${siteId}`);
export const getInspectionTypes = () => api.get('/inspection-types');
export const getInspectionFormStructure = async (siteId, inspectionTypeId) => {
  try {
    const response = await api.get(`/inspection-types/${inspectionTypeId}/form-structure`, {
      params: { siteId }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching inspection form structure:', error);
    throw error;
  }
};
export const submitInspectionReport = (reportData) => api.post('/inspections', reportData);

export const getSites = (entrepreneurId = null) => {
  if (entrepreneurId) {
    return api.get(`/sites/entrepreneur/${entrepreneurId}`);
  }
  return getSitesByEntrepreneur();
};
export const createSite = (data) => api.post('/sites', data);
export const updateSite = (id, data) => api.put(`/sites/${id}`, data);
export const getSiteDetails = (siteId) => api.get(`/sites/${siteId}`);
export const getSitesByEntrepreneur = () => api.get('/sites/entrepreneur');

export const getEntrepreneurs = () => api.get('/entrepreneurs');
export const createEntrepreneur = (data) => api.post('/entrepreneurs', data);
export const updateEntrepreneur = (id, data) => api.put(`/entrepreneurs/${id}`, data);

export const getFaults = () => api.get('/faults');
export const createFault = (data) => api.post('/faults', data);
export const updateFault = (id, data) => api.put(`/faults/${id}`, data);
export const getOpenFaultsByEntrepreneur = () => api.get('/faults/open/entrepreneur');
export const getFaultsBySite = (siteId) => api.get(`/faults/site/${siteId}`);
export const getRecentFaultsByEntrepreneur = () => api.get('/faults/recent/entrepreneur');
export const getRecurringFaultsByEntrepreneur = () => api.get('/faults/recurring/entrepreneur');
export const getAllFaultsBySite = (siteId) => api.get(`/faults/all/site/${siteId}`);
export const getOpenFaultsBySite = (siteId) => api.get(`/faults/open/site/${siteId}`);
export const getRecentFaultsBySite = (siteId) => api.get(`/faults/recent/site/${siteId}`);
export const getRecurringFaultsBySite = (siteId) => api.get(`/faults/recurring/site/${siteId}`);
export const getLatestInspections = () => api.get('/inspections/latest');

export const getStatisticsBySite = (siteId) => api.get(siteId ? `/faults/statistics/site/${siteId}` : '/faults/statistics/site');
export const getStatisticsByLocation = (siteId) => api.get(siteId ? `/faults/statistics/location/${siteId}` : '/faults/statistics/location');

export default api;