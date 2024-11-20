import React from 'react';
import { Box, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import { colors } from '../styles/colors';

const SidebarItem = ({ 
  icon: Icon, 
  text, 
  onClick, 
  isActive = false, 
  isSubItem = false 
}) => {
  const baseStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    padding: '0.75rem 1rem',
    cursor: 'pointer',
    borderRadius: '4px',
    transition: 'all 0.2s ease',
    position: 'relative',
    ...(isSubItem && {
      paddingRight: '2rem',
      '&::before': {
        content: '""',
        position: 'absolute',
        right: '1rem',
        top: 0,
        width: '1px',
        height: '100%',
        backgroundColor: colors.primary.orange,
        opacity: 0.3
      }
    }),
    ...(isActive && {
      backgroundColor: colors.background.active,
      '&:hover': {
        backgroundColor: colors.background.activeHover
      }
    }),
    '&:hover': {
      backgroundColor: isActive ? colors.background.activeHover : colors.background.hover
    }
  };

  return (
    <Box sx={baseStyles} onClick={onClick}>
      {Icon && (
        <Icon sx={{
          color: colors.primary.orange,
          fontSize: isSubItem ? '1.25rem' : '1.5rem'
        }} />
      )}
      <Typography sx={{
        color: colors.text.white,
        fontSize: isSubItem ? '0.9rem' : '1rem',
        fontWeight: isActive ? 500 : 400,
        opacity: isActive ? 1 : 0.9
      }}>
        {text}
      </Typography>
    </Box>
  );
};

SidebarItem.propTypes = {
  icon: PropTypes.elementType,
  text: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  isActive: PropTypes.bool,
  isSubItem: PropTypes.bool
};

export default SidebarItem;
