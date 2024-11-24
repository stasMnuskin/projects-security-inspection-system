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
  Chip,
  Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { getEntrepreneurs, getUsers, getOrganizations } from '../services/api';
import { colors } from '../styles/colors';
import { dialogStyles } from '../styles/components';

const SITE_TYPES = [
  { value: 'radar', label: 'מכ"מ' },
  { value: 'inductive_fence', label: 'גדר אינדוקטיבית' }
];

function SiteForm({ initialData, onSubmit, onCancel, submitLabel }) {
  const [entrepreneurs, setEntrepreneurs] = useState([]);
  const [integratorOrgs, setIntegratorOrgs] = useState([]);
  const [maintenanceOrgs, setMaintenanceOrgs] = useState([]);
  const [controlCenterStaff, setControlCenterStaff] = useState([]);

  const [siteDetails, setSiteDetails] = useState({
    name: '',
    type: 'inductive_fence',
    entrepreneurId: '',
    integratorOrganizationIds: [],
    maintenanceOrganizationIds: [],
    controlCenterUserId: null
  });

  const [customFields, setCustomFields] = useState([]);

  const fetchUsers = useCallback(async () => {
    try {
      const entrepreneursData = await getEntrepreneurs();
      setEntrepreneurs(entrepreneursData);

      const users = await getUsers();
      setControlCenterStaff(users.filter(user => user.role === 'control_center'));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, []);

  const fetchOrganizations = useCallback(async () => {
    try {
      const [integratorOrganizations, maintenanceOrganizations] = await Promise.all([
        getOrganizations('integrator'),
        getOrganizations('maintenance')
      ]);
      setIntegratorOrgs(integratorOrganizations);
      setMaintenanceOrgs(maintenanceOrganizations);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchOrganizations();
  }, [fetchUsers, fetchOrganizations]);

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      setSiteDetails({
        name: initialData.name || '',
        type: initialData.type || 'inductive_fence',
        entrepreneurId: initialData.entrepreneurId || '',
        controlCenterUserId: initialData.controlCenterUserId || null,
        integratorOrganizationIds: initialData.serviceOrganizations
          ?.filter(org => org.type === 'integrator')
          .map(org => org.id) || [],
        maintenanceOrganizationIds: initialData.serviceOrganizations
          ?.filter(org => org.type === 'maintenance')
          .map(org => org.id) || []
      });
      setCustomFields(initialData.customFields || []);
    }
  }, [initialData]);

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
      <Typography variant="h6" sx={{ color: colors.text.white, mb: 2 }}>
        {initialData ? 'עריכת אתר' : 'הוספת אתר'}
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <TextField
              required
              label="שם האתר"
              value={siteDetails.name}
              onChange={(e) => setSiteDetails(prev => ({ ...prev, name: e.target.value }))}
              sx={{
                ...dialogStyles.dialogContent['& .MuiFormControl-root'],
                '& .MuiOutlinedInput-root': dialogStyles.dialogContent['& .MuiInputBase-root'],
                '& .MuiInputLabel-root': dialogStyles.dialogContent['& .MuiInputLabel-root']
              }}
            />
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth>
            <Autocomplete
              value={entrepreneurs.find(e => e.id === siteDetails.entrepreneurId) || null}
              options={entrepreneurs}
              getOptionLabel={(option) => option.name}
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
                    ...dialogStyles.dialogContent['& .MuiFormControl-root'],
                    '& .MuiOutlinedInput-root': dialogStyles.dialogContent['& .MuiInputBase-root'],
                    '& .MuiInputLabel-root': dialogStyles.dialogContent['& .MuiInputLabel-root']
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
                    ...dialogStyles.dialogContent['& .MuiFormControl-root'],
                    '& .MuiOutlinedInput-root': dialogStyles.dialogContent['& .MuiInputBase-root'],
                    '& .MuiInputLabel-root': dialogStyles.dialogContent['& .MuiInputLabel-root']
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
              value={integratorOrgs.filter(org => siteDetails.integratorOrganizationIds.includes(org.id))}
              options={integratorOrgs}
              getOptionLabel={(option) => option.name}
              onChange={(event, newValue) => {
                setSiteDetails(prev => ({
                  ...prev,
                  integratorOrganizationIds: newValue.map(v => v.id)
                }));
              }}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option.name}
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
                  label="חברות אינטגרציה"
                  sx={{
                    ...dialogStyles.dialogContent['& .MuiFormControl-root'],
                    '& .MuiOutlinedInput-root': dialogStyles.dialogContent['& .MuiInputBase-root'],
                    '& .MuiInputLabel-root': dialogStyles.dialogContent['& .MuiInputLabel-root']
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
              value={maintenanceOrgs.filter(org => siteDetails.maintenanceOrganizationIds.includes(org.id))}
              options={maintenanceOrgs}
              getOptionLabel={(option) => option.name}
              onChange={(event, newValue) => {
                setSiteDetails(prev => ({
                  ...prev,
                  maintenanceOrganizationIds: newValue.map(v => v.id)
                }));
              }}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option.name}
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
                  label="חברות אחזקה"
                  sx={{
                    ...dialogStyles.dialogContent['& .MuiFormControl-root'],
                    '& .MuiOutlinedInput-root': dialogStyles.dialogContent['& .MuiInputBase-root'],
                    '& .MuiInputLabel-root': dialogStyles.dialogContent['& .MuiInputLabel-root']
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
              getOptionLabel={(option) => option.name}
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
                    ...dialogStyles.dialogContent['& .MuiFormControl-root'],
                    '& .MuiOutlinedInput-root': dialogStyles.dialogContent['& .MuiInputBase-root'],
                    '& .MuiInputLabel-root': dialogStyles.dialogContent['& .MuiInputLabel-root']
                  }}
                />
              )}
            />
          </FormControl>
        </Grid>

        {/* Custom Fields */}
        {customFields.length > 0 && (
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ color: colors.text.white, mb: 1 }}>
              שדות נוספים
            </Typography>
          </Grid>
        )}
        
        {customFields.map((field, index) => (
          <Grid item xs={12} key={index} container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="שדה"
                value={field.name}
                onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                sx={{
                  ...dialogStyles.dialogContent['& .MuiFormControl-root'],
                  '& .MuiOutlinedInput-root': dialogStyles.dialogContent['& .MuiInputBase-root'],
                  '& .MuiInputLabel-root': dialogStyles.dialogContent['& .MuiInputLabel-root']
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
                  ...dialogStyles.dialogContent['& .MuiFormControl-root'],
                  '& .MuiOutlinedInput-root': dialogStyles.dialogContent['& .MuiInputBase-root'],
                  '& .MuiInputLabel-root': dialogStyles.dialogContent['& .MuiInputLabel-root']
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
              sx={dialogStyles.submitButton}
            >
              {submitLabel}
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              onClick={onCancel}
              sx={dialogStyles.cancelButton}
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
    serviceOrganizations: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.number,
      name: PropTypes.string,
      type: PropTypes.string
    })),
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
