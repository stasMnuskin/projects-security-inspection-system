import axios from 'axios';
import { handleApiError } from '../utils/errorHandler';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

if (!API_URL) {
  throw new Error('REACT_APP_API_URL is not defined');
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

export const getInspections = () => api.get('/inspections');
export const createInspection = (data) => api.post('/inspections', data);
export const updateInspection = (id, data) => api.put(`/inspections/${id}`, data);

export const getSites = () => api.get('/sites');

export const createSite = (data) => api.post('/sites', data);
export const updateSite = (id, data) => api.put(`/sites/${id}`, data);

export const getEntrepreneurs = () => api.get('/entrepreneurs');
export const createEntrepreneur = (data) => api.post('/entrepreneurs', data);
export const updateEntrepreneur = (id, data) => api.put(`/entrepreneurs/${id}`, data);

export const getFaults = () => api.get('/faults');

export const createFault = (data) => api.post('/faults', data);
export const updateFault = (id, data) => api.put(`/faults/${id}`, data);

export const getInspectionTypes = () => api.get('/inspection-types');
export const createInspectionType = (data) => api.post('/inspection-types', data);
export const updateInspectionType = (id, data) => api.put(`/inspection-types/${id}`, data);

export const getOpenFaultsByEntrepreneur = () => api.get('/faults/open/entrepreneur');
export const getSitesByEntrepreneur = () => api.get('/sites/entrepreneur');
export const getFaultsBySite = (siteId) => api.get(`/faults/site/${siteId}`);
export const getRecentFaultsByEntrepreneur = () => api.get('/faults/recent/entrepreneur');
export const changePassword = async (currentPassword, newPassword) => {
  const response = await api.post('/users/change-password', { currentPassword, newPassword });
  if (response.data.role) {
    localStorage.setItem('userRole', response.data.role);
  }
  
  return response;
};

export default api;