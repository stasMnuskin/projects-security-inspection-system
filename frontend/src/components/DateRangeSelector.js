import React from 'react';
import PropTypes from 'prop-types';
import { Box, TextField, useMediaQuery, useTheme } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import heLocale from 'date-fns/locale/he';
import { filterStyles, datePickerStyles } from '../styles/components';
import FormField from './common/FormField';

const DateRangeSelector = ({ startDate, endDate, onStartDateChange, onEndDateChange, sx }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isSmallMobile = useMediaQuery('(max-width:400px)');
  const preventSubmit = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const commonTextFieldProps = {
    onKeyDown: preventSubmit,
    onKeyPress: (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
      }
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={heLocale}>
      <Box 
        sx={{ 
          ...filterStyles.dateRangeContainer,
          ...sx,
          width: '100%',
          flexDirection: isSmallMobile ? 'column' : 'row-reverse',
          gap: isSmallMobile ? '8px' : isMobile ? '6px' : '8px'
        }}
        onKeyDown={preventSubmit}
        role="presentation"
      >
        <FormField label="עד תאריך">
          <DatePicker
            value={endDate}
            onChange={(date) => onEndDateChange(date)}
            minDate={startDate}
            onKeyDown={preventSubmit}
            disablePortal={false}
            openOnFocus={true}
            closeOnSelect={true}
            slots={{
              textField: (params) => (
                <TextField 
                  {...params}
                  {...commonTextFieldProps}
                  sx={datePickerStyles.textField}
                />
              )
            }}
          />
        </FormField>
        <FormField label="מתאריך">
          <DatePicker
            value={startDate}
            onChange={(date) => onStartDateChange(date)}
            maxDate={endDate}
            onKeyDown={preventSubmit}
            disablePortal={false}
            openOnFocus={true}
            closeOnSelect={true}
            slots={{
              textField: (params) => (
                <TextField 
                  {...params}
                  {...commonTextFieldProps}
                  sx={datePickerStyles.textField}
                />
              )
            }}
          />
        </FormField>
      </Box>
    </LocalizationProvider>
  );
};

DateRangeSelector.propTypes = {
  startDate: PropTypes.instanceOf(Date),
  endDate: PropTypes.instanceOf(Date),
  onStartDateChange: PropTypes.func.isRequired,
  onEndDateChange: PropTypes.func.isRequired,
  sx: PropTypes.object
};

export default DateRangeSelector;
