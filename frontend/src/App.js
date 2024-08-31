import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import SecurityDashboard from './pages/SecurityDashboard';
import UserDashboard from './pages/UserDashboard';
import Dashboard from './pages/Dashboard';
import Inspections from './pages/Inspections';
import Sites from './pages/Sites';
import Entrepreneurs from './pages/Entrepreneurs';
import Navigation from './components/Navigation';

function PrivateRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  
  if (!token) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" />;
  }

  return (
    <>
      <Navigation />
      {children}
    </>
  );
}

function App() {
  return (
    <Router>
      <Box sx={{ flexGrow: 1 }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route 
            path="/admin-dashboard" 
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/security-dashboard" 
            element={
              <PrivateRoute allowedRoles={['security_officer']}>
                <SecurityDashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/user-dashboard" 
            element={
              <PrivateRoute allowedRoles={['technician', 'inspector']}>
                <UserDashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/inspections" 
            element={
              <PrivateRoute>
                <Inspections />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/sites" 
            element={
              <PrivateRoute>
                <Sites />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/entrepreneurs" 
            element={
              <PrivateRoute>
                <Entrepreneurs />
              </PrivateRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Box>
    </Router>
  );
}

export default App;