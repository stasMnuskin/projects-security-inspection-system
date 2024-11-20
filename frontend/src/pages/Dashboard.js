import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Box, CircularProgress, Alert, Container, Paper } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { getDashboardData } from '../services/api';
import FilterBar from '../components/FilterBar';
import FaultTables from '../components/FaultTables';
import Sidebar from '../components/Sidebar';
import { colors } from '../styles/colors';
import { dashboardStyles } from '../styles/dashboardStyles';
import { PERMISSIONS } from '../constants/roles';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    overview: { inspections: 0, drills: 0 },
    faults: {
      recurring: [],
      open: [],
      critical: []
    }
  });
  const [filters, setFilters] = useState({
    startDate: (() => {
      const date = new Date();
      date.setMonth(date.getMonth() - 6);
      return date;
    })(),
    endDate: new Date(),
    site: '',
    securityOfficer: '',
    maintenance: '',
    integrator: ''
  });

  // Check if user has permission to view dashboard
  const canViewDashboard = user.hasPermission(PERMISSIONS.DASHBOARD);

  // Redirect if no permission
  useEffect(() => {
    if (!canViewDashboard) {
      navigate('/');
    }
  }, [canViewDashboard, navigate]);

  const loadDashboardData = useCallback(async () => {
    if (!canViewDashboard) {
      setError('אין לך הרשאה לצפות בדשבורד');
      setLoading(false);
      return;
    }

    try {
      const data = await getDashboardData(filters);
      setDashboardData(data);
      setError(null);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('שגיאה בטעינת נתוני דשבורד');
    } finally {
      setLoading(false);
    }
  }, [filters, canViewDashboard]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      loadDashboardData();
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [loadDashboardData]);

  const handleFilterChange = useCallback((field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleBoxClick = (path) => {
    navigate(path);
  };

  if (!canViewDashboard) {
    return (
      <Container maxWidth="lg">
        <Typography variant="h4" gutterBottom>שגיאה</Typography>
        <Paper elevation={3} style={{ padding: '20px', marginBottom: '20px' }}>
          <Typography>אין לך הרשאה לצפות בדשבורד</Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sidebar
        menuItems={[]}
        activeSection="dashboard"
        userInfo={{ name: `${user.firstName} ${user.lastName}` }}
      />

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, p: 3 }}>
        {/* Header */}
        <Typography variant="h4" sx={{ color: colors.text.white, mb: 3 }}>
          דשבורד
        </Typography>

        {/* Filter Bar */}
        <FilterBar 
          filters={filters} 
          onFilterChange={handleFilterChange}
          variant="dashboard"
        />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Content with Loading Overlay */}
        <Box position="relative">
          {loading && (
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              display="flex"
              alignItems="center"
              justifyContent="center"
              bgcolor="rgba(0, 0, 0, 0.3)"
              zIndex={1}
            >
              <CircularProgress sx={{ color: colors.primary.orange }} />
            </Box>
          )}

          {/* Overview */}
          <Box sx={dashboardStyles.overviewContainer}>
            <Box 
              sx={{
                ...dashboardStyles.overviewBox,
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                  backgroundColor: colors.background.darkGrey
                }
              }}
              onClick={() => handleBoxClick('/inspections')}
            >
              <Typography variant="h6">ביקורות</Typography>
              <Typography variant="h3">{dashboardData.overview.inspections}</Typography>
            </Box>
            <Box 
              sx={{
                ...dashboardStyles.overviewBox,
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                  backgroundColor: colors.background.darkGrey
                }
              }}
              onClick={() => handleBoxClick('/drills')}
            >
              <Typography variant="h6">תרגילים</Typography>
              <Typography variant="h3">{dashboardData.overview.drills}</Typography>
            </Box>
          </Box>

          {/* Fault Tables */}
          <Box sx={{ mt: 4 }}>
            <FaultTables
              recurringFaults={dashboardData.faults.recurring}
              openFaults={dashboardData.faults.open}
              criticalFaults={dashboardData.faults.critical}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
