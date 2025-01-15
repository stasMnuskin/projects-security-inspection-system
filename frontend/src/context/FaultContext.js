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
import { colors } from '../styles/colors';
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
    isCritical: false
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

      await createFault(newFault);
      
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

  return (
    <FaultContext.Provider value={{ 
      openNewFaultDialog: () => setNewFaultDialog(true)
    }}>
      {children}

      <Dialog
        open={newFaultDialog}
        onClose={() => setNewFaultDialog(false)}
        maxWidth="sm"
        fullWidth
        sx={dialogStyles.dialog}
      >
        <DialogTitle sx={dialogStyles.dialogTitle}>
          תקלה חדשה
          <IconButton
            onClick={() => setNewFaultDialog(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: colors.text.grey,
              '&:hover': {
                color: colors.text.white,
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
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
