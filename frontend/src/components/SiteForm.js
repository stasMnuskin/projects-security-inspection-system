import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  TextField,
  FormControl,
  Button,
  Grid,
  Autocomplete,
  IconButton,
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { getUsers } from '../services/api';
import { colors } from '../styles/colors';

const SITE_TYPES = [
  { value: 'radar', label: 'מכ"מ' },
  { value: 'inductive_fence', label: 'גדר אינדוקטיבית' }
];

function SiteForm({ initialData, onSubmit, onCancel, submitLabel }) {
  const [entrepreneurs, setEntrepreneurs] = useState([]);
  const [integrators, setIntegrators] = useState([]);
  const [maintenanceStaff, setMaintenanceStaff] = useState([]);
  const [controlCenterStaff, setControlCenterStaff] = useState([]);

  // Convert single IDs to arrays if needed
  const getInitialIntegratorIds = () => {
    if (initialData?.integratorUserIds) return initialData.integratorUserIds;
    if (initialData?.integratorUserId) return [initialData.integratorUserId];
    return [];
  };

  const getInitialMaintenanceIds = () => {
    if (initialData?.maintenanceUserIds) return initialData.maintenanceUserIds;
    if (initialData?.maintenanceUserId) return [initialData.maintenanceUserId];
    return [];
  };

  const [siteDetails, setSiteDetails] = useState({
    name: '',
    type: 'inductive_fence',
    entrepreneurId: '',
    integratorUserIds: getInitialIntegratorIds(),
    maintenanceUserIds: getInitialMaintenanceIds(),
    controlCenterUserId: null,
    ...initialData
  });

  const [customFields, setCustomFields] = useState(initialData?.customFields || []);

  const fetchUsers = useCallback(async () => {
    try {
      const users = await getUsers();
      setEntrepreneurs(users.filter(user => user.role === 'entrepreneur'));
      setIntegrators(users.filter(user => user.role === 'integrator'));
      setMaintenanceStaff(users.filter(user => user.role === 'maintenance'));
      setControlCenterStaff(users.filter(user => user.role === 'control_center'));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAddField = () => {
    setCustomFields([...customFields, { name: '', value: '' }]);
  };

  const handleFieldChange = (index, field, value) => {
    const newFields = [...customFields];
    newFields[index][field] = value;
    setCustomFields(newFields);
  };

  const handleSubmit = () => {
    onSubmit({
      ...siteDetails,
      customFields
    });
  };

  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <TextField
              required
              label="שם האתר"
              value={siteDetails.name}
              onChange={(e) => setSiteDetails(prev => ({ ...prev, name: e.target.value }))}
              sx={{
                backgroundColor: colors.background.darkGrey,
                '& .MuiOutlinedInput-root': {
                  color: colors.text.white
                },
                '& .MuiInputLabel-root': {
                  color: colors.text.grey
                }
              }}
            />
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth>
            <Autocomplete
              value={entrepreneurs.find(e => e.id === siteDetails.entrepreneurId) || null}
              options={entrepreneurs}
              getOptionLabel={(option) => 
                `${option.firstName} ${option.lastName}`
              }
              onChange={(event, newValue) => {
                setSiteDetails(prev => ({
                  ...prev,
                  entrepreneurId: newValue?.id || ''
                }));
              }}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="יזם"
                  required
                  sx={{
                    backgroundColor: colors.background.darkGrey,
                    '& .MuiOutlinedInput-root': {
                      color: colors.text.white
                    },
                    '& .MuiInputLabel-root': {
                      color: colors.text.grey
                    }
                  }}
                />
              )}
            />
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth>
            <Autocomplete
              value={SITE_TYPES.find(type => type.value === siteDetails.type)}
              options={SITE_TYPES}
              getOptionLabel={(option) => option.label}
              onChange={(event, newValue) => {
                setSiteDetails(prev => ({
                  ...prev,
                  type: newValue?.value || 'inductive_fence'
                }));
              }}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="סוג האתר"
                  required
                  sx={{
                    backgroundColor: colors.background.darkGrey,
                    '& .MuiOutlinedInput-root': {
                      color: colors.text.white
                    },
                    '& .MuiInputLabel-root': {
                      color: colors.text.grey
                    }
                  }}
                />
              )}
            />
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth>
            <Autocomplete
              multiple
              value={integrators.filter(i => siteDetails.integratorUserIds.includes(i.id))}
              options={integrators}
              getOptionLabel={(option) => 
                `${option.firstName} ${option.lastName}`
              }
              onChange={(event, newValue) => {
                setSiteDetails(prev => ({
                  ...prev,
                  integratorUserIds: newValue.map(v => v.id)
                }));
              }}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={`${option.firstName} ${option.lastName}`}
                    {...getTagProps({ index })}
                    sx={{
                      backgroundColor: colors.background.darkGrey,
                      color: colors.text.white
                    }}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="אינטגרטור"
                  sx={{
                    backgroundColor: colors.background.darkGrey,
                    '& .MuiOutlinedInput-root': {
                      color: colors.text.white
                    },
                    '& .MuiInputLabel-root': {
                      color: colors.text.grey
                    }
                  }}
                />
              )}
            />
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth>
            <Autocomplete
              multiple
              value={maintenanceStaff.filter(m => siteDetails.maintenanceUserIds.includes(m.id))}
              options={maintenanceStaff}
              getOptionLabel={(option) => 
                `${option.firstName} ${option.lastName}`
              }
              onChange={(event, newValue) => {
                setSiteDetails(prev => ({
                  ...prev,
                  maintenanceUserIds: newValue.map(v => v.id)
                }));
              }}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={`${option.firstName} ${option.lastName}`}
                    {...getTagProps({ index })}
                    sx={{
                      backgroundColor: colors.background.darkGrey,
                      color: colors.text.white
                    }}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="אחזקה"
                  sx={{
                    backgroundColor: colors.background.darkGrey,
                    '& .MuiOutlinedInput-root': {
                      color: colors.text.white
                    },
                    '& .MuiInputLabel-root': {
                      color: colors.text.grey
                    }
                  }}
                />
              )}
            />
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth>
            <Autocomplete
              value={controlCenterStaff.find(c => c.id === siteDetails.controlCenterUserId) || null}
              options={controlCenterStaff}
              getOptionLabel={(option) => 
                `${option.firstName} ${option.lastName}`
              }
              onChange={(event, newValue) => {
                setSiteDetails(prev => ({
                  ...prev,
                  controlCenterUserId: newValue?.id || null
                }));
              }}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="מוקד"
                  sx={{
                    backgroundColor: colors.background.darkGrey,
                    '& .MuiOutlinedInput-root': {
                      color: colors.text.white
                    },
                    '& .MuiInputLabel-root': {
                      color: colors.text.grey
                    }
                  }}
                />
              )}
            />
          </FormControl>
        </Grid>

        {/* Custom Fields */}
        {customFields.map((field, index) => (
          <Grid item xs={12} key={index} container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="שדה"
                value={field.name}
                onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                sx={{
                  backgroundColor: colors.background.darkGrey,
                  '& .MuiOutlinedInput-root': {
                    color: colors.text.white
                  },
                  '& .MuiInputLabel-root': {
                    color: colors.text.grey
                  }
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="ערך"
                value={field.value}
                onChange={(e) => handleFieldChange(index, 'value', e.target.value)}
                sx={{
                  backgroundColor: colors.background.darkGrey,
                  '& .MuiOutlinedInput-root': {
                    color: colors.text.white
                  },
                  '& .MuiInputLabel-root': {
                    color: colors.text.grey
                  }
                }}
              />
            </Grid>
          </Grid>
        ))}

        <Grid item xs={12}>
          <IconButton 
            onClick={handleAddField} 
            sx={{ 
              color: colors.text.orange,
              '&:hover': {
                backgroundColor: colors.background.darkGrey
              }
            }}
          >
            <AddIcon />
          </IconButton>
        </Grid>

        <Grid item xs={12} container spacing={2} justifyContent="flex-end">
          <Grid item>
            <Button
              variant="contained"
              onClick={handleSubmit}
              sx={{
                backgroundColor: colors.background.orange,
                '&:hover': {
                  backgroundColor: colors.background.darkOrange
                }
              }}
            >
              {submitLabel}
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              onClick={onCancel}
              sx={{
                color: colors.text.white,
                borderColor: colors.text.white,
                '&:hover': {
                  borderColor: colors.text.grey
                }
              }}
            >
              ביטול
            </Button>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}

SiteForm.propTypes = {
  initialData: PropTypes.shape({
    name: PropTypes.string,
    type: PropTypes.string,
    entrepreneurId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    integratorUserId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    integratorUserIds: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    maintenanceUserId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    maintenanceUserIds: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    controlCenterUserId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    customFields: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string,
      value: PropTypes.string
    }))
  }),
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  submitLabel: PropTypes.string.isRequired
};

export default SiteForm;
