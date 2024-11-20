import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Snackbar,
  Typography
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { 
  getAllFaults, 
  createFault, 
  updateFaultStatus, 
  updateFaultDetails,
  deleteFault,
  getMaintenanceStaff,
  getIntegrators
} from '../services/api';
import FilterBar from '../components/FilterBar';
import NewFaultForm from '../components/NewFaultForm';
import Sidebar from '../components/Sidebar';
import FaultList from '../components/FaultList';
import Logout from '../components/Logout';
import { colors } from '../styles/colors';
import { PERMISSIONS } from '../constants/roles';

const getInitialDateRange = () => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6);
  return { startDate, endDate };
};

const Faults = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [faults, setFaults] = useState([]);
  const [maintenanceUsers, setMaintenanceUsers] = useState([]);
  const [integratorUsers, setIntegratorUsers] = useState([]);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Check permissions
  const canViewFaults = user.hasPermission(PERMISSIONS.VIEW_FAULTS);
  const canCreateFault = user.hasPermission(PERMISSIONS.NEW_FAULT);
  const isAdmin = user.hasPermission(PERMISSIONS.ADMIN);
  const canEditMaintenanceIntegrator = isAdmin;
  const canEditTechnicianAndStatus = isAdmin || ['integrator', 'maintenance'].includes(user.role);

  const initialDateRange = getInitialDateRange();
  const [filters, setFilters] = useState({
    startDate: initialDateRange.startDate,
    endDate: initialDateRange.endDate,
    site: '',
    isCritical: null,
    maintenance: '',
    integrator: ''
  });

  const [newFaultDialog, setNewFaultDialog] = useState(false);
  const [newFault, setNewFault] = useState({
    type: '',
    description: '',
    siteId: '',
    site: null,
    isCritical: false
  });

  // Function to fetch users for a specific organization
  const fetchUsersForOrganization = useCallback(async (organization) => {
    try {
      const [maintenance, integrators] = await Promise.all([
        getMaintenanceStaff({ organization }),
        getIntegrators({ organization })
      ]);
      setMaintenanceUsers(maintenance);
      setIntegratorUsers(integrators);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, []);

  const fetchFaults = useCallback(async () => {
    if (!canViewFaults) {
      setError('אין לך הרשאה לצפות בתקלות');
      setLoading(false);
      return;
    }

    try {
      const queryParams = {};
      
      if (filters.startDate) {
        queryParams.startDate = filters.startDate.toISOString();
      }
      if (filters.endDate) {
        queryParams.endDate = filters.endDate.toISOString();
      }
      if (filters.site) {
        queryParams.site = filters.site;
      }
      if (filters.isCritical !== null) {
        queryParams.isCritical = filters.isCritical;
      }
      if (filters.maintenance) {
        queryParams.maintenance = filters.maintenance;
      }
      if (filters.integrator) {
        queryParams.integrator = filters.integrator;
      }

      const data = await getAllFaults(queryParams);
      setFaults(data);
      setError(null);
    } catch (error) {
      setError('שגיאה בטעינת נתונים');
      console.error('Error fetching faults:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, canViewFaults]);

  // Initial data load
  useEffect(() => {
    fetchFaults();
  }, [fetchFaults]);

  // Handle filter changes with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetchFaults();
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [fetchFaults]);

  const handleFilterChange = useCallback((field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const showNotification = (message, severity = 'success') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  const handleCreateFault = async () => {
    if (!canCreateFault) {
      showNotification('אין לך הרשאה ליצור תקלה', 'error');
      return;
    }

    try {
      if (!newFault.siteId) {
        showNotification('נדרש לבחור אתר', 'error');
        return;
      }

      if (!newFault.type) {
        showNotification('נדרש לבחור סוג תקלה', 'error');
        return;
      }

      if (newFault.type === 'אחר' && !newFault.description) {
        showNotification('נדרש תיאור לתקלה מסוג אחר', 'error');
        return;
      }

      const createdFault = await createFault(newFault);
      
      setFaults(prevFaults => [
        {
          ...createdFault,
          siteId: newFault.siteId,
          site: {
            name: newFault.site?.name || ''
          }
        },
        ...prevFaults
      ]);
      
      setNewFaultDialog(false);
      setNewFault({
        type: '',
        description: '',
        siteId: '',
        site: null,
        isCritical: false
      });
      
      showNotification('התקלה נוצרה בהצלחה');
    } catch (error) {
      showNotification('שגיאה ביצירת תקלה', 'error');
      console.error('Error creating fault:', error);
    }
  };

  const handleSiteClick = (siteId) => {
    handleFilterChange('site', siteId);
  };

  const handleFaultUpdated = (updatedFault) => {
    setFaults(prevFaults => 
      prevFaults.map(fault => 
        fault.id === updatedFault.id 
          ? { ...fault, ...updatedFault }
          : fault
      )
    );
    showNotification('התקלה עודכנה בהצלחה');
  };

  const handleStatusChange = async (faultId, newStatus) => {
    if (!canEditTechnicianAndStatus) {
      showNotification('אין לך הרשאה לעדכן סטטוס תקלה', 'error');
      return;
    }

    try {
      await updateFaultStatus(faultId, { status: newStatus });
      handleFaultUpdated({
        id: faultId,
        status: newStatus,
        closedTime: newStatus === 'סגור' ? new Date().toISOString() : null
      });
    } catch (error) {
      showNotification('שגיאה בעדכון סטטוס התקלה', 'error');
      console.error('Error updating fault status:', error);
    }
  };

  const handleMaintenanceChange = async (faultId, userId) => {
    if (!canEditMaintenanceIntegrator) {
      showNotification('אין לך הרשאה לעדכן פרטי תקלה', 'error');
      return;
    }

    try {
      const fault = faults.find(f => f.id === faultId);
      if (!fault?.site?.organization) {
        showNotification('לא נמצא ארגון לאתר', 'error');
        return;
      }

      // Fetch maintenance users for the site's organization if needed
      if (maintenanceUsers.length === 0) {
        await fetchUsersForOrganization(fault.site.organization);
      }

      await updateFaultDetails(faultId, { maintenanceUserId: userId });
      const maintenanceUser = maintenanceUsers.find(user => user.id === userId);
      handleFaultUpdated({
        id: faultId,
        maintenanceUser: maintenanceUser ? {
          id: maintenanceUser.id,
          name: `${maintenanceUser.firstName} ${maintenanceUser.lastName}`
        } : null
      });
    } catch (error) {
      showNotification('שגיאה בעדכון איש האחזקה', 'error');
      console.error('Error updating maintenance:', error);
    }
  };

  const handleIntegratorChange = async (faultId, userId) => {
    if (!canEditMaintenanceIntegrator) {
      showNotification('אין לך הרשאה לעדכן פרטי תקלה', 'error');
      return;
    }

    try {
      const fault = faults.find(f => f.id === faultId);
      if (!fault?.site?.organization) {
        showNotification('לא נמצא ארגון לאתר', 'error');
        return;
      }

      // Fetch integrator users for the site's organization if needed
      if (integratorUsers.length === 0) {
        await fetchUsersForOrganization(fault.site.organization);
      }

      await updateFaultDetails(faultId, { integratorUserId: userId });
      const integratorUser = integratorUsers.find(user => user.id === userId);
      handleFaultUpdated({
        id: faultId,
        integratorUser: integratorUser ? {
          id: integratorUser.id,
          name: `${integratorUser.firstName} ${integratorUser.lastName}`
        } : null
      });
    } catch (error) {
      showNotification('שגיאה בעדכון האינטגרטור', 'error');
      console.error('Error updating integrator:', error);
    }
  };

  const handleTechnicianChange = async (faultId, technicianName) => {
    if (!canEditTechnicianAndStatus) {
      showNotification('אין לך הרשאה לעדכן שם טכנאי', 'error');
      return;
    }

    try {
      await updateFaultDetails(faultId, { technician: technicianName });
      handleFaultUpdated({
        id: faultId,
        technician: technicianName
      });
    } catch (error) {
      showNotification('שגיאה בעדכון שם הטכנאי', 'error');
      console.error('Error updating technician:', error);
    }
  };

  const handleDeleteFault = async (faultId) => {
    if (!isAdmin) {
      showNotification('אין לך הרשאה למחוק תקלה', 'error');
      return;
    }

    try {
      await deleteFault(faultId);
      setFaults(prevFaults => prevFaults.filter(fault => fault.id !== faultId));
      showNotification('התקלה נמחקה בהצלחה');
    } catch (error) {
      showNotification('שגיאה במחיקת התקלה', 'error');
      console.error('Error deleting fault:', error);
    }
  };

  if (!canViewFaults) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>אין לך הרשאה לצפות בדף זה</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        activeSection="faults"
        userInfo={{ name: `${user.firstName} ${user.lastName}` }}
        onNewFault={canCreateFault ? () => setNewFaultDialog(true) : null}
      />
      <Logout />

      <Box sx={{ flexGrow: 1, p: 3 }}>
        <FilterBar 
          filters={filters} 
          onFilterChange={handleFilterChange}
          variant="faults"
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

          <Box sx={{ mt: 3 }}>
            <FaultList 
              faults={faults}
              onSiteClick={handleSiteClick}
              onStatusChange={canEditTechnicianAndStatus ? handleStatusChange : null}
              onMaintenanceChange={canEditMaintenanceIntegrator ? handleMaintenanceChange : null}
              onIntegratorChange={canEditMaintenanceIntegrator ? handleIntegratorChange : null}
              onTechnicianChange={canEditTechnicianAndStatus ? handleTechnicianChange : null}
              onDeleteFault={isAdmin ? handleDeleteFault : null}
              onFaultUpdated={handleFaultUpdated}
              maintenanceUsers={maintenanceUsers}
              integratorUsers={integratorUsers}
            />
          </Box>
        </Box>

        <Dialog
          open={newFaultDialog}
          onClose={() => setNewFaultDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: colors.background.darkGrey,
              border: `1px solid ${colors.border.orange}`
            }
          }}
        >
          <DialogTitle sx={{ color: colors.text.white }}>
            תקלה חדשה
          </DialogTitle>
          <DialogContent>
            <NewFaultForm onFaultDataChange={setNewFault} />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setNewFaultDialog(false)}
              sx={{ color: colors.text.grey }}
            >
              ביטול
            </Button>
            <Button
              onClick={handleCreateFault}
              variant="contained"
              sx={{
                backgroundColor: colors.primary.orange,
                '&:hover': {
                  backgroundColor: colors.primary.orangeHover
                }
              }}
            >
              צור
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            severity={notification.severity}
            onClose={() => setNotification(prev => ({ ...prev, open: false }))}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default Faults;
