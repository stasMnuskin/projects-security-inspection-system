import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { 
  Button, 
  Typography, 
  Box, 
  Paper, 
  Link,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import Select from 'react-select';
import { login as apiLogin } from '../services/api';
import { AppError } from '../utils/errorHandler';
import { useAuth } from '../context/AuthContext';
import { pageStyles, formStyles, selectStyles } from '../styles/components';
import FormField from '../components/common/FormField';
import { colors } from '../styles/colors';
import logo from '../assets/logo.svg';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'error'
  });
  const navigate = useNavigate();
  const { login, isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  if (authLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await apiLogin(formData);
      login(response);
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      let message = 'שגיאה בהתחברות למערכת';
      if (error instanceof AppError) {
        message = error.message;
      }
      setNotification({
        open: true,
        message,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
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
              ברוכים הבאים לסול-טן
            </Typography>

            <FormField label="אימייל" required>
              <Select
                inputValue={formData.email}
                value={formData.email ? { value: formData.email, label: formData.email } : null}
                onInputChange={(inputValue, { action }) => {
                  if (action === 'input-change') {
                    setFormData(prev => ({ ...prev, email: inputValue }));
                  }
                }}
                onChange={(newValue) => setFormData(prev => ({ ...prev, email: newValue?.value || '' }))}
                options={[]}
                styles={selectStyles}
                placeholder=""
                isClearable
                components={{
                  DropdownIndicator: () => null,
                  IndicatorSeparator: () => null,
                  Menu: () => null
                }}
              />
            </FormField>

            <FormField label="סיסמה" required>
              <Select
                inputValue={formData.password}
                value={formData.password ? { value: formData.password, label: formData.password } : null}
                onInputChange={(inputValue, { action }) => {
                  if (action === 'input-change') {
                    setFormData(prev => ({ ...prev, password: inputValue }));
                  }
                }}
                onChange={(newValue) => setFormData(prev => ({ ...prev, password: newValue?.value || '' }))}
                options={[]}
                styles={{
                  ...selectStyles,
                  input: (base) => ({
                    ...base,
                    WebkitTextSecurity: 'disc',
                    color: colors.text.white
                  }),
                  singleValue: (base) => ({
                    ...base,
                    WebkitTextSecurity: 'disc',
                    color: colors.text.white
                  })
                }}
                placeholder=""
                isClearable
                components={{
                  DropdownIndicator: () => null,
                  IndicatorSeparator: () => null,
                  Menu: () => null
                }}
              />
            </FormField>

            <Link
              component={RouterLink}
              to="/forgot-password"
              sx={formStyles.link}
            >
              שכחתם סיסמה?
            </Link>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={formStyles.submitButton}
            >
              {loading ? 'מתחבר...' : 'כניסה למערכת'}
            </Button>
          </Box>
        </Paper>
      </Box>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity={notification.severity}
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
          sx={{
            whiteSpace: 'pre-line'
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Login;
