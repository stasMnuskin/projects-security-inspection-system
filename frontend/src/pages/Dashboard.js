import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Box, CircularProgress, Alert, Container, Paper, Grid } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import CustomPieChart from '../components/PieChart';
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
      <Box sx={dashboardStyles.mainContainer}>
        {/* Header */}
        <Typography variant="h4" sx={dashboardStyles.pageTitle}>
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
            <Box sx={dashboardStyles.loadingOverlay}>
              <CircularProgress sx={{ color: colors.primary.orange }} />
            </Box>
          )}

          {/* Charts Row */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Paper 
                sx={{
                  ...dashboardStyles.chartPaper,
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: colors.border.orangeHover
                  }
                }}
                onClick={() => handleBoxClick('/inspections')}
              >
                <CustomPieChart
                  title="ביקורות/תרגילים"
                  data={[
                    { name: 'ביקורות', value: dashboardData.overview.inspections },
                    { name: 'תרגילים', value: dashboardData.overview.drills }
                  ]}
                  chartColors={[colors.text.grey, colors.primary.orange]}
                />
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper 
                sx={{
                  ...dashboardStyles.chartPaper,
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: colors.border.orangeHover
                  }
                }}
                onClick={() => handleBoxClick('/faults')}
              >
                <CustomPieChart
                  title="תקלות נפוצות"
                  data={dashboardData.faults.recurring
                    .slice(0, 5)
                    .map(fault => ({
                      name: fault.type === 'אחר' ? fault.description : fault.type,
                      value: fault.count
                    }))}
                  chartColors={[
                    colors.primary.orange,
                    'rgba(166, 166, 166, 1)',    // אפור כהה
                    'rgba(166, 166, 166, 0.8)',  // אפור בינוני
                    'rgba(166, 166, 166, 0.6)',  // אפור בהיר
                    'rgba(166, 166, 166, 0.4)'   // אפור בהיר מאוד
                  ]}
                />
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper 
                sx={{
                  ...dashboardStyles.chartPaper,
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: colors.border.orangeHover
                  }
                }}
                onClick={() => handleBoxClick('/faults')}
              >
                <CustomPieChart
                  title="תקלות"
                  data={[
                    { 
                      name: 'תקלות משביתות', 
                      value: dashboardData.faults.critical.length 
                    },
                    { 
                      name: 'תקלות רגילות',
                      value: dashboardData.faults.open.filter(f => !f.isCritical).length 
                    }
                  ]}
                  chartColors={[colors.primary.orange, colors.text.grey]}
                />
              </Paper>
            </Grid>
          </Grid>

          {/* Fault Tables */}
          <Box>
            <FaultTables
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
