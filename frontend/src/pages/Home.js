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
import { PERMISSIONS } from '../constants/roles';

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
    icon: AdminPanelSettingsOutlinedIcon,
    requiredPermissions: [PERMISSIONS.ADMIN]
  },
  {
    label: 'דשבורד',
    path: '/dashboard',
    icon: BarChartOutlinedIcon,
    requiredPermissions: [PERMISSIONS.DASHBOARD]
  },
  {
    label: 'ביקורות',
    path: '/inspections',
    icon: VisibilityOutlinedIcon,
    requiredPermissions: [
      PERMISSIONS.VIEW_INSPECTIONS,
      PERMISSIONS.NEW_INSPECTION,
      PERMISSIONS.VIEW_DRILLS,
      PERMISSIONS.NEW_DRILL
    ]
  },
  {
    label: 'תקלות',
    path: '/faults',
    icon: DescriptionOutlinedIcon,
    requiredPermissions: [
      PERMISSIONS.VIEW_FAULTS,
      PERMISSIONS.NEW_FAULT,
      PERMISSIONS.UPDATE_FAULT_STATUS,
      PERMISSIONS.UPDATE_FAULT_DETAILS
    ]
  }
];

function Home() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  // Filter menu items based on user permissions
  const hasPermissionForMenuItem = (item) => {
    return item.requiredPermissions.some(permission => user.hasPermission(permission));
  };

  const filteredMenuItems = menuItems.filter(hasPermissionForMenuItem);

  const handleMenuClick = (path) => {
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
            {filteredMenuItems.map((item, index) => (
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
