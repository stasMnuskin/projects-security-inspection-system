import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, useTheme, useMediaQuery, Drawer, List, ListItem, ListItemText, IconButton } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';

function Navigation() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const userRole = localStorage.getItem('userRole');

  const getNavItems = () => {
    switch(userRole) {
      case 'admin':
        return [
          { text: 'דשבורד', link: '/admin' },
          { text: 'משתמשים', link: '/admin/users' },
          { text: 'אתרים', link: '/admin/sites' },
        ];
      case 'security_officer':
        return [
          { text: 'דשבורד', link: '/security' },
          { text: 'צור ביקורת', link: '/security/create-inspection' },
          { text: 'דוחות', link: '/security/reports' },
        ];
      case 'entrepreneur':
        return [
          { text: 'בית', link: '/entrepreneur' },
          // { text: 'האתרים שלי', link: '/entrepreneur/sites' },
          { text: 'תקלות', link: '/entrepreneur/faults' },
        ];
      case 'inspector':
        return [
          { text: 'דשבורד', link: '/inspector' },
          { text: 'הביקורות שלי', link: '/inspector/inspections' },
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

  const navItems = getNavItems();

  const drawer = (
    <Box onClick={() => setDrawerOpen(false)} sx={{ textAlign: 'center' }}>
      <List>
        {navItems.map((item, index) => (
          <ListItem key={index} component={RouterLink} to={item.link}>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
        <ListItem button onClick={handleLogout}>
          <ListItemText primary="התנתק" />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ mb: 4, color: 'primary.main' }}>
            מערכת ביקורת אבטחה
          </Typography>
          {isMobile ? (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={() => setDrawerOpen(true)}
            >
              <MenuIcon />
            </IconButton>
          ) : (
            <Box>
              {navItems.map((item, index) => (
                <Button
                  key={index}
                  color="inherit"
                  component={RouterLink}
                  to={item.link}
                >
                  {item.text}
                </Button>
              ))}
              <Button color="inherit" onClick={handleLogout}>התנתק</Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        {drawer}
      </Drawer>
    </>
  );
}

export default Navigation;