import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  TextField, 
  Button, 
  Typography, 
  Box, 
  Paper,
  Snackbar,
  Alert,
} from '@mui/material';
import { register } from '../services/api';
import { AppError } from '../utils/errorHandler';
import { pageStyles, formStyles, selectStyles } from '../styles/components';
import FormField from '../components/common/FormField';
import logo from '../assets/logo.svg';
import { colors } from '../styles/colors';
import { useAuth } from '../context/AuthContext';
import { login as apiLogin } from '../services/api';

function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const email = queryParams.get('email');
  const token = queryParams.get('token');
  const name = queryParams.get('name');
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: email || '',
    name: name || '',
    password: '',
    token: token || ''
  });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'error'
  });

  // Redirect if no token or email
  React.useEffect(() => {
    if (!token || !email) {
      navigate('/login');
    }
  }, [token, email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // First register the user
      await register(formData);
      
      // Then automatically log them in
      const loginResponse = await apiLogin({
        email: formData.email,
        password: formData.password
      });
      
      // Set the auth context
      login(loginResponse);

      setNotification({
        open: true,
        message: 'ההרשמה בוצעה בהצלחה',
        severity: 'success'
      });

      // Navigate directly to home page after short delay
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Registration error:', error);
      let message = 'שגיאה בהרשמה למערכת';
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

  if (!token || !email) {
    return null;
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
              הרשמה למערכת
            </Typography>

            <FormField label="שם" required>
              <TextField
                required
                value={formData.name}
                disabled={!!name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                sx={{
                  width: '100%',
                  '& .MuiOutlinedInput-root': {
                    ...selectStyles.control,
                    padding: '2px 8px',
                    backgroundColor: name ? colors.background.darkGrey : colors.background.darkGreyOpaque,
                    '@media (max-width:600px)': {
                      minHeight: '48px !important',
                      height: '48px !important'
                    },
                    '@media (min-width:960px)': {
                      minHeight: '40px !important',
                      height: '40px !important'
                    },
                    '& input': {
                      color: name ? colors.text.grey : colors.text.white
                    }
                  }
                }}
              />
            </FormField>

            <FormField label="אימייל" required>
              <TextField
                required
                type="email"
                value={formData.email}
                disabled={!!email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                sx={{
                  width: '100%',
                  '& .MuiOutlinedInput-root': {
                    ...selectStyles.control,
                    padding: '2px 8px',
                    backgroundColor: email ? colors.background.darkGrey : colors.background.darkGreyOpaque,
                    '@media (max-width:600px)': {
                      minHeight: '48px !important',
                      height: '48px !important'
                    },
                    '@media (min-width:960px)': {
                      minHeight: '40px !important',
                      height: '40px !important'
                    },
                    '& input': {
                      color: email ? colors.text.grey : colors.text.white
                    }
                  }
                }}
                inputProps={{
                  dir: "ltr"
                }}
              />
            </FormField>

            <FormField label="סיסמה" required>
              <TextField
                required
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                sx={{
                  width: '100%',
                  '& .MuiOutlinedInput-root': {
                    ...selectStyles.control,
                    padding: '2px 8px',
                    '@media (max-width:600px)': {
                      minHeight: '48px !important',
                      height: '48px !important'
                    },
                    '@media (min-width:960px)': {
                      minHeight: '40px !important',
                      height: '40px !important'
                    }
                  }
                }}
                inputProps={{
                  dir: "ltr"
                }}
              />
            </FormField>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={formStyles.submitButton}
            >
              {loading ? 'נרשם...' : 'הרשמה'}
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

export default Register;
