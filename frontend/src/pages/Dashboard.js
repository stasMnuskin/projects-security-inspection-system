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
  IconButton,
  Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../context/AuthContext';
import CustomPieChart from '../components/PieChart';
import CustomBarChart from '../components/BarChart';
import { getDashboardData } from '../services/api';
import FilterBar from '../components/FilterBar';
// import FaultTables from '../components/FaultTables';
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
        'כישלון': 0
      },
      inspectionDetails: [],
      drillDetails: []
    },
    faults: {
      recurring: [],
      open: [],
      critical: []
    }
  });
  const [faultDialogOpen, setFaultDialogOpen] = useState(false);
  const [selectedFaultType, setSelectedFaultType] = useState(null);
  const [inspectionDialogOpen, setInspectionDialogOpen] = useState(false);
  const [selectedInspectionType, setSelectedInspectionType] = useState(null);
  const [selectedDrillStatus, setSelectedDrillStatus] = useState(null);
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
    }, 300);

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
            <Grid item xs={12} sm={12} md={6} lg={3}>
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
                    { name: 'ביקורות', value: dashboardData.overview.inspections },
                    { name: 'תרגילים', value: dashboardData.overview.drills }
                  ]}
                  chartColors={[colors.text.grey, colors.primary.orange]}
                  onSliceClick={(entry) => {
                    setSelectedInspectionType(entry.name);
                    setSelectedDrillStatus(entry.name === 'תרגילים' ? null : selectedDrillStatus);
                    setInspectionDialogOpen(true);
                  }}
                />
              </Paper>
            </Grid>
            <Grid item xs={12} sm={12} md={6} lg={3}>
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
                    'rgba(166, 166, 166, 1)',    
                    'rgba(166, 166, 166, 0.8)',  
                    'rgba(166, 166, 166, 0.6)',  
                    'rgba(166, 166, 166, 0.4)'   
                  ]}
                  onSliceClick={(entry) => {
                    const details = entry.originalData.details.map((detail, index) => ({
                      serialNumber: index + 1,
                      site: detail.site,
                      type: entry.originalData.type === 'אחר' ? entry.originalData.description : entry.originalData.type,
                      reportedTime: new Date(detail.reportedTime).toLocaleDateString('he-IL')
                    }));
                    setSelectedFaultType({
                      title: entry.name,
                      data: details,
                      source: 'recurring'
                    });
                    setFaultDialogOpen(true);
                  }}
                />
              </Paper>
            </Grid>
            <Grid item xs={12} sm={12} md={6} lg={3}>
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
                      value: dashboardData.faults.open.filter(f => f.isCritical).length,
                      isCritical: true,
                      isPartiallyDisabling: false
                    },
                    { 
                      name: 'תקלות משביתות חלקית', 
                      value: dashboardData.faults.open.filter(f => !f.isCritical && f.isPartiallyDisabling).length,
                      isCritical: false,
                      isPartiallyDisabling: true
                    },
                    { 
                      name: 'תקלות רגילות',
                      value: dashboardData.faults.open.filter(f => !f.isCritical && !f.isPartiallyDisabling).length,
                      isCritical: false,
                      isPartiallyDisabling: false
                    }
                  ]}
                  chartColors={[colors.primary.orange, colors.border.orange, colors.text.grey]}
                  onSliceClick={(entry) => {
                    let data;
                    if (entry.isCritical) {
                      data = dashboardData.faults.critical;
                    } else if (entry.isPartiallyDisabling) {
                      data = dashboardData.faults.partiallyDisabling;
                    } else {
                      data = dashboardData.faults.open.filter(f => 
                        !f.isCritical && !f.isPartiallyDisabling);
                    }
                    
                    setSelectedFaultType({
                      title: entry.name,
                      data: data.map((fault, index) => ({
                        serialNumber: index + 1,
                        site: fault.site.name,
                        type: fault.type === 'אחר' ? fault.description : fault.type,
                        reportedTime: new Date(fault.reportedTime).toLocaleDateString('he-IL')
                      })),
                      source: 'faults'
                    });
                    setFaultDialogOpen(true);
                  }}
                />
              </Paper>
            </Grid>
            <Grid item xs={12} sm={12} md={6} lg={3}>
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
                      value: dashboardData.overview.drillResults['הצלחה'] || 0
                    },
                    { 
                      name: 'הצלחה חלקית',
                      value: dashboardData.overview.drillResults['הצלחה חלקית'] || 0
                    },
                    { 
                      name: 'כישלון',
                      value: dashboardData.overview.drillResults['כישלון'] || 0
                    }
                  ]}
                  chartColors={[
                    colors.text.grey,          
                    colors.text.grey,          
                    colors.primary.orange      
                  ]}
                  onSliceClick={(entry) => {
                    setSelectedInspectionType(`תרגילים - ${entry.name}`);
                    setSelectedDrillStatus(entry.name);
                    setInspectionDialogOpen(true);
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
                    partiallyDisablingCount: 0,
                    regularCount: 0
                  };
                }
                if (fault.isCritical) {
                  acc[siteId].criticalCount++;
                } else if (fault.isPartiallyDisabling) {
                  acc[siteId].partiallyDisablingCount++;
                } else {
                  acc[siteId].regularCount++;
                }
                return acc;
              }, {}))
              .sort((a, b) => {
                // First compare by critical faults
                if (a.criticalCount !== b.criticalCount) {
                  return b.criticalCount - a.criticalCount;  
                }
                // If critical faults are equal, compare by partially disabling faults
                if (a.partiallyDisablingCount !== b.partiallyDisablingCount) {
                  return b.partiallyDisablingCount - a.partiallyDisablingCount;  
                }
                // If partially disabling faults are equal, compare by regular faults
                return b.regularCount - a.regularCount;  
              })
              .slice(0, 10)}
              onBarClick={({ site, severity }) => {
                
                let faultsToShow = [];
                let dialogTitle = "";
                
                if (severity === 'fully_disabling') {
                  // Critical faults
                  faultsToShow = dashboardData.faults.critical.filter(fault => 
                    fault.site.name === site
                  );
                  dialogTitle = `תקלות משביתות - ${site}`;
                } else if (severity === 'partially_disabling') {
                  // Partially disabling faults
                  faultsToShow = dashboardData.faults.partiallyDisabling.filter(fault => 
                    fault.site.name === site
                  );
                  dialogTitle = `תקלות משביתות חלקית - ${site}`;
                } else {
                  // Regular non-disabling faults
                  faultsToShow = dashboardData.faults.open.filter(fault => 
                    fault.site.name === site && 
                    !fault.isCritical && 
                    !fault.isPartiallyDisabling
                  );
                  dialogTitle = `תקלות רגילות - ${site}`;
                }
                
                // Format data for the dialog
                const formattedData = faultsToShow.map((fault, index) => ({
                  serialNumber: index + 1,
                  site: fault.site.name,
                  type: fault.type === 'אחר' ? fault.description : fault.type,
                  reportedTime: new Date(fault.reportedTime).toLocaleDateString('he-IL')
                }));
                
                if (formattedData.length > 0) {
                  setSelectedFaultType({
                    title: dialogTitle,
                    data: formattedData,
                    source: 'faults'
                  });
                  setFaultDialogOpen(true);
                }
              }}
            />
          </Box>

          {/* Fault Tables */}
          {/* <Box>
            <FaultTables
              openFaults={dashboardData.faults.open}
              criticalFaults={dashboardData.faults.critical}
            />
          </Box> */}

          {/* Fault Details Dialog */}
          <Dialog
            open={faultDialogOpen}
            onClose={() => setFaultDialogOpen(false)}
            maxWidth="lg"
            fullWidth
            disableEnforceFocus
            PaperProps={{
              sx: {
                backgroundColor: colors.background.black,
                color: colors.text.white
              }
            }}
          >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography>
                {selectedFaultType?.title}
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
                {selectedFaultType && (
                  <Box sx={{ overflowX: 'auto' }}>
                    <table style={{ 
                      width: '100%', 
                      borderCollapse: 'collapse',
                      color: colors.text.white
                    }}>
                      <thead>
                        <tr style={{ 
                          backgroundColor: colors.background.darkGrey,
                          textAlign: 'right'
                        }}>
                          <th style={{ padding: '12px', borderBottom: `1px solid ${colors.border.grey}` }}>מס"ד</th>
                          <th style={{ padding: '12px', borderBottom: `1px solid ${colors.border.grey}` }}>אתר</th>
                          {selectedFaultType?.source === 'faults' && (
                            <th style={{ padding: '12px', borderBottom: `1px solid ${colors.border.grey}` }}>רכיב</th>
                          )}
                          <th style={{ padding: '12px', borderBottom: `1px solid ${colors.border.grey}` }}>תאריך פתיחה</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedFaultType.data.map((item) => (
                          <tr key={`${item.site}-${item.reportedTime}-${item.serialNumber}`} style={{
                            '&:hover': {
                              backgroundColor: colors.background.darkGrey
                            }
                          }}>
                            <td style={{ padding: '12px', borderBottom: `1px solid ${colors.border.grey}` }}>
                              {item.serialNumber}
                            </td>
                            <td style={{ padding: '12px', borderBottom: `1px solid ${colors.border.grey}` }}>
                              {item.site}
                            </td>
                            {selectedFaultType?.source === 'faults' && (
                              <td style={{ padding: '12px', borderBottom: `1px solid ${colors.border.grey}` }}>
                                {item.type}
                              </td>
                            )}
                            <td style={{ padding: '12px', borderBottom: `1px solid ${colors.border.grey}` }}>
                              {item.reportedTime}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Box>
                )}
              </Box>
            </DialogContent>
          </Dialog>

          {/* Inspection/Drill Details Dialog */}
          <Dialog
            open={inspectionDialogOpen}
            onClose={() => {
              setInspectionDialogOpen(false);
              setSelectedInspectionType(null);
              setSelectedDrillStatus(null);
            }}
            maxWidth="lg"
            fullWidth
            disableEnforceFocus
            PaperProps={{
              sx: {
                backgroundColor: colors.background.black,
                color: colors.text.white
              }
            }}
          >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography>
                {selectedInspectionType}
              </Typography>
              <IconButton
                onClick={() => {
                  setInspectionDialogOpen(false);
                  setSelectedInspectionType(null);
                  setSelectedDrillStatus(null);
                }}
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
                <Box sx={{ overflowX: 'auto' }}>
                  <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse',
                    color: colors.text.white
                  }}>
                    <thead>
                      <tr style={{ 
                        backgroundColor: colors.background.darkGrey,
                        textAlign: 'right'
                      }}>
                        <th style={{ padding: '12px', borderBottom: `1px solid ${colors.border.grey}` }}>מס"ד</th>
                        <th style={{ padding: '12px', borderBottom: `1px solid ${colors.border.grey}` }}>אתר</th>
                        <th style={{ padding: '12px', borderBottom: `1px solid ${colors.border.grey}` }}>תאריך</th>
                        {selectedInspectionType === 'תרגילים' && !selectedInspectionType.includes(' - ') && (
                          <th style={{ padding: '12px', borderBottom: `1px solid ${colors.border.grey}` }}>סטטוס</th>
                        )}
                        <th style={{ padding: '12px', borderBottom: `1px solid ${colors.border.grey}` }}>הערות</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedInspectionType === 'ביקורות' ? 
                        dashboardData.overview.inspectionDetails : 
                        dashboardData.overview.drillDetails
                          .filter(drill => selectedDrillStatus ? drill.status === selectedDrillStatus : true)
                          .map((drill, index) => ({ ...drill, serialNumber: index + 1 }))
                      )?.map((item) => (
                        <tr key={`${item.site}-${item.date}-${item.serialNumber}`} style={{
                          '&:hover': {
                            backgroundColor: colors.background.darkGrey
                          }
                        }}>
                          <td style={{ padding: '12px', borderBottom: `1px solid ${colors.border.grey}` }}>
                            {item.serialNumber}
                          </td>
                          <td style={{ padding: '12px', borderBottom: `1px solid ${colors.border.grey}` }}>
                            {item.site}
                          </td>
                          <td style={{ padding: '12px', borderBottom: `1px solid ${colors.border.grey}` }}>
                            {new Date(item.date).toLocaleDateString('he-IL')}
                          </td>
                          {selectedInspectionType === 'תרגילים' && !selectedInspectionType.includes(' - ') && (
                            <td style={{ padding: '12px', borderBottom: `1px solid ${colors.border.grey}` }}>
                              {item.status}
                            </td>
                          )}
                          <td style={{ padding: '12px', borderBottom: `1px solid ${colors.border.grey}` }}>
                            <Tooltip 
                              title={item.notes || ""}
                              arrow
                              placement="top" 
                            >
                              <div style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                lineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                wordBreak: 'break-word'
                              }}>
                                {item.notes}
                              </div>
                            </Tooltip>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              </Box>
            </DialogContent>
          </Dialog>
        </Box>
      </Box>
    </Box>
  );
};
export default Dashboard;
