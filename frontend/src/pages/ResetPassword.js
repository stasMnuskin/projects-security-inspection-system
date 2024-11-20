import React, { useState } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { 
  TextField, 
  Button, 
  Typography, 
  Box, 
  Paper,
  FormControl,
  Snackbar,
  Alert,
  Link
} from '@mui/material';
import { resetPassword } from '../services/api';
import { AppError } from '../utils/errorHandler';
import { pageStyles, formStyles } from '../styles/components';
import logo from '../assets/logo-black.svg';
import { colors } from '../styles/colors';

function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const email = queryParams.get('email');
  const token = queryParams.get('token');

  const [formData, setFormData] = useState({
    email: email || '',
    password: '',
    token: token || ''
  });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'error'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(formData);
      setNotification({
        open: true,
        message: 'הסיסמה אופסה בהצלחה',
        severity: 'success'
      });
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      console.error('Password reset error:', error);
      let message = 'שגיאה באיפוס הסיסמה';
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

  if (!email || !token) {
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
            <Box sx={formStyles.formBox}>
              <Typography variant="h4" sx={formStyles.title}>
                קישור לא תקין
              </Typography>
              <Typography variant="body1" sx={{ 
                color: colors.text.grey,
                textAlign: 'center',
                marginBottom: '1rem'
              }}>
                הקישור לאיפוס הסיסמה אינו תקין או שפג תוקפו
              </Typography>
              <Link
                component={RouterLink}
                to="/forgot-password"
                sx={formStyles.link}
              >
                בקש קישור חדש לאיפוס סיסמה
              </Link>
            </Box>
          </Paper>
        </Box>
      </Box>
    );
  }

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
              איפוס סיסמה
            </Typography>

            <Typography variant="body1" sx={{ 
              color: colors.text.grey,
              textAlign: 'center',
              marginBottom: '1rem'
            }}>
              הזינו את הסיסמה החדשה שלכם
            </Typography>

            <FormControl fullWidth>
              <TextField
                required
                type="password"
                label="סיסמה חדשה"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                sx={formStyles.textField}
                inputProps={{
                  dir: "ltr"
                }}
              />
            </FormControl>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={formStyles.submitButton}
            >
              {loading ? 'מאפס סיסמה...' : 'אפס סיסמה'}
            </Button>

            <Link
              component={RouterLink}
              to="/login"
              sx={formStyles.link}
            >
              חזרה למסך התחברות
            </Link>
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

export default ResetPassword;
