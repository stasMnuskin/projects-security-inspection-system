import React, { useEffect, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Autocomplete, TextField, Chip } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { filterStyles, selectStyles } from '../styles/components';
import { colors } from '../styles/colors';
import { useAuth } from '../context/AuthContext';
import DateRangeSelector from './DateRangeSelector';
import FormField from './common/FormField';
import { 
  getSites, 
  getSecurityOfficers, 
  getOrganizations,
  getEntrepreneurs,
  getInspectionTypes,
  getSitesByEntrepreneur
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
    entrepreneurs: [],
    drillTypes: []
  });

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    const loadOptions = async () => {
      try {
        let sitesData = [], maintenanceOrgs = [], integratorOrgs = [], securityOfficersData = [];
        
        try {
        sitesData = await getSites();
        setOptions(prev => ({
          ...prev,
          sites: sitesData || []
        }));
        } catch (error) {
          console.error('Error loading sites:', error);
          sitesData = [];
        }

        try {
          if (['entrepreneur', 'security_officer', 'admin'].includes(user.role)) {
            securityOfficersData = await getSecurityOfficers();
          }
        } catch (error) {
          console.error('Error loading security officers:', error);
          securityOfficersData = [];
        }

        try {
          if (user.role === 'admin') {
            const entrepreneurs = await getEntrepreneurs();
            setOptions(prev => ({
              ...prev,
              entrepreneurs: entrepreneurs || []
            }));
          }

          if (user.role === 'entrepreneur') {
            const organizations = sitesData.reduce((orgs, site) => {
              if (site.serviceOrganizations && Array.isArray(site.serviceOrganizations)) {
                site.serviceOrganizations.forEach(org => {
                  if (org && org.type === 'maintenance') {
                    orgs.maintenance.set(org.id, org);
                  } else if (org && org.type === 'integrator') {
                    orgs.integrator.set(org.id, org);
                  }
                });
              }
              return orgs;
            }, { maintenance: new Map(), integrator: new Map() });
            
            maintenanceOrgs = Array.from(organizations.maintenance.values());
            integratorOrgs = Array.from(organizations.integrator.values());
          } else if (['control_center', 'maintenance', 'integrator'].includes(user.role)) {
            maintenanceOrgs = [];
            integratorOrgs = [];
          } else if (user.role === 'security_officer' || user.role === 'admin') {
            const [maintenance, integrators] = await Promise.all([
              getOrganizations('maintenance'),
              getOrganizations('integrator')
            ]);
            maintenanceOrgs = maintenance;
            integratorOrgs = integrators;
          }
        } catch (error) {
          console.error('Error loading organizations:', error);
          maintenanceOrgs = [];
          integratorOrgs = [];
        }

        setOptions(prev => ({
          ...prev,
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
  }, [user, variant, authLoading, onFilterChange]);

  useEffect(() => {
    const updateOrganizationFilters = async () => {
      try {
        if (user?.role === 'maintenance' && user?.organizationId && !filters.maintenance) {
          onFilterChange('maintenance', user.organizationId);
        } else if (user?.role === 'integrator' && user?.organizationId && !filters.integrator) {
          onFilterChange('integrator', user.organizationId);
        }
      } catch (error) {
        console.error('Error updating organization filters:', error);
      }
    };

    updateOrganizationFilters();
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
      error={false}
      sx={{
        width: '100%',
        '& .MuiOutlinedInput-root': {
          ...selectStyles.control,
          padding: '2px 8px',
          '& input': {
            color: colors.text.white
          }
        }
      }}
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

      <Box>
        <DateRangeSelector
          startDate={filters.startDate}
          endDate={filters.endDate}
          onStartDateChange={(date) => onFilterChange('startDate', date)}
          onEndDateChange={(date) => onFilterChange('endDate', date)}
        />
      </Box>

      <Box>
        <FormField label="אתר">
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
            renderInput={params => renderTextField(params)}
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
        </FormField>
      </Box>

      <Box>
        <FormField label="קב״ט">
          <Autocomplete
            {...commonAutocompleteProps}
            options={options.securityOfficers}
            getOptionLabel={(user) => user?.name || ''}
            value={options.securityOfficers.find(user => user.id === filters.securityOfficer) || null}
            onChange={(_, newValue) => onFilterChange('securityOfficer', newValue?.id || '')}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={params => renderTextField(params)}
          />
        </FormField>
      </Box>

      {variant === 'faults' && (
        <Box>
          <FormField label="סוג תקלה">
            <Autocomplete
              {...commonAutocompleteProps}
              options={FAULT_CRITICALITY}
              getOptionLabel={(option) => option.label}
              value={FAULT_CRITICALITY.find(opt => opt.value === filters.isCritical) || null}
              onChange={(_, newValue) => onFilterChange('isCritical', newValue?.value)}
              renderInput={params => renderTextField(params)}
            />
          </FormField>
        </Box>
      )}

      {variant === 'drills' && (
        <Box>
          <FormField label="סוג תרגיל">
            <Autocomplete
              {...commonAutocompleteProps}
              options={options.drillTypes}
              value={filters.drillType || null}
              onChange={(_, newValue) => onFilterChange('drillType', newValue)}
              renderInput={params => renderTextField(params)}
            />
          </FormField>
        </Box>
      )}

      {variant !== 'drills' && (
        <>
          <Box>
            <FormField label="אחזקה">
              <Autocomplete
                {...commonAutocompleteProps}
                options={options.maintenance}
                getOptionLabel={formatOrganizationName}
                value={options.maintenance.find(org => org.id === (user?.role === 'maintenance' ? user?.organizationId : filters.maintenance)) || null}
                onChange={(_, newValue) => onFilterChange('maintenance', newValue?.id || '')}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                disabled={user?.role === 'maintenance'}
                renderInput={params => renderTextField(params)}
              />
            </FormField>
          </Box>

          <Box>
            <FormField label="אינטגרטור">
              <Autocomplete
                {...commonAutocompleteProps}
                options={options.integrators}
                getOptionLabel={formatOrganizationName}
                value={options.integrators.find(org => org.id === (user?.role === 'integrator' ? user?.organizationId : filters.integrator)) || null}
                onChange={(_, newValue) => onFilterChange('integrator', newValue?.id || '')}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                disabled={user?.role === 'integrator'}
                renderInput={params => renderTextField(params)}
              />
            </FormField>
          </Box>
        </>
      )}

      {user?.role === 'admin' && (
        <Box>
          <FormField label="יזם">
            <Autocomplete
              {...commonAutocompleteProps}
              options={options.entrepreneurs}
              getOptionLabel={(user) => user?.organization?.name || ''}
              value={options.entrepreneurs.find(user => user.id === filters.entrepreneur) || null}
              onChange={async (_, newValue) => {
                const sites = newValue?.id 
                  ? await getSitesByEntrepreneur(newValue.id)
                  : await getSites();
                
                setOptions(prev => ({ ...prev, sites: sites || [] }));
                
                onFilterChange('entrepreneur', newValue?.id || '');
                onFilterChange('sites', sites.map(site => site.id));
              }}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={params => renderTextField(params)}
              sx={filterStyles.entrepreneurFilter}
            />
          </FormField>
        </Box>
      )}
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
    drillType: PropTypes.string
  }).isRequired,
  onFilterChange: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(['faults', 'inspections', 'drills', 'dashboard']),
  userRole: PropTypes.string,
  disableAutoFetch: PropTypes.bool
};

export default FilterBar;
