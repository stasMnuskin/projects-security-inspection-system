import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  TextField,
  Typography,
  Container,
  FormControl,
  Button,
  Grid,
  Snackbar,
  Alert,
  FormControlLabel,
  Radio,
  RadioGroup,
  Autocomplete
} from '@mui/material';
import { generateRegistrationLink, getRegistrationOrganizations } from '../services/api';
import { colors } from '../styles/colors';
import { formStyles } from '../styles/components';
import { ROLE_OPTIONS } from '../constants/roles';

function InitialRegistration() {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    organizationName: '',
    role: ''
  });
  const [organizations, setOrganizations] = useState([]);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);

  const showNotification = (message, severity) => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  const fetchOrganizations = useCallback(async (role) => {
    try {
      if (['integrator', 'maintenance'].includes(role)) {
        const type = role;
        const response = await getRegistrationOrganizations(type);
        setOrganizations(response);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
      showNotification('שגיאה בטעינת רשימת הארגונים', 'error');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    if (['maintenance', 'integrator'].includes(formData.role) && !formData.organizationName) {
      setErrors(prev => ({
        ...prev,
        organizationName: 'שדה חובה עבור תפקיד זה'
      }));
      setLoading(false);
      return;
    }

    try {
      await generateRegistrationLink(formData);
      showNotification('קישור הרשמה נשלח בהצלחה', 'success');
      setFormData({
        email: '',
        name: '',
        organizationName: '',
        role: ''
      });
      setOrganizations([]);
    } catch (error) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors.reduce((acc, err) => ({
          ...acc,
          [err.param]: err.msg
        }), {}));
      }
      showNotification(error.response?.data?.message || 'שגיאה בשליחת קישור הרשמה', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setErrors(prev => ({
      ...prev,
      [name]: ''
    }));

    if (name === 'role') {
      if (['integrator', 'maintenance'].includes(value)) {
        fetchOrganizations(value);
      } else {
        setFormData(prev => ({
          ...prev,
          organizationName: ''
        }));
        setOrganizations([]);
      }
    }
  };

  const handleOrganizationChange = (event, newValue) => {
    setFormData(prev => ({
      ...prev,
      organizationName: newValue ? newValue.name : ''
    }));
    setErrors(prev => ({
      ...prev,
      organizationName: ''
    }));
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({
      ...prev,
      open: false
    }));
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={formStyles.paper}>
        <Box component="form" onSubmit={handleSubmit} sx={formStyles.form}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="אימייל"
                name="email"
                value={formData.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
                required
                dir="ltr"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="שם"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={!!errors.name}
                helperText={errors.name}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.role}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  תפקיד
                </Typography>
                <RadioGroup
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                >
                  {ROLE_OPTIONS.map(role => (
                    <FormControlLabel
                      key={role.value}
                      value={role.value}
                      control={<Radio />}
                      label={role.label}
                    />
                  ))}
                </RadioGroup>
                {errors.role && (
                  <Typography color="error" variant="caption">
                    {errors.role}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            {formData.role && (
              <Grid item xs={12}>
                <Autocomplete
                  fullWidth
                  options={organizations}
                  getOptionLabel={(option) => option.name}
                  value={organizations.find(org => org.name === formData.organizationName) || null}
                  onChange={handleOrganizationChange}
                  freeSolo
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="שם ארגון"
                      name="organizationName"
                      value={formData.organizationName}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        organizationName: e.target.value
                      }))}
                      error={!!errors.organizationName}
                      helperText={
                        errors.organizationName || 
                        (['maintenance', 'integrator'].includes(formData.role) 
                          ? 'שדה חובה - ניתן לבחור ארגון קיים או להזין שם חדש'
                          : 'ניתן לבחור ארגון קיים או להזין שם חדש')
                      }
                      required={['maintenance', 'integrator'].includes(formData.role)}
                    />
                  )}
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  ...formStyles.submitButton,
                  backgroundColor: colors.primary
                }}
              >
                שלח קישור הרשמה
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default InitialRegistration;
