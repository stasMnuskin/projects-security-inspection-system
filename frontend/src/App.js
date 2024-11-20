import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './context/AuthContext';
import { theme } from './styles/components';
import { Box, CircularProgress } from '@mui/material';
import rtlPlugin from 'stylis-plugin-rtl';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import { PERMISSIONS } from './constants/roles';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import InitialRegistration from './pages/InitialRegistration';
import Users from './pages/Users';
import Sites from './pages/Sites';
import Inspections from './pages/Inspections';
import Drills from './pages/Drills';
import InspectionForm from './pages/InspectionForm';
import Faults from './pages/Faults';
import Admin from './pages/Admin';
import Dashboard from './pages/Dashboard';

// Components
import ErrorBoundary from './components/ErrorBoundary';

// Create rtl cache
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

const LoadingScreen = () => (
  <Box 
    display="flex" 
    justifyContent="center" 
    alignItems="center" 
    minHeight="100vh"
  >
    <CircularProgress />
  </Box>
);

const ProtectedRoute = ({ children, permissions = [] }) => {
  const { user, isAuthenticated, loading } = useAuth();

  // Show loading screen while checking authentication
  if (loading) {
    return <LoadingScreen />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Check permission-based access
  if (permissions.length > 0 && !permissions.some(permission => user.hasPermission(permission))) {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  return (
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ErrorBoundary>
          <AuthProvider>
            <Router>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Protected routes */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                } />

                {/* Admin routes */}
                <Route path="/admin/*" element={
                  <ProtectedRoute permissions={[PERMISSIONS.ADMIN]}>
                    <Admin />
                  </ProtectedRoute>
                }>
                  <Route path="users" element={<Users />} />
                  <Route path="initial-registration" element={<InitialRegistration />} />
                  <Route path="sites" element={<Sites mode="list" />} />
                  <Route path="sites/new" element={<Sites mode="new" />} />
                  <Route path="sites/inspection-config" element={<Sites mode="inspection-config" />} />
                </Route>

                {/* Dashboard routes */}
                <Route path="/dashboard/*" element={
                  <ProtectedRoute permissions={[PERMISSIONS.DASHBOARD]}>
                    <Dashboard />
                  </ProtectedRoute>
                } />

                {/* Inspection routes */}
                <Route path="/inspections" element={
                  <ProtectedRoute permissions={[PERMISSIONS.VIEW_INSPECTIONS]}>
                    <Inspections />
                  </ProtectedRoute>
                } />

                <Route path="/inspections/new" element={
                  <ProtectedRoute permissions={[PERMISSIONS.NEW_INSPECTION]}>
                    <InspectionForm />
                  </ProtectedRoute>
                } />

                {/* Drill routes */}
                <Route path="/drills" element={
                  <ProtectedRoute permissions={[PERMISSIONS.VIEW_DRILLS]}>
                    <Drills />
                  </ProtectedRoute>
                } />

                <Route path="/drills/new" element={
                  <ProtectedRoute permissions={[PERMISSIONS.NEW_DRILL]}>
                    <InspectionForm />
                  </ProtectedRoute>
                } />

                {/* Fault routes */}
                <Route path="/faults" element={
                  <ProtectedRoute permissions={[PERMISSIONS.VIEW_FAULTS]}>
                    <Faults />
                  </ProtectedRoute>
                } />

                <Route path="/faults/new" element={
                  <ProtectedRoute permissions={[PERMISSIONS.NEW_FAULT]}>
                    <Faults />
                  </ProtectedRoute>
                } />

                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Router>
          </AuthProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </CacheProvider>
  );
}

export default App;
