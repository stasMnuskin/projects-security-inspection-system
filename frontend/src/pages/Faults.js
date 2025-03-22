import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
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
  Typography,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../context/AuthContext';
import { 
  getAllFaults, 
  createFault, 
  updateFaultStatus, 
  updateFaultDetails,
  deleteFault,
  getFaultById
} from '../services/api';
import FilterBar from '../components/FilterBar';
import NewFaultForm from '../components/NewFaultForm';
import Sidebar from '../components/Sidebar';
import FaultList from '../components/FaultList';
import { colors } from '../styles/colors';
import { dialogStyles, pageContainerStyles, dialogIconStyles } from '../styles/components';
import { PERMISSIONS } from '../constants/roles';

const getInitialDateRange = () => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6);
  return { startDate, endDate };
};

const Faults = () => {
  const { user } = useAuth();
  const location = useLocation();
  const initialFilters = location.state?.initialFilters || {};
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [faults, setFaults] = useState([]);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Check permissions
  const canViewFaults = user.hasPermission(PERMISSIONS.VIEW_FAULTS);
  const canCreateFault = user.hasPermission(PERMISSIONS.NEW_FAULT);
  const isAdmin = user.hasPermission(PERMISSIONS.ADMIN);
  const canEditTechnicianAndStatus = user.hasPermission(PERMISSIONS.UPDATE_FAULT_STATUS);
  const canEditDescription = ['admin', 'security_officer', 'integrator', 'maintenance'].includes(user.role);

  const initialDateRange = getInitialDateRange();
  const [filters, setFilters] = useState(() => {
    if (initialFilters) {
      const { sites, ...otherFilters } = initialFilters;
      return {
        startDate: initialDateRange.startDate,
        endDate: initialDateRange.endDate,
        sites: sites || [],
        ...otherFilters
      };
    }
    return {
      startDate: initialDateRange.startDate,
      endDate: initialDateRange.endDate,
      sites: [],
      isCritical: null,
      entrepreneur: '',
      type: '',
      description: '',
      status: null,
      id: null
    };
  });

  const [newFaultDialog, setNewFaultDialog] = useState(false);
  const [newFault, setNewFault] = useState({
    type: '',
    description: '',
    siteId: '',
    site: null,
    isCritical: false,
    isPartiallyDisabling: false,
    severity: 'non_disabling'
  });

  const fetchFaults = useCallback(async () => {
    if (!canViewFaults) {
      setError('אין לך הרשאה לצפות בתקלות');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      if (filters.id) {
        const fault = await getFaultById(filters.id);
        if (fault) {
          setFaults([fault]);
          setError(null);
        } else {
          setFaults([]);
          setError('לא נמצאה תקלה');
        }
        return;
      }

      const queryParams = {};
      
      if (filters.startDate) {
        queryParams.startDate = filters.startDate.toISOString();
      }
      if (filters.endDate) {
        queryParams.endDate = filters.endDate.toISOString();
      }
      if (filters.sites !== undefined && filters.sites !== null && filters.sites.length > 0) {
        queryParams.sites = filters.sites.join(',');
      }
      
      // Handle severity filtering
      if (filters.severity) {
        queryParams.severity = filters.severity;
      } else if (filters.isCritical === true) {
        // For backward compatibility, translate isCritical to severity
        queryParams.severity = 'fully_disabling';
      }

      if (filters.entrepreneur) {
        queryParams.entrepreneur = filters.entrepreneur;
      }
      
      if (filters.maintenance) {
        queryParams.maintenanceOrg = filters.maintenance;
      }
      if (filters.integrator) {
        queryParams.integratorOrg = filters.integrator;
      }
      if (filters.type === 'אחר' && filters.description) {
        queryParams.type = 'אחר';
        queryParams.description = filters.description;
      } else if (filters.type) {
        queryParams.type = filters.type;
      }
      if (filters.status) {
        queryParams.status = filters.status;
      }

      const data = await getAllFaults(queryParams);
      if (data.length === 0) {
        setError('לא נמצאו תקלות מתאימות לסינון שנבחר');
      } else {
        setError(null);
      }
      setFaults(data);
    } catch (error) {
      setError('שגיאה בטעינת נתונים');
      console.error('Error fetching faults:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, canViewFaults]);

  // Show dialog when accessing /faults/new
  useEffect(() => {
    if (location.pathname === '/faults/new' && canCreateFault) {
      setNewFaultDialog(true);
    }
  }, [location.pathname, canCreateFault]);

  // Check for fault ID in URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const idParam = params.get('id');
    
    if (idParam) {
      // Update filters with the id from URL
      setFilters(prev => ({
        ...prev,
        id: idParam
      }));
    }
  }, [location.search]); 

  // Fetch faults when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFaults();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchFaults]);

  const handleFilterChange = useCallback((field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      id: field === 'id' ? value : (field === 'sites' ? prev.id : null)
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

      const faultData = {
        ...newFault,
        isPartiallyDisabling: newFault.severity === 'partially_disabling',
        isCritical: newFault.severity === 'fully_disabling'
      };
      
      const createdFault = await createFault(faultData);
      
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
        isCritical: false,
        isPartiallyDisabling: false,
        severity: 'non_disabling'
      });
      
      showNotification('התקלה נוצרה בהצלחה');
    } catch (error) {
      showNotification('שגיאה ביצירת תקלה', 'error');
      console.error('Error creating fault:', error);
    }
  };

  const handleSiteClick = (siteId) => {
    handleFilterChange('sites', [siteId]);
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

  const handleDescriptionChange = async (faultId, description) => {
    if (!canEditDescription) {
      showNotification('אין לך הרשאה לעדכן הערות', 'error');
      return;
    }

    try {
      await updateFaultDetails(faultId, { description });
      handleFaultUpdated({
        id: faultId,
        description
      });
    } catch (error) {
      showNotification('שגיאה בעדכון הערות', 'error');
      console.error('Error updating description:', error);
    }
  };

  const handleTechnicianNotesChange = async (faultId, technicianNotes) => {
    if (!canEditTechnicianAndStatus) {
      showNotification('אין לך הרשאה לעדכן הערות טכנאי', 'error');
      return;
    }

    try {
      await updateFaultDetails(faultId, { technicianNotes });
      handleFaultUpdated({
        id: faultId,
        technicianNotes
      });
    } catch (error) {
      showNotification('שגיאה בעדכון הערות הטכנאי', 'error');
      console.error('Error updating technician notes:', error);
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
      <Box sx={pageContainerStyles.noPermission}>
        <Typography>אין לך הרשאה לצפות בדף זה</Typography>
      </Box>
    );
  }

  return (
    <Box sx={pageContainerStyles.container}>
      <Sidebar
        activeSection="faults"
        userInfo={{ name: user.name }}
        onNewFault={canCreateFault ? () => setNewFaultDialog(true) : null}
      />

      <Box sx={{
        ...pageContainerStyles.content,
        ml: { xs: 0, md: 0 },
        pt: { xs: '48px', md: 2 }
      }}>
        <Typography variant="h4" sx={pageContainerStyles.title}>
          תקלות
        </Typography>
        
        <FilterBar 
          filters={filters} 
          onFilterChange={handleFilterChange}
          variant="faults"
          userRole={user.role}
          disableAutoFetch={false}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box position="relative">
          {loading && (
            <Box sx={pageContainerStyles.loadingOverlay}>
              <CircularProgress sx={{ color: colors.primary.orange }} />
            </Box>
          )}

          <Box sx={{ mt: 3 }}>
            <FaultList 
              faults={faults}
              onSiteClick={handleSiteClick}
              onStatusChange={canEditTechnicianAndStatus ? handleStatusChange : null}
              onTechnicianChange={canEditTechnicianAndStatus ? handleTechnicianChange : null}
              onDescriptionChange={canEditDescription ? handleDescriptionChange : null}
              onTechnicianNotesChange={canEditTechnicianAndStatus ? handleTechnicianNotesChange : null}
              onDeleteFault={isAdmin ? handleDeleteFault : null}
            />
          </Box>
        </Box>

        <Dialog
          open={newFaultDialog}
          onClose={() => setNewFaultDialog(false)}
          maxWidth="md"
          fullWidth
          sx={dialogStyles.dialog}
        >
          <DialogTitle sx={dialogStyles.dialogTitle}>
            תקלה חדשה
            <IconButton
              onClick={() => setNewFaultDialog(false)}
              sx={dialogIconStyles.closeButton}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={dialogStyles.dialogContent}>
            <NewFaultForm onFaultDataChange={setNewFault} />
          </DialogContent>
          <DialogActions sx={dialogStyles.dialogActions}>
            <Button
              onClick={() => setNewFaultDialog(false)}
              sx={dialogStyles.cancelButton}
            >
              ביטול
            </Button>
            <Button
              onClick={handleCreateFault}
              variant="contained"
              sx={dialogStyles.submitButton}
            >
              סיום
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
