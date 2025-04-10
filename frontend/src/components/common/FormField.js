import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import { formFieldStyles } from '../../styles/components';

const FormField = ({ label, required, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = (e) => {
    
    if (window.innerWidth < 600) {
      // Skip if the FormField contains a DatePicker
      if (e.currentTarget.querySelector('.MuiDatePicker-root, [role="combobox"][aria-haspopup="dialog"]')) {
        return;
      }
      
      // Handle only Autocomplete components
      const autocomplete = e.currentTarget.querySelector('.MuiAutocomplete-root');
      if (autocomplete) {
        setIsOpen(!isOpen);
        autocomplete.style.display = isOpen ? 'none' : 'block';
        
        // If opening, focus the input
        if (!isOpen) {
          setTimeout(() => {
            const input = autocomplete.querySelector('input');
            if (input) input.focus();
          }, 0);
        }
      }
    }
  };

  return (
    <Box sx={formFieldStyles.container} onClick={handleClick}>
      <Box component="label" sx={formFieldStyles.label}>
        {label} {required && <Box component="span" sx={formFieldStyles.required}>*</Box>}
      </Box>
      {children}
    </Box>
  );
};

FormField.propTypes = {
  label: PropTypes.string.isRequired,
  required: PropTypes.bool,
  children: PropTypes.node.isRequired
};

export default FormField;
