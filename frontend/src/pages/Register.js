import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { TextField, Button, Typography, Container, Box, Select, MenuItem, FormControl, InputLabel, Link } from '@mui/material';
import { register } from '../services/api';
import { AppError } from '../utils/errorHandler';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await register(username, email, password, role);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userRole', response.data.role);
      
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
    } catch (error) {
      if (error instanceof AppError) {
        setError(`${error.errorCode}: ${error.message}`);
      } else {
        setError('An unexpected error occurred');
      }
      console.error('Registration error:', error);
    }
  };

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
          הרשמה
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="שם משתמש"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="אימייל"
            name="email"
            autoComplete="email"
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel id="role-label">תפקיד</InputLabel>
            <Select
              labelId="role-label"
              id="role"
              value={role}
              label="Role"
              onChange={(e) => setRole(e.target.value)}
            >
              <MenuItem value="security_officer">קב
              "ט</MenuItem>
              <MenuItem value="admin">מנהל</MenuItem>
            </Select>
          </FormControl>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            הרשמה
          </Button>
          <Box sx={{ textAlign: 'center' }}>
            <Link component={RouterLink} to="/login" variant="body2">
              {"כניסה"}
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

export default Register;