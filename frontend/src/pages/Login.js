import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { TextField, Button, Typography, Container, Box, Link } from '@mui/material';
import { login } from '../services/api';
import { AppError } from '../utils/errorHandler';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await login(email, password);
      console.log('Login response:', response);
      
      if (response && response.data && response.data.role) {
        localStorage.setItem('userRole', response.data.role);
        localStorage.setItem('token', response.data.token);
        
        switch(response.data.role) {
          case 'admin':
            navigate('/admin');
            break;
          case 'security_officer':
            navigate('/security');
            break;
          case 'entrepreneur':
            navigate('/entrepreneur');
            break;
          case 'inspector':
            navigate('/inspector');
            break;
          default:
            navigate('/');
        }
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof AppError) {
        setError(`${error.errorCode}: ${error.message}`);
      } else {
        setError('An unexpected error occurred during login');
      }
    }
  };
  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          כניסה
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="אימייל"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="סיסמה"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            כניסה
          </Button>
          <Box sx={{ textAlign: 'center' }}>
            <Link component={RouterLink} to="/register" variant="body2">
              {"רישום משתמש (מנהל בלבד)"}
            </Link>
          </Box>
          {error && (
            <Typography color="error" align="center">
              {error}
            </Typography>
          )}
        </Box>
      </Box>
    </Container>
  );
}

export default Login;