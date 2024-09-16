import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, useTheme, useMediaQuery, Drawer, List, ListItem, ListItemText, IconButton, CircularProgress, Snackbar } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import { useAuth } from '../context/AuthContext';

function Navigation() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();

  const getNavItems = () => {
    if (!user) return [];
    
    switch(user.role) {
      case 'admin':
        return [
          { text: 'דשבורד', link: '/admin' },
          { text: 'משתמשים', link: '/users' },
          { text: 'אתרים', link: '/sites' },
        ];
      case 'security_officer':
        return [
          { text: 'דשבורד', link: '/security' },
          { text: 'ביקורת חדשה', link: '/new-inspection' },
          { text: 'ביקורות', link: '/inspections' },
          { text: 'תקלות', link: '/faults' },
        ];
      case 'entrepreneur':
        return [
          { text: 'דשבורד', link: '/entrepreneur' },
          { text: 'תקלות', link: '/faults' },
          { text: 'ביקורות אחרונות', link: '/latest-inspections' },
        ];
      case 'inspector':
        return [
          { text: 'דשבורד', link: '/inspector' },
          { text: 'הביקורות שלי', link: '/inspections' },
        ];
      default:
        return [];
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      setError('התרחשה שגיאה בעת ההתנתקות. אנא נסה שוב.');
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const navItems = getNavItems();

  const drawer = (
    <Box onClick={() => setDrawerOpen(false)} sx={{ textAlign: 'center', width: 250 }}>
      <Typography variant="h6" sx={{ my: 2, color: theme.palette.primary.main }}>
        מערכת ביקורת אבטחה
      </Typography>
      <List>
        {user ? (
          <>
            {navItems.map((item, index) => (
              <ListItem key={index} component={RouterLink} to={item.link} button>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
            <ListItem button onClick={handleLogout}>
              <ListItemText primary="התנתק" />
              <LogoutIcon />
            </ListItem>
          </>
        ) : (
          <ListItem button onClick={handleLogin}>
            <ListItemText primary="התחבר" />
            <LoginIcon />
          </ListItem>
        )}
      </List>
    </Box>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="64px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <AppBar position="static" sx={{ backgroundColor: theme.palette.primary.main }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: '#fff' }}>
            מערכת ביקורת אבטחה
          </Typography>
          {isMobile ? (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="end"
              onClick={() => setDrawerOpen(true)}
            >
              <MenuIcon />
            </IconButton>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {user ? (
                <>
                  {navItems.map((item, index) => (
                    <Button
                      key={index}
                      color="inherit"
                      component={RouterLink}
                      to={item.link}
                      sx={{ mx: 1, '&:hover': { backgroundColor: theme.palette.primary.dark } }}
                    >
                      {item.text}
                    </Button>
                  ))}
                  <Button 
                    color="inherit" 
                    onClick={handleLogout}
                    startIcon={<LogoutIcon />}
                    sx={{ ml: 2, '&:hover': { backgroundColor: theme.palette.primary.dark } }}
                  >
                    התנתק
                  </Button>
                </>
              ) : (
                <Button 
                  color="inherit" 
                  onClick={handleLogin}
                  startIcon={<LoginIcon />}
                  sx={{ ml: 2, '&:hover': { backgroundColor: theme.palette.primary.dark } }}
                >
                  התחבר
                </Button>
              )}
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
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
        message={error}
      />
    </>
  );
}

export default Navigation;