import React, { useState } from 'react';
import { Box, Typography, Avatar, IconButton } from '@mui/material';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { sidebarStyles } from '../styles/components';
import SidebarItem from './SidebarItem';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import HomeIcon from '@mui/icons-material/Home';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GroupIcon from '@mui/icons-material/Group';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { useAuth } from '../context/AuthContext';
import { PERMISSIONS } from '../constants/roles';

const Sidebar = ({ 
  activeSection, 
  activeSubSection, 
  userInfo,
  onNewFault,
  onNewSite,
  onSectionChange,
  onSubSectionChange 
}) => {
  const navigate = useNavigate();
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const { user } = useAuth();
  
  const currentDate = new Intl.DateTimeFormat('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date());

  const handleMenuClick = (itemId, onClick) => {
    // Only toggle submenu for items that have subItems
    const items = getItems();
    const item = items.find(i => i.id === itemId);
    if (item?.subItems) {
      if (openSubmenu === itemId) {
        setOpenSubmenu(null);
      } else {
        setOpenSubmenu(itemId);
      }
    }
    
    // Always execute the onClick handler
    if (onClick) {
      onClick();
    }
  };

  const renderUserInfo = () => {
    if (!userInfo) return null;

    return (
      <Box sx={sidebarStyles.userInfo}>
        <Avatar sx={{ bgcolor: 'primary.main' }}>
          <PersonOutlineIcon />
        </Avatar>
        <Box>
          <Typography sx={sidebarStyles.userName}>
            {userInfo.name}
          </Typography>
          <Typography sx={sidebarStyles.userDate}>
            {currentDate}
          </Typography>
        </Box>
        <Box sx={{ marginLeft: 'auto' }}>
          <IconButton 
            onClick={() => navigate('/')} 
            sx={{ 
              color: 'inherit',
              '&:hover': { opacity: 0.8 }
            }}
          >
            <HomeIcon />
          </IconButton>
        </Box>
      </Box>
    );
  };

  const getAdminItems = () => {
    if (!user.hasPermission(PERMISSIONS.ADMIN)) return [];

    return [
      {
        id: 'users',
        icon: GroupIcon,
        text: 'משתמשים',
        onClick: () => {
          onSectionChange('users');
          navigate('/admin/users');
        },
        subItems: [
          {
            id: 'list',
            text: 'רשימת משתמשים',
            onClick: () => {
              onSectionChange('users');
              onSubSectionChange('list');
              navigate('/admin/users');
            }
          },
          {
            id: 'register',
            text: 'רישום ראשוני',
            onClick: () => {
              onSectionChange('users');
              onSubSectionChange('register');
              navigate('/admin/users/registration');
            }
          },
          {
            id: 'permissions',
            text: 'ניהול הרשאות',
            onClick: () => {
              onSectionChange('users');
              onSubSectionChange('permissions');
              navigate('/admin/users/permissions');
            }
          }
        ]
      },
      {
        id: 'sites',
        icon: LocationOnIcon,
        text: 'אתרים',
        onClick: () => {
          onSectionChange('sites');
          navigate('/admin/sites');
        },
        subItems: [
          {
            id: 'list',
            text: 'רשימת אתרים',
            onClick: () => {
              onSectionChange('sites');
              onSubSectionChange('list');
              navigate('/admin/sites');
            }
          },
          {
            id: 'new',
            text: 'הוספת אתר',
            onClick: () => {
              onSectionChange('sites');
              onSubSectionChange('new');
              if (onNewSite) {
                onNewSite();
              }
            }
          },
          {
            id: 'inspection-config',
            text: 'איפיון ביקורת/תרגיל',
            onClick: () => {
              onSectionChange('sites');
              onSubSectionChange('inspection-config');
              navigate('/admin/sites/inspection-config');
            }
          }
        ]
      }
    ];
  };

  const getDashboardItems = () => {
    const items = [];

    if (user.hasPermission(PERMISSIONS.VIEW_INSPECTIONS)) {
      items.push({
        id: 'inspections',
        icon: AssignmentOutlinedIcon,
        text: 'ביקורות',
        onClick: () => navigate('/inspections')
      });
    }

    if (user.hasPermission(PERMISSIONS.VIEW_FAULTS)) {
      items.push({
        id: 'faults',
        icon: ReportProblemOutlinedIcon,
        text: 'תקלות',
        onClick: () => navigate('/faults')
      });
    }

    return items;
  };

  const getInspectionItems = () => {
    const items = [];

    if (user.hasPermission(PERMISSIONS.NEW_INSPECTION)) {
      items.push({
        id: 'new-inspection',
        icon: AddCircleOutlineIcon,
        text: 'ביקורת חדשה',
        onClick: () => navigate('/inspections/new')
      });
    }

    if (user.hasPermission(PERMISSIONS.VIEW_INSPECTIONS)) {
      items.push({
        id: 'inspections',
        icon: ListAltIcon,
        text: 'ביקורות',
        onClick: () => navigate('/inspections')
      });
    }

    if (user.hasPermission(PERMISSIONS.NEW_FAULT)) {
      items.push({
        id: 'new-fault',
        icon: AddCircleOutlineIcon,
        text: 'תקלה חדשה',
        onClick: onNewFault
      });
    }

    if (user.hasPermission(PERMISSIONS.VIEW_FAULTS)) {
      items.push({
        id: 'faults',
        icon: ReportProblemOutlinedIcon,
        text: 'תקלות',
        onClick: () => navigate('/faults')
      });
    }

    if (user.hasPermission(PERMISSIONS.NEW_DRILL)) {
      items.push({
        id: 'new-drill',
        icon: AddCircleOutlineIcon,
        text: 'תרגיל חדש',
        onClick: () => navigate('/drills/new')
      });
    }

    if (user.hasPermission(PERMISSIONS.VIEW_DRILLS)) {
      items.push({
        id: 'drills',
        icon: ListAltIcon,
        text: 'תרגילים',
        onClick: () => navigate('/drills')
      });
    }

    return items;
  };

  const getFaultItems = () => getInspectionItems(); 

  const getItems = () => {
    switch (activeSection) {
      case 'admin':
        return getAdminItems();
      case 'dashboard':
        return getDashboardItems();
      case 'inspections':
        return getInspectionItems();
      case 'faults':
        return getFaultItems();
      default:
        return [];
    }
  };

  return (
    <Box sx={sidebarStyles.sidebar}>
      {renderUserInfo()}
      
      <Box sx={sidebarStyles.menuContainer}>
        {getItems().map((item) => (
          <Box key={item.id}>
            <SidebarItem
              icon={item.icon}
              text={item.text}
              onClick={() => handleMenuClick(item.id, item.onClick)}
              isActive={activeSection === item.id}
            />
            
            {item.subItems && openSubmenu === item.id && (
              <Box sx={sidebarStyles.subItemsContainer}>
                {item.subItems.map((subItem) => (
                  <SidebarItem
                    key={subItem.id}
                    text={subItem.text}
                    onClick={subItem.onClick}
                    isActive={activeSubSection === subItem.id}
                    isSubItem
                  />
                ))}
              </Box>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

Sidebar.propTypes = {
  activeSection: PropTypes.string.isRequired,
  activeSubSection: PropTypes.string,
  userInfo: PropTypes.shape({
    name: PropTypes.string.isRequired
  }),
  onNewFault: PropTypes.func,
  onNewSite: PropTypes.func,
  onSectionChange: PropTypes.func,
  onSubSectionChange: PropTypes.func
};

export default Sidebar;
