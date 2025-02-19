import React, { useState, useEffect, useCallback } from 'react';
import { 
  Typography, 
  Box, 
  CircularProgress, 
  Alert, 
  Container, 
  Paper, 
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../context/AuthContext';
import CustomPieChart from '../components/PieChart';
import CustomBarChart from '../components/BarChart';
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
    overview: { 
      inspections: 0, 
      drills: 0,
      drillResults: {
        'הצלחה': 0,
        'הצלחה חלקית': 0,
        'נכשל': 0
      }
    },
    faults: {
      recurring: [],
      open: [],
      critical: []
    }
  });
  const [faultDialogOpen, setFaultDialogOpen] = useState(false);
  const [selectedFaultType, setSelectedFaultType] = useState(null);
  const [filters, setFilters] = useState({
    startDate: (() => {
      const date = new Date();
      date.setMonth(date.getMonth() - 6);
      return date;
    })(),
    endDate: new Date(),
    sites: [],
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
            <Grid item xs={12} sm={6} md={3}>
              <Paper 
                sx={{
                  ...dashboardStyles.chartPaper,
                  '&:hover': {
                    borderColor: colors.border.orangeHover
                  }
                }}
              >
                <CustomPieChart
                  title="ביקורות/תרגילים"
                  data={[
                    { name: 'ביקורות', value: dashboardData.overview.inspections, path: '/inspections' },
                    { name: 'תרגילים', value: dashboardData.overview.drills, path: '/drills' }
                  ]}
                  chartColors={[colors.text.grey, colors.primary.orange]}
                  onSliceClick={(entry) => navigate(entry.path, {
                    state: {
                      initialFilters: {
                        ...filters,
                        sites: filters.sites || []
                      }
                    }
                  })}
                />
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper 
                sx={{
                  ...dashboardStyles.chartPaper,
                  '&:hover': {
                    borderColor: colors.border.orangeHover
                  }
                }}
              >
                <CustomPieChart
                  title="תקלות נפוצות"
                  data={dashboardData.faults.recurring
                    .slice(0, 5)
                    .map(fault => ({
                      name: fault.type === 'אחר' ? fault.description : fault.type,
                      value: fault.count,
                      originalData: fault
                    }))}
                  chartColors={[
                    colors.primary.orange,
                    'rgba(166, 166, 166, 1)',    // אפור כהה
                    'rgba(166, 166, 166, 0.8)',  // אפור בינוני
                    'rgba(166, 166, 166, 0.6)',  // אפור בהיר
                    'rgba(166, 166, 166, 0.4)'   // אפור בהיר מאוד
                  ]}
                  onSliceClick={(entry) => {
                    setSelectedFaultType({
                      type: entry.originalData.type,
                      description: entry.originalData.type === 'אחר' ? entry.originalData.description : null
                    });
                    setFaultDialogOpen(true);
                  }}
                />
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper 
                sx={{
                  ...dashboardStyles.chartPaper,
                  '&:hover': {
                    borderColor: colors.border.orangeHover
                  }
                }}
              >
                <CustomPieChart
                  title="תקלות"
                  data={[
                    { 
                      name: 'תקלות משביתות', 
                      value: dashboardData.faults.critical.length,
                      isCritical: true
                    },
                    { 
                      name: 'תקלות רגילות',
                      value: dashboardData.faults.open.filter(f => !f.isCritical).length,
                      isCritical: false
                    }
                  ]}
                  chartColors={[colors.primary.orange, colors.text.grey]}
                  onSliceClick={(entry) => {
                    navigate('/faults', { 
                      state: { 
                        initialFilters: {
                          ...filters,
                          isCritical: entry.isCritical
                        }
                      }
                    });
                  }}
                />
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper 
                sx={{
                  ...dashboardStyles.chartPaper,
                  '&:hover': {
                    borderColor: colors.border.orangeHover
                  }
                }}
              >
                <CustomPieChart
                  title="תרגילים"
                  data={[
                    { 
                      name: 'הצלחה', 
                      value: dashboardData.overview.drillResults['הצלחה'] || 0,
                      status: 'הצלחה'
                    },
                    { 
                      name: 'הצלחה חלקית',
                      value: dashboardData.overview.drillResults['הצלחה חלקית'] || 0,
                      status: 'הצלחה חלקית'
                    },
                    { 
                      name: 'כישלון',
                      value: dashboardData.overview.drillResults['כישלון'] || 0,
                      status: 'כישלון'
                    }
                  ]}
                  chartColors={[
                    colors.text.grey,          // אפור להצלחה
                    colors.text.grey,          // אפור להצלחה חלקית
                    colors.primary.orange      // כתום לכישלון
                  ]}
                  onSliceClick={(entry) => {
                    navigate('/drills', {
                      state: {
                        initialFilters: {
                          ...filters,
                          formData: {
                            status: entry.name
                          }
                        }
                      }
                    });
                  }}
                />
              </Paper>
            </Grid>
          </Grid>

          {/* Site Faults Bar Chart */}
          <Box sx={{ mb: 4 }}>
            <CustomBarChart 
              title="תקלות לפי אתר"
              data={Object.values(dashboardData.faults.open.reduce((acc, fault) => {
                const siteId = fault.site.id;
                if (!acc[siteId]) {
                  acc[siteId] = {
                    name: fault.site.name,
                    criticalCount: 0,
                    regularCount: 0
                  };
                }
                if (fault.isCritical) {
                  acc[siteId].criticalCount++;
                } else {
                  acc[siteId].regularCount++;
                }
                return acc;
              }, {}))
              .sort((a, b) => {
                // First compare by critical faults
                if (a.criticalCount !== b.criticalCount) {
                  return b.criticalCount - a.criticalCount;  // descending order
                }
                // If critical faults are equal, compare by regular faults
                return b.regularCount - a.regularCount;  // descending order
              })
              .slice(0, 10)}
              onBarClick={({ site, isCritical }) => {
                const siteData = dashboardData.faults.open.find(fault => fault.site.name === site);
                if (siteData) {
                  navigate('/faults', {
                    state: {
                      initialFilters: {
                        ...filters,
                        sites: [siteData.site.id],
                        isCritical
                      }
                    }
                  });
                }
              }}
            />
          </Box>

          {/* Fault Tables */}
          <Box>
            <FaultTables
              openFaults={dashboardData.faults.open}
              criticalFaults={dashboardData.faults.critical}
            />
          </Box>

          {/* Fault Details Dialog */}
          <Dialog
            open={faultDialogOpen}
            onClose={() => setFaultDialogOpen(false)}
            maxWidth="lg"
            fullWidth
            PaperProps={{
              sx: {
                backgroundColor: colors.background.black,
                color: colors.text.white
              }
            }}
          >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography>
                {selectedFaultType?.type === 'אחר' ? selectedFaultType.description : selectedFaultType?.type}
              </Typography>
              <IconButton
                onClick={() => setFaultDialogOpen(false)}
                sx={{ color: colors.text.grey }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ 
              display: 'flex', 
              justifyContent: 'center',
              padding: '24px'
            }}>
              <Box sx={{ 
                width: '100%',
                maxWidth: '800px'
              }}>
                <FaultTables
                recurringFaults={dashboardData.faults.recurring.filter(fault => 
                  fault.type === selectedFaultType?.type &&
                  (selectedFaultType?.type !== 'אחר' || fault.description === selectedFaultType?.description)
                ).map((fault, index) => ({
                  ...fault,
                  fault: fault.type === 'אחר' ? fault.description : fault.type,
                  serialNumber: index + 1
                }))}
                />
              </Box>
            </DialogContent>
          </Dialog>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
