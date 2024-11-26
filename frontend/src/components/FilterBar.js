import React, { useEffect, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Autocomplete, TextField } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { dashboardStyles } from '../styles/dashboardStyles';
import { colors } from '../styles/colors';
import { useAuth } from '../context/AuthContext';
import DateRangeSelector from './DateRangeSelector';
import { 
  getSites, 
  getSecurityOfficers, 
  getOrganizations, 
  getInspectionTypes,
  getSitesByEntrepreneur,
  getOrganizationsBySites
} from '../services/api';

const FAULT_CRITICALITY = [
  { value: true, label: 'משביתה' },
  { value: false, label: 'לא משביתה' }
];

const FilterBar = ({ 
  filters, 
  onFilterChange, 
  variant = 'faults'
}) => {
  const { user, loading: authLoading } = useAuth();
  const [options, setOptions] = useState({
    sites: [],
    securityOfficers: [],
    maintenance: [],
    integrators: [],
    drillTypes: []
  });

  // Load filter options
  useEffect(() => {
    // אם AuthContext עדיין טוען, נחכה
    if (authLoading) {
      console.log('Auth is still loading, waiting...');
      return;
    }

    // אם אין משתמש, לא נטען כלום
    if (!user) {
      console.log('No user, skipping load...');
      return;
    }

    const loadOptions = async () => {
      try {
        console.log('Loading options for user:', user);
        console.log('User role:', user.role);
        console.log('User ID:', user.id);

        let sitesData = [], maintenanceOrgs = [], integratorOrgs = [], securityOfficersData = [];
        
        try {
          if (user.role === 'entrepreneur') {
            console.log('Loading entrepreneur-specific data...');
            
            // Load sites first
            try {
              sitesData = await getSitesByEntrepreneur(user.id);
              console.log('Loaded sites:', sitesData);

              // Get site IDs
              const siteIds = sitesData.map(site => site.id);

              // Load organizations for these sites
              if (siteIds.length > 0) {
                try {
                  [maintenanceOrgs, integratorOrgs] = await Promise.all([
                    getOrganizationsBySites(siteIds, 'maintenance'),
                    getOrganizationsBySites(siteIds, 'integrator')
                  ]);
                  console.log('Loaded maintenance orgs:', maintenanceOrgs);
                  console.log('Loaded integrator orgs:', integratorOrgs);
                } catch (error) {
                  console.error('Error loading organizations:', error);
                  maintenanceOrgs = [];
                  integratorOrgs = [];
                }
              }
            } catch (error) {
              console.error('Error loading sites:', error);
              sitesData = [];
            }
          } else {
            console.log('Loading general data...');
            
            // Load all data for non-entrepreneurs
            const [sites, maintenance, integrators] = await Promise.all([
              getSites(),
              getOrganizations('maintenance'),
              getOrganizations('integrator')
            ]);
            
            sitesData = sites;
            maintenanceOrgs = maintenance;
            integratorOrgs = integrators;
          }

          // Load security officers separately
          try {
            securityOfficersData = await getSecurityOfficers();
            console.log('Loaded security officers:', securityOfficersData);
          } catch (error) {
            console.error('Error loading security officers:', error);
            securityOfficersData = [];
          }

          console.log('Setting options with:', {
            sites: sitesData,
            securityOfficers: securityOfficersData,
            maintenance: maintenanceOrgs,
            integrators: integratorOrgs
          });

          setOptions(prev => ({
            ...prev,
            sites: sitesData || [],
            securityOfficers: securityOfficersData || [],
            maintenance: maintenanceOrgs || [],
            integrators: integratorOrgs || []
          }));

          // Load drill types only for drills variant
          if (variant === 'drills') {
            try {
              console.log('Loading drill types...');
              const inspectionTypesData = await getInspectionTypes();
              if (inspectionTypesData?.data) {
                const drillType = inspectionTypesData.data.find(type => type.type === 'drill');
                if (drillType) {
                  const drillTypeField = drillType.formStructure.find(field => field.id === 'drill_type');
                  if (drillTypeField?.options) {
                    console.log('Setting drill types:', drillTypeField.options);
                    setOptions(prev => ({
                      ...prev,
                      drillTypes: drillTypeField.options
                    }));
                  }
                }
              }
            } catch (error) {
              console.error('Error loading drill types:', error);
            }
          }
        } catch (error) {
          console.error('Error in loadOptions:', error);
        }
      } catch (error) {
        console.error('Critical error in loadOptions:', error);
      }
    };

    loadOptions();
  }, [user, user?.role, user?.id, variant, authLoading]);

  // Set initial organization filter
  useEffect(() => {
    if (user?.role === 'maintenance' && user?.organizationId && !filters.maintenance) {
      onFilterChange('maintenance', user.organizationId);
    } else if (user?.role === 'integrator' && user?.organizationId && !filters.integrator) {
      onFilterChange('integrator', user.organizationId);
    }
  }, [user?.role, user?.organizationId, filters.maintenance, filters.integrator, onFilterChange]);

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

  const renderTextField = (params, label) => (
    <TextField
      {...params}
      label={label}
      sx={dashboardStyles.filterSelect}
      onKeyDown={preventSubmit}
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
          options={options.integrators}
          getOptionLabel={formatOrganizationName}
          value={options.integrators.find(org => org.id === (user?.role === 'integrator' ? user?.organizationId : filters.integrator)) || null}
          onChange={(_, newValue) => onFilterChange('integrator', newValue?.id || '')}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          disabled={user?.role === 'integrator'}
          renderInput={(params) => renderTextField(params, "אינטגרטור")}
        />
      )}

      {variant !== 'drills' && (
        <Autocomplete
          {...commonAutocompleteProps}
          options={options.maintenance}
          getOptionLabel={formatOrganizationName}
          value={options.maintenance.find(org => org.id === (user?.role === 'maintenance' ? user?.organizationId : filters.maintenance)) || null}
          onChange={(_, newValue) => onFilterChange('maintenance', newValue?.id || '')}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          disabled={user?.role === 'maintenance'}
          renderInput={(params) => renderTextField(params, "אחזקה")}
        />
      )}

      {variant === 'faults' && (
        <Autocomplete
          {...commonAutocompleteProps}
          options={FAULT_CRITICALITY}
          getOptionLabel={(option) => option.label}
          value={FAULT_CRITICALITY.find(opt => opt.value === filters.isCritical) || null}
          onChange={(_, newValue) => onFilterChange('isCritical', newValue?.value)}
          renderInput={(params) => renderTextField(params, "סוג תקלה")}
        />
      )}

      {variant === 'drills' ? (
        <>
          <Autocomplete
            {...commonAutocompleteProps}
            options={options.drillTypes}
            value={filters.drillType || null}
            onChange={(_, newValue) => onFilterChange('drillType', newValue)}
            renderInput={(params) => renderTextField(params, "סוג תרגיל")}
          />
          <Autocomplete
            {...commonAutocompleteProps}
            options={options.securityOfficers}
            getOptionLabel={(user) => user?.name || ''}
            value={options.securityOfficers.find(user => user.id === filters.securityOfficer) || null}
            onChange={(_, newValue) => onFilterChange('securityOfficer', newValue?.id || '')}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => renderTextField(params, "קב״ט")}
          />
        </>
      ) : (
        <Autocomplete
          {...commonAutocompleteProps}
          options={options.securityOfficers}
          getOptionLabel={(user) => user?.name || ''}
          value={options.securityOfficers.find(user => user.id === filters.securityOfficer) || null}
          onChange={(_, newValue) => onFilterChange('securityOfficer', newValue?.id || '')}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderInput={(params) => renderTextField(params, "קב״ט")}
        />
      )}

      <Autocomplete
        {...commonAutocompleteProps}
        options={options.sites}
        getOptionLabel={(option) => option.name || ''}
        value={options.sites.find(site => site.id === filters.site) || null}
        onChange={(_, newValue) => onFilterChange('site', newValue?.id || '')}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        renderInput={(params) => renderTextField(params, "אתר")}
      />

      <DateRangeSelector
        startDate={filters.startDate}
        endDate={filters.endDate}
        onStartDateChange={(date) => onFilterChange('startDate', date)}
        onEndDateChange={(date) => onFilterChange('endDate', date)}
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
  variant: PropTypes.oneOf(['faults', 'inspections', 'drills', 'dashboard'])
};

export default FilterBar;
