import React, { useState } from 'react';
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
import { Link as RouterLink } from 'react-router-dom';
import { requestPasswordReset } from '../services/api';
import { AppError } from '../utils/errorHandler';
import { pageStyles, formStyles } from '../styles/components';
import logo from '../assets/logo.svg';
import { colors } from '../styles/colors';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setNotification({
        open: true,
        message: 'אם האימייל קיים במערכת, נשלחו הוראות לאיפוס סיסמה',
        severity: 'success'
      });
      setEmail('');
    } catch (error) {
      console.error('Password reset request error:', error);
      let message = 'שגיאה בבקשה לאיפוס סיסמה';
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
              שכחתם סיסמה?
            </Typography>

            <Typography variant="body1" sx={{ 
              color: colors.text.grey,
              textAlign: 'center',
              marginBottom: '1rem'
            }}>
              הזינו את כתובת האימייל שלכם ונשלח לכם קישור לאיפוס הסיסמה
            </Typography>

            <FormControl fullWidth>
              <TextField
                required
                label="אימייל"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              {loading ? 'שולח...' : 'איפוס סיסמה'}
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

export default ForgotPassword;
