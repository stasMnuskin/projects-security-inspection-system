import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Container,
  FormControl,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Snackbar,
  Alert,
  CircularProgress,
  InputLabel,
  Tooltip
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { getRolePermissions, updateRolePermissions } from '../services/api';
import { colors } from '../styles/colors';
import { formStyles } from '../styles/components';
import { ROLE_OPTIONS, PERMISSION_TRANSLATIONS } from '../constants/roles';

function Permissions() {
  const { user } = useAuth();
  const [selectedRole, setSelectedRole] = useState('');
  const [rolePermissions, setRolePermissions] = useState({});
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const showNotification = useCallback((message, severity = 'success') => {
    setNotification({
      open: true,
      message,
      severity
    });
  }, []);

  const fetchRolePermissions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getRolePermissions();
      if (response.success && response.data) {
        setRolePermissions(response.data.roles);
        setAvailablePermissions(response.data.availablePermissions);
      }
    } catch (error) {
      showNotification('שגיאה בטעינת הרשאות', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchRolePermissions();
  }, [fetchRolePermissions]);

  const handleRoleChange = (event) => {
    setSelectedRole(event.target.value);
  };

  const handlePermissionToggle = async (permissionId) => {
    if (!selectedRole || saving) return;

    // Don't allow modifying admin permissions
    if (selectedRole === 'admin') {
      showNotification('לא ניתן לשנות הרשאות מנהל מערכת', 'error');
      return;
    }

    try {
      setSaving(true);
      const currentPermissions = rolePermissions[selectedRole] || [];
      const newPermissions = currentPermissions.includes(permissionId)
        ? currentPermissions.filter(p => p !== permissionId)
        : [...currentPermissions, permissionId];

      await updateRolePermissions(selectedRole, newPermissions);
      
      setRolePermissions(prev => ({
        ...prev,
        [selectedRole]: newPermissions
      }));

      showNotification('ההרשאות עודכנו בהצלחה');
    } catch (error) {
      showNotification(error.message || 'שגיאה בעדכון ההרשאות', 'error');
      // Refresh permissions from server in case of error
      fetchRolePermissions();
    } finally {
      setSaving(false);
    }
  };

  if (user.role !== 'admin') {
    return (
      <Container>
        <Typography>אין לך הרשאה לצפות בדף זה</Typography>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={formStyles.container}>
      <Paper elevation={3} sx={formStyles.paper}>
        <Box sx={formStyles.formBox}>
          <Typography variant="h6" gutterBottom sx={formStyles.title}>
            ניהול הרשאות
          </Typography>

          <FormControl fullWidth sx={{ mb: 4 }}>
            <InputLabel id="role-select-label" sx={{ color: colors.text.white }}>בחר תפקיד</InputLabel>
            <Select
              labelId="role-select-label"
              value={selectedRole}
              label="בחר תפקיד"
              onChange={handleRoleChange}
              sx={{
                color: colors.text.white,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.border.grey
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.border.grey
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.border.grey
                }
              }}
            >
              {ROLE_OPTIONS.map(({ value, label }) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedRole && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom sx={formStyles.subtitle}>
                הרשאות זמינות
                {selectedRole === 'admin' && (
                  <Typography variant="caption" sx={{ color: colors.text.grey, mr: 1 }}>
                    (לא ניתן לשנות הרשאות מנהל מערכת)
                  </Typography>
                )}
              </Typography>
              {availablePermissions.map(permission => (
                <Tooltip 
                  key={permission}
                  title={selectedRole === 'admin' ? 'לא ניתן לשנות הרשאות מנהל מערכת' : ''}
                  placement="top"
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={rolePermissions[selectedRole]?.includes(permission) || false}
                        onChange={() => handlePermissionToggle(permission)}
                        disabled={saving || selectedRole === 'admin'}
                        sx={{
                          color: colors.text.white,
                          '&.Mui-checked': {
                            color: colors.text.white,
                          },
                        }}
                      />
                    }
                    label={PERMISSION_TRANSLATIONS[permission] || permission}
                    sx={{
                      display: 'block',
                      mb: 1,
                      color: colors.text.white,
                    }}
                  />
                </Tooltip>
              ))}
            </Box>
          )}
        </Box>
      </Paper>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert severity={notification.severity} onClose={() => setNotification({ ...notification, open: false })}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Permissions;
