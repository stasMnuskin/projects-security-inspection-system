import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { layoutStyles } from '../styles/components';
import { homeStyles } from '../styles/homeStyles';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import { colors } from '../styles/colors';

const MenuItem = ({ icon: Icon, label, onClick }) => (
  <Box sx={homeStyles.menuItem} onClick={onClick}>
    <Box sx={homeStyles.iconContainer}>
      <Icon sx={homeStyles.icon} />
    </Box>
    <Typography sx={homeStyles.menuText}>
      {label}
    </Typography>
  </Box>
);

const menuItems = [
  {
    label: 'מנהל מערכת',
    path: '/admin',
    icon: AdminPanelSettingsOutlinedIcon
  },
  {
    label: 'דשבורד',
    path: '/dashboard',
    icon: BarChartOutlinedIcon
  },
  {
    label: 'ביקורות',
    path: '/inspections',
    icon: VisibilityOutlinedIcon
  },
  {
    label: 'תקלות',
    path: '/faults',
    icon: DescriptionOutlinedIcon
  }
];

function Home() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleMenuClick = (path) => {
    // Navigation will be handled by ProtectedRoute component's role check
    navigate(path);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <Box sx={layoutStyles.root}>
      {/* <Box component="img" sx={layoutStyles.logo} /> */}
      <Box sx={homeStyles.container}>
        <Box sx={homeStyles.menuContainer}>
          {/* Logout Button */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'flex-end',
            marginBottom: '1rem',
            marginTop: '-0.5rem',
            marginRight: '-0.5rem'
          }}>
            <IconButton
              onClick={handleLogout}
              sx={{
                color: colors.text.white,
                '&:hover': { 
                  color: colors.primary.orange,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              <LogoutIcon />
            </IconButton>
          </Box>

          <Typography sx={homeStyles.title} color="error">
             ברוכים הבאים לסול-טן, לאן תרצו לגשת? 
          </Typography>
          <Typography sx={homeStyles.subtitle}>
            {/* {getSystemMessage()} */}
          </Typography>
          <Box sx={homeStyles.gridContainer}>
            {menuItems.map((item, index) => (
              <MenuItem
                key={index}
                icon={item.icon}
                label={item.label}
                onClick={() => handleMenuClick(item.path)}
              />
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default Home;
