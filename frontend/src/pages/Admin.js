import React, { useState, useEffect } from 'react';
import { Box, Typography, Container, Paper } from '@mui/material';
import { layoutStyles, contentStyles } from '../styles/components';
import Sidebar from '../components/Sidebar';
import Users from './Users';
import InitialRegistration from './InitialRegistration';
import Permissions from './Permissions';
import Sites from './Sites';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PERMISSIONS } from '../constants/roles';
import logo from '../assets/logo-black.svg';

const AdminPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('users');
  const [activeSubSection, setActiveSubSection] = useState('list');
  const [siteMode, setSiteMode] = useState('list');

  // Check if user has admin permission
  const canAccessAdmin = user.hasPermission(PERMISSIONS.ADMIN);

  // Redirect if no admin permission
  useEffect(() => {
    if (!canAccessAdmin) {
      navigate('/');
    }
  }, [canAccessAdmin, navigate]);

  const getPageTitle = () => {
    if (activeSection === 'users') {
      switch (activeSubSection) {
        case 'list':
          return 'רשימת משתמשים';
        case 'register':
          return 'רישום ראשוני';
        case 'permissions':
          return 'ניהול הרשאות';
        default:
          return 'מנהל מערכת';
      }
    } else if (activeSection === 'sites') {
      switch (activeSubSection) {
        case 'list':
          return 'רשימת אתרים';
        case 'new':
          return 'הוספת אתר';
        case 'inspection-config':
          return 'איפיון ביקורת/תרגיל';
        default:
          return 'אתרים';
      }
    }
    return 'מנהל מערכת';
  };

  const handleSubSectionChange = (subSection) => {
    setActiveSubSection(subSection);
    if (activeSection === 'sites') {
      // Update siteMode based on subsection
      switch (subSection) {
        case 'new':
          setSiteMode('new');
          break;
        case 'inspection-config':
          setSiteMode('inspection-config');
          break;
        default:
          setSiteMode('list');
      }
    }
  };

  const renderContent = () => {
    if (activeSection === 'users') {
      switch (activeSubSection) {
        case 'list':
          return <Users />;
        case 'register':
          return <InitialRegistration />;
        case 'permissions':
          return <Permissions />;
        default:
          return <Users />;
      }
    } else if (activeSection === 'sites') {
      return <Sites mode={siteMode} onModeChange={setSiteMode} />;
    }
    return null;
  };

  if (!canAccessAdmin) {
    return (
      <Container maxWidth="lg">
        <Typography variant="h4" gutterBottom>שגיאה</Typography>
        <Paper elevation={3} style={{ padding: '20px', marginBottom: '20px' }}>
          <Typography>אין לך הרשאה לצפות בדף זה</Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Box sx={layoutStyles.root} dir="rtl">
      <Box sx={{ padding: '1rem' }}>
        <Box 
          component="img" 
          src={logo} 
          alt="Logo"
          sx={{ 
            height: '40px',
            filter: 'brightness(0) invert(1)'
          }} 
        />
      </Box>
      <Box sx={layoutStyles.pageContainer}>
        <Sidebar 
          activeSection="admin"
          activeSubSection={activeSubSection}
          userInfo={{
            name: `${user.firstName} ${user.lastName}`
          }}
          onSectionChange={setActiveSection}
          onSubSectionChange={handleSubSectionChange}
        />
        <Box sx={contentStyles.mainContent}>
          <Typography variant="h4" sx={contentStyles.pageTitle}>
            {getPageTitle()}
          </Typography>
          {renderContent()}
        </Box>
      </Box>
    </Box>
  );
};

export default AdminPage;