import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

function Navigation() {
  const userRole = localStorage.getItem('userRole');

  const getNavItems = () => {
    switch(userRole) {
      case 'admin':
        return [
          { text: 'Dashboard', link: '/admin' },
          { text: 'Users', link: '/admin/users' },
          { text: 'Sites', link: '/admin/sites' },
        ];
      case 'security_officer':
        return [
          { text: 'Dashboard', link: '/security' },
          { text: 'Create Inspection', link: '/security/create-inspection' },
          { text: 'Reports', link: '/security/reports' },
        ];
      case 'entrepreneur':
        return [
          { text: 'Dashboard', link: '/entrepreneur' },
          { text: 'My Sites', link: '/entrepreneur/sites' },
          { text: 'Faults', link: '/entrepreneur/faults' },
        ];
      case 'inspector':
        return [
          { text: 'Dashboard', link: '/inspector' },
          { text: 'My Inspections', link: '/inspector/inspections' },
        ];
      default:
        return [];
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    window.location.href = '/login';
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Security Inspection System
        </Typography>
        <Box>
          {getNavItems().map((item, index) => (
            <Button
              key={index}
              color="inherit"
              component={RouterLink}
              to={item.link}
            >
              {item.text}
            </Button>
          ))}
          <Button color="inherit" onClick={handleLogout}>Logout</Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navigation;