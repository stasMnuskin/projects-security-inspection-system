import React, { useEffect, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Autocomplete, TextField, Chip } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { filterStyles } from '../styles/components';
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
  variant = 'faults',
  userRole,
  disableAutoFetch = false
}) => {
  const { user, loading: authLoading } = useAuth();
  const [options, setOptions] = useState({
    sites: [],
    securityOfficers: [],
    maintenance: [],
    integrators: [],
    drillTypes: []
  });

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    const loadOptions = async () => {
      try {
        let sitesData = [], maintenanceOrgs = [], integratorOrgs = [], securityOfficersData = [];
        
        if (user.role === 'entrepreneur') {
          try {
            const entrepreneurSites = await getSitesByEntrepreneur(user.id);
            if (Array.isArray(entrepreneurSites)) {
              sitesData = entrepreneurSites;
              
              const siteIds = entrepreneurSites.map(site => site.id);
              if (siteIds.length > 0) {
                try {
                  [maintenanceOrgs, integratorOrgs] = await Promise.all([
                    getOrganizationsBySites(siteIds, 'maintenance'),
                    getOrganizationsBySites(siteIds, 'integrator')
                  ]);
                } catch (error) {
                  console.error('Error loading organizations:', error);
                  maintenanceOrgs = [];
                  integratorOrgs = [];
                }
              }
            } else {
              console.error('Invalid response from getSitesByEntrepreneur');
              sitesData = [];
            }
          } catch (error) {
            console.error('Error loading entrepreneur sites:', error);
            sitesData = [];
          }
        } else {
          try {
            const [sites, maintenance, integrators] = await Promise.all([
              getSites(),
              getOrganizations('maintenance'),
              getOrganizations('integrator')
            ]);
            sitesData = sites;
            maintenanceOrgs = maintenance;
            integratorOrgs = integrators;
          } catch (error) {
            console.error('Error loading sites and organizations:', error);
            sitesData = [];
            maintenanceOrgs = [];
            integratorOrgs = [];
          }
        }

        try {
          securityOfficersData = await getSecurityOfficers();
        } catch (error) {
          console.error('Error loading security officers:', error);
          securityOfficersData = [];
        }

        setOptions(prev => ({
          ...prev,
          sites: sitesData || [],
          securityOfficers: securityOfficersData || [],
          maintenance: maintenanceOrgs || [],
          integrators: integratorOrgs || []
        }));

        if (variant === 'drills') {
          try {
            const inspectionTypesData = await getInspectionTypes();
            if (inspectionTypesData?.data) {
              const drillType = inspectionTypesData.data.find(type => type.type === 'drill');
              if (drillType) {
                const drillTypeField = drillType.formStructure.find(field => field.id === 'drill_type');
                if (drillTypeField?.options) {
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
        console.error('Critical error in loadOptions:', error);
      }
    };

    loadOptions();
  }, [user, variant, authLoading]);

  useEffect(() => {
    if (user?.role === 'maintenance' && user?.organizationId && !filters.maintenance) {
      onFilterChange('maintenance', user.organizationId);
    } else if (user?.role === 'integrator' && user?.organizationId && !filters.integrator) {
      onFilterChange('integrator', user.organizationId);
    }

    if (filters.sites === null && options.sites.length > 0) {
      onFilterChange('sites', options.sites.map(site => site.id));
    }
  }, [user?.role, user?.organizationId, filters.maintenance, filters.integrator, filters.sites, options.sites, onFilterChange]);

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
      sx={filterStyles.filterSelect}
      onKeyDown={preventSubmit}
    />
  );

  return (
    <Box 
      sx={filterStyles.filterBar}
      onKeyDown={preventSubmit}
      role="presentation"
    >
      <Box>
        <FilterListIcon sx={filterStyles.filterIcon} />
      </Box>

      {variant !== 'drills' && (
        <>
          <Box>
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
          </Box>

          <Box>
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
          </Box>
        </>
      )}

      {variant === 'faults' && (
        <Box>
          <Autocomplete
            {...commonAutocompleteProps}
            options={FAULT_CRITICALITY}
            getOptionLabel={(option) => option.label}
            value={FAULT_CRITICALITY.find(opt => opt.value === filters.isCritical) || null}
            onChange={(_, newValue) => onFilterChange('isCritical', newValue?.value)}
            renderInput={(params) => renderTextField(params, "סוג תקלה")}
          />
        </Box>
      )}

      {variant === 'drills' && (
        <Box>
          <Autocomplete
            {...commonAutocompleteProps}
            options={options.drillTypes}
            value={filters.drillType || null}
            onChange={(_, newValue) => onFilterChange('drillType', newValue)}
            renderInput={(params) => renderTextField(params, "סוג תרגיל")}
          />
        </Box>
      )}

      <Box>
        <Autocomplete
          {...commonAutocompleteProps}
          options={options.securityOfficers}
          getOptionLabel={(user) => user?.name || ''}
          value={options.securityOfficers.find(user => user.id === filters.securityOfficer) || null}
          onChange={(_, newValue) => onFilterChange('securityOfficer', newValue?.id || '')}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderInput={(params) => renderTextField(params, "קב״ט")}
        />
      </Box>

      <Box>
        <Autocomplete
          {...commonAutocompleteProps}
          multiple
          options={[{ id: 'all', name: 'כל האתרים' }, ...options.sites]}
          getOptionLabel={(option) => option.name || ''}
          value={filters.sites === null 
            ? []
            : filters.sites?.length === options.sites.length
              ? []
              : options.sites.filter(site => filters.sites?.includes(site.id)) || []
          }
          onChange={(_, newValue) => {
            if (newValue.some(v => v.id === 'all') || filters.sites === null) {
              onFilterChange('sites', options.sites.map(site => site.id));
            } else {
              onFilterChange('sites', newValue.map(site => site.id));
            }
          }}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderInput={(params) => renderTextField(params, "אתר")}
          renderTags={(tagValue, getTagProps) =>
            tagValue.map((option, index) => {
              const { key, ...otherProps } = getTagProps({ index });
              return (
                <Chip
                  key={option.id}
                  label={option.name}
                  {...otherProps}
                />
              );
            })
          }
        />
      </Box>

      <Box>
        <DateRangeSelector
          startDate={filters.startDate}
          endDate={filters.endDate}
          onStartDateChange={(date) => onFilterChange('startDate', date)}
          onEndDateChange={(date) => onFilterChange('endDate', date)}
        />
      </Box>
    </Box>
  );
};

FilterBar.propTypes = {
  filters: PropTypes.shape({
    startDate: PropTypes.instanceOf(Date),
    endDate: PropTypes.instanceOf(Date),
    sites: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    isCritical: PropTypes.bool,
    securityOfficer: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    maintenance: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    integrator: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    drillType: PropTypes.string
  }).isRequired,
  onFilterChange: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(['faults', 'inspections', 'drills', 'dashboard']),
  userRole: PropTypes.string,
  disableAutoFetch: PropTypes.bool
};

export default FilterBar;
