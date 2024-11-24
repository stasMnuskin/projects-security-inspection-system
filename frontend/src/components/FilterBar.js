import React, { useEffect, useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { Box, Autocomplete, TextField, CircularProgress } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { dashboardStyles } from '../styles/dashboardStyles';
import { colors } from '../styles/colors';
import { getSites, getSecurityOfficers, getOrganizations, getInspectionTypes } from '../services/api';
import { useAuth } from '../context/AuthContext';
import DateRangeSelector from './DateRangeSelector';

const FAULT_CRITICALITY = [
  { value: true, label: 'משביתה' },
  { value: false, label: 'לא משביתה' }
];

const FilterBar = ({ filters, onFilterChange, variant = 'faults', drillTypes = [] }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [options, setOptions] = useState({
    sites: [],
    securityOfficers: [],
    maintenance: [],
    integrators: [],
    drillTypes: []
  });

  const timeoutRef = useRef(null);
  const filterValuesRef = useRef({});
  const initialFilterSetRef = useRef(false);

  const handleFilterChange = useCallback((field, value) => {
    filterValuesRef.current[field] = value;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      onFilterChange(field, filterValuesRef.current[field]);
    }, 300);
  }, [onFilterChange]);

  // Set initial organization filter based on user role
  useEffect(() => {
    if (!initialFilterSetRef.current) {
      if (user.role === 'maintenance' && user.organizationId) {
        handleFilterChange('maintenance', user.organizationId);
      } else if (user.role === 'integrator' && user.organizationId) {
        handleFilterChange('integrator', user.organizationId);
      }
      initialFilterSetRef.current = true;
    }
  }, [user.role, user.organizationId, handleFilterChange]);

  // Fetch all options including drill types
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setError(null);
        const [
          sitesData,
          securityOfficersData,
          maintenanceOrgs,
          integratorOrgs,
          inspectionTypesData
        ] = await Promise.all([
          getSites(),
          getSecurityOfficers(),
          getOrganizations('maintenance'),
          getOrganizations('integrator'),
          variant === 'drills' ? getInspectionTypes() : Promise.resolve(null)
        ]);

        // Filter sites for entrepreneurs only
        let filteredSites = sitesData;
        if (user.role === 'entrepreneur') {
          filteredSites = sitesData.filter(site => site.entrepreneurId === user.id);
        }

        // Get drill types from inspection types
        let fetchedDrillTypes = [];
        if (variant === 'drills' && inspectionTypesData?.data) {
          const drillType = inspectionTypesData.data.find(type => type.type === 'drill');
          if (drillType) {
            const drillTypeField = drillType.formStructure.find(field => field.id === 'drill_type');
            if (drillTypeField?.options) {
              fetchedDrillTypes = drillTypeField.options;
            }
          }
        }

        setOptions({
          sites: filteredSites,
          securityOfficers: securityOfficersData || [],
          maintenance: maintenanceOrgs || [],
          integrators: integratorOrgs || [],
          drillTypes: drillTypes.length > 0 ? drillTypes : fetchedDrillTypes
        });
      } catch (error) {
        console.error('Error fetching filter options:', error);
        setError('שגיאה בטעינת אפשרויות סינון');
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, [user.role, user.id, variant, drillTypes]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const formatOrganizationName = (org) => org ? org.name : '';

  const preventSubmit = useCallback((event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }, []);

  const commonAutocompleteProps = {
    disablePortal: true,
    selectOnFocus: true,
    blurOnSelect: true,
    clearOnBlur: true,
    handleHomeEndKeys: false,
    freeSolo: false,
    disableClearable: false,
    autoSelect: false,
    autoComplete: false,
    includeInputInList: true,
    filterSelectedOptions: true,
    onKeyDown: preventSubmit,
    componentsProps: {
      paper: {
        onKeyDown: preventSubmit
      },
      popper: {
        onKeyDown: preventSubmit
      }
    }
  };

  const renderTextField = (params, label, loading = false) => (
    <TextField
      {...params}
      label={label}
      sx={dashboardStyles.filterSelect}
      onKeyDown={preventSubmit}
      InputProps={{
        ...params.InputProps,
        onKeyDown: preventSubmit,
        endAdornment: (
          <>
            {loading ? <CircularProgress color="inherit" size={20} /> : null}
            {params.InputProps.endAdornment}
          </>
        ),
      }}
    />
  );

  return (
    <Box 
      sx={dashboardStyles.filterBar} 
      onKeyDown={preventSubmit}
      role="presentation"
    >
      <Box sx={{ display: 'flex', alignItems: 'center', marginRight: 'auto', order: 7 }}>
        <FilterListIcon sx={{ color: colors.text.white }} />
      </Box>

      {variant !== 'drills' && (
        <Autocomplete
          {...commonAutocompleteProps}
          loading={loading}
          options={options.integrators}
          getOptionLabel={formatOrganizationName}
          value={options.integrators.find(org => org.id === (user.role === 'integrator' ? user.organizationId : filters.integrator)) || null}
          onChange={(_, newValue) => handleFilterChange('integrator', newValue?.id || '')}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          disabled={user.role === 'integrator'}
          renderInput={(params) => renderTextField(params, "אינטגרטור", loading)}
        />
      )}

      {variant !== 'drills' && (
        <Autocomplete
          {...commonAutocompleteProps}
          loading={loading}
          options={options.maintenance}
          getOptionLabel={formatOrganizationName}
          value={options.maintenance.find(org => org.id === (user.role === 'maintenance' ? user.organizationId : filters.maintenance)) || null}
          onChange={(_, newValue) => handleFilterChange('maintenance', newValue?.id || '')}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          disabled={user.role === 'maintenance'}
          renderInput={(params) => renderTextField(params, "אחזקה", loading)}
        />
      )}

      {variant === 'faults' && (
        <Autocomplete
          {...commonAutocompleteProps}
          options={FAULT_CRITICALITY}
          getOptionLabel={(option) => option.label}
          value={FAULT_CRITICALITY.find(opt => opt.value === filters.isCritical) || null}
          onChange={(_, newValue) => handleFilterChange('isCritical', newValue?.value)}
          renderInput={(params) => renderTextField(params, "סוג תקלה")}
        />
      )}

      {variant === 'drills' ? (
        <>
          <Autocomplete
            {...commonAutocompleteProps}
            loading={loading}
            options={options.drillTypes}
            value={filters.drillType || null}
            onChange={(_, newValue) => handleFilterChange('drillType', newValue)}
            renderInput={(params) => renderTextField(params, "סוג תרגיל", loading)}
          />
          <Autocomplete
            {...commonAutocompleteProps}
            loading={loading}
            options={options.securityOfficers}
            getOptionLabel={(user) => user?.name || ''}
            value={options.securityOfficers.find(user => user.id === filters.securityOfficer) || null}
            onChange={(_, newValue) => handleFilterChange('securityOfficer', newValue?.id || '')}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => renderTextField(params, "קב״ט", loading)}
          />
        </>
      ) : (
        <Autocomplete
          {...commonAutocompleteProps}
          loading={loading}
          options={options.securityOfficers}
          getOptionLabel={(user) => user?.name || ''}
          value={options.securityOfficers.find(user => user.id === filters.securityOfficer) || null}
          onChange={(_, newValue) => handleFilterChange('securityOfficer', newValue?.id || '')}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderInput={(params) => renderTextField(params, "קב״ט", loading)}
        />
      )}

      <Autocomplete
        {...commonAutocompleteProps}
        loading={loading}
        options={options.sites}
        getOptionLabel={(option) => option.name || ''}
        value={options.sites.find(site => site.id === filters.site) || null}
        onChange={(_, newValue) => handleFilterChange('site', newValue?.id || '')}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        renderInput={(params) => (
          <TextField
            {...params}
            label="אתר"
            error={!!error}
            helperText={error}
            sx={dashboardStyles.filterSelect}
            onKeyDown={preventSubmit}
            InputProps={{
              ...params.InputProps,
              onKeyDown: preventSubmit,
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />

      <DateRangeSelector
        startDate={filters.startDate}
        endDate={filters.endDate}
        onStartDateChange={(date) => handleFilterChange('startDate', date)}
        onEndDateChange={(date) => handleFilterChange('endDate', date)}
      />
    </Box>
  );
};

FilterBar.propTypes = {
  filters: PropTypes.shape({
    startDate: PropTypes.instanceOf(Date),
    endDate: PropTypes.instanceOf(Date),
    site: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    isCritical: PropTypes.bool,
    securityOfficer: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    maintenance: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    integrator: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    drillType: PropTypes.string
  }).isRequired,
  onFilterChange: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(['faults', 'inspections', 'drills', 'dashboard']),
  drillTypes: PropTypes.arrayOf(PropTypes.string)
};

export default FilterBar;
