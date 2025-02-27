import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, TextField, InputAdornment } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import heLocale from 'date-fns/locale/he';
import { filterStyles, datePickerStyles } from '../styles/components';
import FormField from './common/FormField';
import { colors } from '../styles/colors';

const DateRangeSelector = ({ startDate, endDate, onStartDateChange, onEndDateChange, sx }) => {
  const [openPicker, setOpenPicker] = useState(null);

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

  const handleDatePickerClick = (e, pickerName) => {
    // Stop the click event from reaching the FormField component on mobile
    if (window.innerWidth < 600) {
      e.stopPropagation();
      setOpenPicker(pickerName);
    }
  };

  const handleDateChange = (date, isStart) => {
    if (isStart) {
      onStartDateChange(date);
    } else {
      onEndDateChange(date);
    }
    setOpenPicker(null);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={heLocale}>
      <Box 
        sx={{ 
          ...filterStyles.dateRangeContainer,
          ...sx,
          width: '100%'
        }}
        onKeyDown={preventSubmit}
        role="presentation"
      >
        <FormField label="מתאריך">
          <Box onClick={(e) => handleDatePickerClick(e, 'start')}>
            <DatePicker
              value={startDate}
              onChange={(date) => handleDateChange(date, true)}
              maxDate={endDate}
              onKeyDown={preventSubmit}
              open={openPicker === 'start'}
              onClose={() => setOpenPicker(null)}
              slots={{
                textField: (params) => (
                  <TextField 
                    {...params}
                    {...commonTextFieldProps}
                    sx={datePickerStyles.textField}
                  />
                ),
                openPickerButton: ({ onClick }) => (
                  <InputAdornment position="end" sx={{ cursor: 'pointer' }} onClick={onClick}>
                    <CalendarTodayIcon sx={{ color: colors.text.grey }} />
                  </InputAdornment>
                )
              }}
            />
          </Box>
        </FormField>
        <FormField label="עד תאריך">
          <Box onClick={(e) => handleDatePickerClick(e, 'end')}>
            <DatePicker
              value={endDate}
              onChange={(date) => handleDateChange(date, false)}
              minDate={startDate}
              onKeyDown={preventSubmit}
              open={openPicker === 'end'}
              onClose={() => setOpenPicker(null)}
              slots={{
                textField: (params) => (
                  <TextField 
                    {...params}
                    {...commonTextFieldProps}
                    sx={datePickerStyles.textField}
                  />
                ),
                openPickerButton: ({ onClick }) => (
                  <InputAdornment position="end" sx={{ cursor: 'pointer' }} onClick={onClick}>
                    <CalendarTodayIcon sx={{ color: colors.text.grey }} />
                  </InputAdornment>
                )
              }}
            />
          </Box>
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
