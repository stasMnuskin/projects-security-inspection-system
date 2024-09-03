import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import theme from './styles/theme';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import SecurityDashboard from './pages/SecurityDashboard';
import ChangePassword from './pages/ChangePassword';
import EntrepreneurDashboard from './pages/EntrepreneurDashboard';
import InspectorDashboard from './pages/InspectorDashboard';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin" element={
            <PrivateRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </PrivateRoute>
          } />
          <Route path="/security" element={
            <PrivateRoute allowedRoles={['security_officer']}>
              <SecurityDashboard />
            </PrivateRoute>
          } />
          <Route path="/entrepreneur" element={
            <PrivateRoute allowedRoles={['entrepreneur']}>
              <EntrepreneurDashboard />
            </PrivateRoute>
          } />
          <Route path="/inspector" element={
            <PrivateRoute allowedRoles={['inspector']}>
              <InspectorDashboard />
            </PrivateRoute>
          } />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/change-password" element={<ChangePassword />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;