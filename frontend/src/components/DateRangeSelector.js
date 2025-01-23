import React from 'react';
import PropTypes from 'prop-types';
import { Box, TextField, InputAdornment } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import heLocale from 'date-fns/locale/he';
import { filterStyles } from '../styles/components';

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
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={heLocale}>
      <Box 
        sx={filterStyles.dateRangeContainer}
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
                sx={filterStyles.datePicker}
              />
            ),
            openPickerButton: ({ onClick }) => (
              <InputAdornment position="end" sx={{ cursor: 'pointer' }} onClick={onClick}>
                <CalendarTodayIcon />
              </InputAdornment>
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
                sx={filterStyles.datePicker}
              />
            ),
            openPickerButton: ({ onClick }) => (
              <InputAdornment position="end" sx={{ cursor: 'pointer' }} onClick={onClick}>
                <CalendarTodayIcon />
              </InputAdornment>
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
