import React from 'react';
import { IconButton } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { colors } from '../styles/colors';

const Logout = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <IconButton
      onClick={handleLogout}
      sx={{
        position: 'absolute',
        top: '1rem',
        left: '1rem',
        color: colors.text.white,
        '&:hover': { opacity: 0.8 },
        zIndex: 1000
      }}
    >
      <LogoutIcon />
    </IconButton>
  );
};

export default Logout;
