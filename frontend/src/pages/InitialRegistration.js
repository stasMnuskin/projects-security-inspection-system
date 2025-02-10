import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  TextField as MuiTextField,
  Typography,
  FormControl,
  Button,
  Grid,
  Snackbar,
  Alert,
  FormControlLabel,
  Radio,
  RadioGroup,
  Autocomplete,
  styled
} from '@mui/material';
import { generateRegistrationLink, getRegistrationOrganizations } from '../services/api';
import { colors } from '../styles/colors';
import { formStyles, pageStyles } from '../styles/components';
import { ROLE_OPTIONS } from '../constants/roles';
import logo from '../assets/logo.svg';

const TextField = styled(MuiTextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    color: colors.text.white,
    '& fieldset': {
      borderColor: colors.border.grey
    },
    '&:hover fieldset': {
      borderColor: colors.border.orange
    },
    '&.Mui-focused fieldset': {
      borderColor: colors.primary.orange
    },
    '& input': {
      backgroundColor: `${colors.background.darkGrey} !important`,
      color: `${colors.text.white} !important`,
      WebkitTextFillColor: `${colors.text.white} !important`,
      '&:-webkit-autofill': {
        WebkitBoxShadow: `0 0 0 1000px ${colors.background.darkGrey} inset !important`,
        transition: 'background-color 5000s ease-in-out 0s'
      }
    }
  },
  '& .MuiInputLabel-root': {
    color: colors.text.grey,
    backgroundColor: colors.background.darkGrey,
    padding: '0 8px',
    marginLeft: '-4px',
    marginRight: '-4px',
    transform: 'translate(14px, 16px) scale(1)',
    '&.Mui-focused, &.MuiFormLabel-filled': {
      transform: 'translate(14px, -9px) scale(0.75)'
    },
    '&.Mui-focused': {
      color: colors.primary.orange
    }
  }
}));

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
      let type;
      if (['integrator', 'maintenance'].includes(role)) {
        type = role;
      } else {
        type = 'general';
      }
      const response = await getRegistrationOrganizations(type);
      setOrganizations(response);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      showNotification('שגיאה בטעינת רשימת הארגונים', 'error');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    if (['maintenance', 'integrator', 'entrepreneur'].includes(formData.role) && !formData.organizationName) {
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
      fetchOrganizations(value);
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
    <Box sx={pageStyles.root} dir="rtl">
      <Box 
        component="img" 
        src={logo}
        alt="Logo"
        sx={pageStyles.logo}
      />
      <Box sx={formStyles.container}>
        <Paper elevation={3} sx={formStyles.paper}>
          <Box component="form" onSubmit={handleSubmit} sx={formStyles.formBox}>
            <Typography variant="h4" sx={formStyles.title}>
              רישום משתמש חדש
            </Typography>

            <Grid container spacing={{ xs: 1.5, sm: 2 }}>
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
                  sx={{
                    ...formStyles.textField,
                    '& .MuiInputBase-root': {
                      backgroundColor: 'transparent'
                    }
                  }}
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
                  sx={{
                    ...formStyles.textField,
                    '& .MuiInputBase-root': {
                      backgroundColor: 'transparent'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl 
                  fullWidth 
                  error={!!errors.role}
                  sx={{
                    '& .MuiTypography-root': {
                      color: colors.text.white,
                      fontSize: { xs: '0.9rem', sm: '1rem' },
                      mb: { xs: 0.5, sm: 1 }
                    }
                  }}
                >
                  <Typography variant="subtitle1">
                    תפקיד
                  </Typography>
                  <RadioGroup
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    sx={{
                      '& .MuiFormControlLabel-root': {
                        marginY: { xs: 0.5, sm: 1 }
                      },
                      '& .MuiFormControlLabel-label': {
                        fontSize: { xs: '0.9rem', sm: '1rem' },
                        color: colors.text.white
                      },
                      '& .MuiRadio-root': {
                        color: colors.text.grey,
                        '&.Mui-checked': {
                          color: colors.primary.orange
                        }
                      }
                    }}
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
                    <Typography 
                      color="error" 
                      variant="caption"
                      sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                    >
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
                          (['maintenance', 'integrator', 'entrepreneur'].includes(formData.role) 
                            ? 'שדה חובה - ניתן לבחור ארגון קיים או להזין שם חדש'
                            : 'ניתן לבחור ארגון קיים או להזין שם חדש')
                        }
                        required={['maintenance', 'integrator', 'entrepreneur'].includes(formData.role)}
                        sx={{
                          ...formStyles.textField,
                          '& .MuiInputBase-root': {
                            backgroundColor: 'transparent'
                          },
                          '& .MuiAutocomplete-option': {
                            backgroundColor: 'transparent'
                          },
                          '& .MuiAutocomplete-option[aria-selected="true"]': {
                            backgroundColor: 'transparent'
                          },
                          '& .MuiAutocomplete-option:hover': {
                            backgroundColor: 'transparent'
                          },
                          '& .MuiFormHelperText-root': {
                            fontSize: { xs: '0.8rem', sm: '0.875rem' },
                            marginX: 0
                          }
                        }}
                      />
                    )}
                    ListboxProps={{
                      sx: {
                        '& .MuiAutocomplete-option': {
                          fontSize: { xs: '0.9rem', sm: '1rem' }
                        }
                      }
                    }}
                    PaperComponent={({ children, ...props }) => (
                      <Paper {...props} sx={{ backgroundColor: 'transparent' }}>
                        {children}
                      </Paper>
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
                  sx={formStyles.submitButton}
                >
                  שליחת קישור הרשמה
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{ 
            width: '100%',
            fontSize: { xs: '0.9rem', sm: '1rem' }
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default InitialRegistration;
