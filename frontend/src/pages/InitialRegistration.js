import React, { useState, useEffect, useCallback } from 'react';
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
import { useAuth } from '../context/AuthContext';
import { generateRegistrationLink, getOrganizations } from '../services/api';
import { colors } from '../styles/colors';
import { formStyles } from '../styles/components';
import { ROLES } from '../constants/permissions';

function InitialRegistration() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    organization: '',
    role: ''
  });
  const [organizations, setOrganizations] = useState([]);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);

  const fetchOrganizations = useCallback(async () => {
    try {
      const orgs = await getOrganizations();
      setOrganizations(orgs);
    } catch (error) {
      showNotification('שגיאה בטעינת רשימת הארגונים', 'error');
    }
  }, []);

  useEffect(() => {
    if (formData.role === 'integrator' || formData.role === 'maintenance') {
      fetchOrganizations();
    }
  }, [formData.role, fetchOrganizations]);

  const validateForm = () => {
    const newErrors = {};
    
    // Email validation
    if (!formData.email) {
      newErrors.email = 'שדה חובה';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = 'כתובת אימייל לא תקינה';
    }

    // Name validation
    if (!formData.firstName) {
      newErrors.firstName = 'שדה חובה';
    }

    // Organization validation only for integrator/maintenance
    if ((formData.role === 'integrator' || formData.role === 'maintenance')) {
      if (!formData.organization) {
        newErrors.organization = 'שדה חובה';
      } else if (!organizations.includes(formData.organization)) {
        newErrors.organization = 'יש לבחור ארגון קיים מהרשימה';
      }
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = 'יש לבחור תפקיד';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await generateRegistrationLink(formData);
      showNotification('נשלח אימייל הרשמה למשתמש', 'success');
      setFormData({
        email: '',
        firstName: '',
        organization: '',
        role: ''
      });
    } catch (error) {
      showNotification(error.message || 'שגיאה בשליחת הזמנה', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (event) => {
    const newRole = event.target.value;
    setFormData(prev => ({
      ...prev,
      role: newRole,
      // Clear organization when switching roles
      organization: ''
    }));
    if (errors.role) {
      setErrors(prev => ({ ...prev, role: '' }));
    }
  };

  const showNotification = (message, severity = 'success') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  if (user.role !== 'admin') {
    return (
      <Container>
        <Typography>אין לך הרשאה לצפות בדף זה</Typography>
      </Container>
    );
  }

  const isOrgSelectionRole = formData.role === 'integrator' || formData.role === 'maintenance';

  return (
    <Container maxWidth="lg" sx={formStyles.container}>
      <Paper elevation={3} sx={formStyles.paper}>
        <Box sx={formStyles.formBox}>
          <Typography variant="h4" gutterBottom sx={formStyles.title}>
            רישום ראשוני
          </Typography>

          <Typography variant="body1" sx={{ 
            color: colors.text.grey,
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            הזן את פרטי המשתמש החדש ובחר את תפקידו. לאחר השמירה יישלח אליו מייל עם קישור להשלמת ההרשמה
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <TextField
                  required
                  label="אימייל"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, email: e.target.value }));
                    if (errors.email) {
                      setErrors(prev => ({ ...prev, email: '' }));
                    }
                  }}
                  error={!!errors.email}
                  helperText={errors.email}
                  sx={formStyles.textField}
                  inputProps={{
                    dir: "ltr"
                  }}
                />
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <TextField
                  required
                  label="שם פרטי"
                  value={formData.firstName}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, firstName: e.target.value }));
                    if (errors.firstName) {
                      setErrors(prev => ({ ...prev, firstName: '' }));
                    }
                  }}
                  error={!!errors.firstName}
                  helperText={errors.firstName}
                  sx={formStyles.textField}
                />
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                {isOrgSelectionRole ? (
                  <Autocomplete
                    options={organizations}
                    value={formData.organization}
                    onChange={(event, newValue) => {
                      setFormData(prev => ({ ...prev, organization: newValue }));
                      if (errors.organization) {
                        setErrors(prev => ({ ...prev, organization: '' }));
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        required
                        label="ארגון"
                        error={!!errors.organization}
                        helperText={errors.organization}
                        sx={formStyles.textField}
                      />
                    )}
                  />
                ) : (
                  <TextField
                    label="ארגון"
                    value={formData.organization}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, organization: e.target.value }));
                      if (errors.organization) {
                        setErrors(prev => ({ ...prev, organization: '' }));
                      }
                    }}
                    error={!!errors.organization}
                    helperText={errors.organization}
                    sx={formStyles.textField}
                  />
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ 
                color: colors.text.white,
                marginBottom: '1rem'
              }}>
                תפקיד
              </Typography>
              <FormControl component="fieldset" error={!!errors.role}>
                <RadioGroup
                  value={formData.role}
                  onChange={handleRoleChange}
                >
                  {Object.entries(ROLES).map(([key, value]) => (
                    <FormControlLabel
                      key={key}
                      value={key}
                      control={
                        <Radio
                          sx={{
                            color: colors.text.grey,
                            '&.Mui-checked': {
                              color: colors.primary.orange
                            }
                          }}
                        />
                      }
                      label={value}
                      sx={{
                        color: colors.text.white,
                        '& .MuiFormControlLabel-label': {
                          fontSize: '0.9rem'
                        }
                      }}
                    />
                  ))}
                </RadioGroup>
                {errors.role && (
                  <Typography variant="caption" sx={{ color: 'error.main' }}>
                    {errors.role}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                fullWidth
                sx={formStyles.submitButton}
              >
                {loading ? 'שולח...' : 'שלח הזמנה'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

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
    </Container>
  );
}

export default InitialRegistration;
