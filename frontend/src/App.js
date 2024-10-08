import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { Box, AppBar, Toolbar, Typography, Container, CssBaseline } from '@mui/material';
import theme from './styles/theme';
import Login from './pages/Login';
import Register from './pages/Register';
import Navigation from './components/Navigation';
import AdminDashboard from './pages/AdminDashboard';
import SecurityDashboard from './pages/SecurityDashboard';
import ChangePassword from './pages/ChangePassword';
import EntrepreneurDashboard from './pages/EntrepreneurDashboard';
import InspectorDashboard from './pages/InspectorDashboard';
import LatestInspection from './pages/LatestInspection';
import Faults from './pages/Faults';
import InspectionForm from './pages/InspectionForm';
import PrivateRoute from './components/PrivateRoute';
import LotanLogo from './assets/logo-black.svg';

import './styles/rtl.css';
import { AuthProvider } from './context/AuthContext';
import Users from './pages/Users';
import Sites from './pages/Sites';
import Inspections from './pages/Inspections';
import NewInspection from './pages/NewInspection';
import LatestInspections from './pages/LatestInspections';

const cache = createCache({
  key: 'css',
});

function App() {
  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }} dir="rtl">
              <Navigation />
              <AppBar position="static">
                <Toolbar>
                  <img src={LotanLogo} alt="קבוצת לוטן" style={{ height: '40px', marginLeft: '16px' }} />
                  {/* <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    ברוכים הבאים
                  </Typography> */}
                </Toolbar>
              </AppBar>
              <Container component="main" sx={{ flexGrow: 1, mt: 4, mb: 4 }}>
                <Routes>
                  <Route path="/" element={
                    <PrivateRoute allowedRoles={['admin', 'security_officer', 'entrepreneur', 'inspector']}>
                      <Navigate to={(user) => {
                        switch(user.role) {
                          case 'admin': return '/admin';
                          case 'security_officer': return '/security';
                          case 'entrepreneur': return '/entrepreneur';
                          case 'inspector': return '/inspector';
                          default: return '/login';
                        }
                      }} replace />
                    </PrivateRoute>
                  } />
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
                  <Route path="/inspection/:siteId/:inspectionTypeId" element={
                    <PrivateRoute allowedRoles={['security_officer']}>
                      <LatestInspection />
                    </PrivateRoute>
                  } />
                  <Route path="/faults/:siteId" element={
                    <PrivateRoute allowedRoles={['security_officer', 'entrepreneur']}>
                      <Faults />
                    </PrivateRoute>
                  } />
                  <Route path="/new-inspection/:siteId/:inspectionTypeId" element={
                    <PrivateRoute allowedRoles={['security_officer']}>
                      <InspectionForm />
                    </PrivateRoute>
                  } />
                  <Route path="/change-password" element={<ChangePassword />} />
                  <Route path="/users" element={
                    <PrivateRoute allowedRoles={['admin']}>
                      <Users />
                    </PrivateRoute>
                  } />
                  <Route path="/sites" element={
                    <PrivateRoute allowedRoles={['admin']}>
                      <Sites />
                    </PrivateRoute>
                  } />
                  <Route path="/inspections" element={
                    <PrivateRoute allowedRoles={['security_officer']}>
                      <Inspections />
                    </PrivateRoute>
                  } />
                  <Route path="/my-inspections" element={
                    <PrivateRoute allowedRoles={['inspector']}>
                      <Inspections />
                    </PrivateRoute>
                  } />
                  <Route path="/new-inspection" element={
                    <PrivateRoute allowedRoles={['security_officer']}>
                      <NewInspection />
                    </PrivateRoute>
                  } />
                  <Route path="/faults" element={
                    <PrivateRoute allowedRoles={['entrepreneur', 'security_officer']}>
                      <Faults />
                    </PrivateRoute>
                  } />
                  <Route path="/latest-inspections" element={
                    <PrivateRoute allowedRoles={['entrepreneur', 'security_officer', 'admin']}>
                      <LatestInspections />
                    </PrivateRoute>
                  } />
                </Routes>
              </Container>
              <Box component="footer" sx={{ py: 3, px: 2, mt: 'auto', backgroundColor: 'background.paper' }}>
                <Typography variant="body2" color="text.secondary" align="center">
                  Tel. +972-3-7-100254 | <a href="mailto:info@lotangroup.com">info@lotangroup.com</a> | <a href="https://www.lotangrp.com" target="_blank" rel="noopener noreferrer">https://www.lotangrp.com</a>
                </Typography>
              </Box>
            </Box>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </CacheProvider>
  );
}

export default App;