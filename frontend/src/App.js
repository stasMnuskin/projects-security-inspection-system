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
import NewInspection from './pages/NewInspection';
import PrivateRoute from './components/PrivateRoute';
import LotanLogo from './assets/lotan-logo.svg';
import './styles/rtl.css';
import { AuthProvider } from './context/AuthContext';

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
                  <img src={LotanLogo} alt="Lotan Group" style={{ height: '40px', marginLeft: '16px' }} />
                  <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    ברוכים הבאים
                  </Typography>
                </Toolbar>
              </AppBar>
              <Container component="main" sx={{ flexGrow: 1, mt: 4, mb: 4 }}>
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
                  <Route path="/inspection/:siteId/:inspectionTypeId" element={
                    <PrivateRoute allowedRoles={['security_officer']}>
                      <LatestInspection />
                    </PrivateRoute>
                  } />
                  <Route path="/faults/:siteId" element={
                    <PrivateRoute allowedRoles={['security_officer']}>
                      <Faults />
                    </PrivateRoute>
                  } />
                  <Route path="/new-inspection/:siteId/:inspectionTypeId" element={
                    <PrivateRoute allowedRoles={['security_officer']}>
                      <NewInspection />
                    </PrivateRoute>
                  } />
                  <Route path="/" element={<Navigate to="/login" replace />} />
                  <Route path="/change-password" element={<ChangePassword />} />
                </Routes>
            </Container>
            <Box component="footer" sx={{ py: 3, px: 2, mt: 'auto', backgroundColor: 'background.paper' }}>
                <Typography variant="body2" color="text.secondary" align="center">
                  Tel. +972-3-7-100200 | info@lotansecurity.com | www.lotansecurity.com
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