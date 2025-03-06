import React, { createContext, useState, useContext } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Snackbar,
  Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import NewFaultForm from '../components/NewFaultForm';
import { dialogStyles } from '../styles/components';
// import { colors } from '../styles/colors';
import { createFault } from '../services/api';

const FaultContext = createContext();

export const useFault = () => useContext(FaultContext);

export const FaultProvider = ({ children }) => {
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
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const showNotification = (message, severity = 'success') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  const handleCreateFault = async () => {
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

      // Make sure isPartiallyDisabling is properly set based on severity
      const faultData = {
        ...newFault,
        isPartiallyDisabling: newFault.severity === 'partially_disabling'
      };
      
      await createFault(faultData);
      
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

  return (
    <FaultContext.Provider value={{ 
      openNewFaultDialog: () => setNewFaultDialog(true)
    }}>
      {children}

      <Dialog
        open={newFaultDialog}
        onClose={() => setNewFaultDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          תקלה חדשה
          <IconButton
            onClick={() => setNewFaultDialog(false)}
            sx={dialogStyles.closeButton}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
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
    </FaultContext.Provider>
  );
};
