import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { 
  TextField as MuiTextField, 
  Button, 
  Typography, 
  Box, 
  Paper, 
  Link,
  FormControl,
  Snackbar,
  Alert,
  CircularProgress,
  styled
} from '@mui/material';
import { login as apiLogin } from '../services/api';
import { AppError } from '../utils/errorHandler';
import { useAuth } from '../context/AuthContext';
import { pageStyles, formStyles } from '../styles/components';
import logo from '../assets/logo-black.svg';
import { colors } from '../styles/colors';

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

            <FormControl fullWidth>
              <TextField
                required
                label="אימייל"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                inputProps={{
                  dir: "ltr",
                  autoComplete: "username"
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
                inputProps={{
                  dir: "ltr",
                  autoComplete: "current-password"
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
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Login;
