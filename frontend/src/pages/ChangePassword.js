import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Typography, Container, Box } from '@mui/material';
import { changePassword } from '../services/api';

function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('הסיסמאות החדשות אינן תואמות');
      return;
    }
    try {
      await changePassword(currentPassword, newPassword);
      const userRole = localStorage.getItem('userRole');
      
      switch(userRole) {
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
      setError(error.message);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'right' }}>
      
        <Box
            sx={{
              marginTop: 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Typography component="h1" variant="h5" color="primary" sx={{ mb: 4, color: 'primary.main' }}>
              שינוי סיסמה
            </Typography>
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                name="currentPassword"
                label="סיסמה נוכחית"
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="newPassword"
                label="סיסמה חדשה"
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="אימות סיסמה חדשה"
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
              >
                שינוי סיסמה
              </Button>
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

export default ChangePassword;