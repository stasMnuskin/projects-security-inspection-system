import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

if (!API_URL) {
  throw new Error('REACT_APP_API_URL is not defined');
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use((response) => {
  return response;
}, (error) => {
  if (error.response && error.response.status === 401) {
    // Handle unauthorized access
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
  return Promise.reject(error);
});

export const register = (username, email, password, role) => 
  api.post('/users/register', { username, email, password, role });
export const login = async (email, password) => {
  const response = await api.post('/users/login', { email, password });
  localStorage.setItem('token', response.data.token);
  localStorage.setItem('userRole', response.data.role);
  return response.data;
};
export const getInspections = () => api.get('/inspections');
export const getSites = (entrepreneurId) => api.get(`/sites/entrepreneur/${entrepreneurId}`);
export const getEntrepreneurs = () => api.get('/entrepreneurs');
export const getCurrentUser = () => api.get('/users/me');
export const getInspectionTypes = (siteId) => api.get(`/inspection-types/site/${siteId}`);
export const createInspection = (data) => api.post('/inspections', data);
export const getUsers = () => api.get('/users');

export default api;