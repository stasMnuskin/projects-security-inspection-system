import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { 
  TextField, 
  Button, 
  Typography, 
  Box, 
  Paper, 
  Link,
  FormControl,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import { login as apiLogin } from '../services/api';
import { AppError } from '../utils/errorHandler';
import { useAuth } from '../context/AuthContext';
import { pageStyles, formStyles } from '../styles/components';
import logo from '../assets/logo-black.svg';

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

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // Don't render login form if already authenticated
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

            <FormControl fullWidth>
              <TextField
                required
                label="אימייל"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                sx={formStyles.textField}
                inputProps={{
                  dir: "ltr"
                }}
              />
            </FormControl>

            <FormControl fullWidth>
              <TextField
                required
                type="password"
                label="סיסמה"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                sx={formStyles.textField}
                inputProps={{
                  dir: "ltr"
                }}
              />
            </FormControl>

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
              {loading ? 'מתחבר...' : 'כנס למערכת'}
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
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Login;
