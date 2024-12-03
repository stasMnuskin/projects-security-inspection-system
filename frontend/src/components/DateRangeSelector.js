import React from 'react';
import PropTypes from 'prop-types';
import { Box, TextField } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import heLocale from 'date-fns/locale/he';
import { dashboardStyles } from '../styles/dashboardStyles';

const DateRangeSelector = ({ startDate, endDate, onStartDateChange, onEndDateChange }) => {
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
    },
    InputProps: {
      onKeyDown: preventSubmit
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={heLocale}>
      <Box 
        sx={{ 
          display: 'flex', 
          gap: 1,
          width: '100%',
          '& > *': {
            flex: 1
          }
        }}
        onKeyDown={preventSubmit}
        role="presentation"
      >
        <DatePicker
          label="מתאריך"
          value={startDate}
          onChange={onStartDateChange}
          maxDate={endDate}
          onKeyDown={preventSubmit}
          slots={{
            textField: (params) => (
              <TextField 
                {...params}
                {...commonTextFieldProps}
                sx={dashboardStyles.datePicker}
                InputProps={{
                  ...params.InputProps,
                  ...commonTextFieldProps.InputProps
                }}
              />
            )
          }}
        />
        <DatePicker
          label="עד תאריך"
          value={endDate}
          onChange={onEndDateChange}
          minDate={startDate}
          onKeyDown={preventSubmit}
          slots={{
            textField: (params) => (
              <TextField 
                {...params}
                {...commonTextFieldProps}
                sx={dashboardStyles.datePicker}
                InputProps={{
                  ...params.InputProps,
                  ...commonTextFieldProps.InputProps
                }}
              />
            )
          }}
        />
      </Box>
    </LocalizationProvider>
  );
};

DateRangeSelector.propTypes = {
  startDate: PropTypes.instanceOf(Date),
  endDate: PropTypes.instanceOf(Date),
  onStartDateChange: PropTypes.func.isRequired,
  onEndDateChange: PropTypes.func.isRequired
};

export default DateRangeSelector;
