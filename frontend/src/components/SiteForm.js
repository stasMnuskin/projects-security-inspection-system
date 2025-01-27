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
  Typography,
  useTheme,
  useMediaQuery,
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { getEntrepreneurs, getUsers, getOrganizations } from '../services/api';
import { colors } from '../styles/colors';
import { dialogStyles, notificationRecipientsStyles } from '../styles/components';
import NotificationRecipientsDialog from './NotificationRecipientsDialog';

const SITE_TYPES = [
  { value: 'radar', label: 'מכ"מ' },
  { value: 'inductive_fence', label: 'גדר אינדוקטיבית' }
];

function SiteForm({ initialData, onSubmit, onCancel, submitLabel }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [dialogOpen, setDialogOpen] = useState(false);

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
    controlCenterUserId: null,
    notificationRecipientIds: []
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
          .map(org => org.id) || [],
        notificationRecipientIds: initialData.notificationRecipients?.map(user => user.id) || []
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

  const handleNotificationRecipientsChange = (recipientIds) => {
    setSiteDetails(prev => ({
      ...prev,
      notificationRecipientIds: recipientIds
    }));
  };

  const handleSubmit = () => {
    onSubmit({
      ...siteDetails,
      customFields
    });
  };

  const commonTextFieldStyles = {
    ...dialogStyles.dialogContent['& .MuiFormControl-root'],
    '& .MuiOutlinedInput-root': {
      ...dialogStyles.dialogContent['& .MuiInputBase-root'],
      fontSize: { xs: '0.9rem', sm: '1rem' }
    },
    '& .MuiInputLabel-root': {
      ...dialogStyles.dialogContent['& .MuiInputLabel-root'],
      fontSize: { xs: '0.9rem', sm: '1rem' }
    }
  };

  return (
    <Box sx={{ 
      p: { xs: 1.5, sm: 2 },
      maxWidth: '100%',
      overflow: 'hidden'
    }}>
      <Typography variant="h6" sx={{ 
        color: colors.text.white, 
        mb: 2,
        fontSize: { xs: '1.1rem', sm: '1.25rem' }
      }}>
        {initialData ? 'עריכת אתר' : 'הוספת אתר'}
      </Typography>
      
      <Grid container spacing={{ xs: 1.5, sm: 2 }}>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <TextField
              required
              label="שם האתר"
              value={siteDetails.name}
              onChange={(e) => setSiteDetails(prev => ({ ...prev, name: e.target.value }))}
              sx={commonTextFieldStyles}
            />
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth>
            <Autocomplete
              value={entrepreneurs.find(e => e.id === siteDetails.entrepreneurId) || null}
              options={entrepreneurs}
              getOptionLabel={(option) => option.organization?.name || option.name || ''}
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
                  sx={commonTextFieldStyles}
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
                  sx={commonTextFieldStyles}
                />
              )}
            />
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth>
            <Autocomplete
              multiple
              options={integratorOrgs}
              getOptionLabel={(option) => option.name}
              value={integratorOrgs.filter(org => siteDetails.integratorOrganizationIds.includes(org.id))}
              disableCloseOnSelect
              onChange={(event, newValue) => {
                setSiteDetails(prev => ({
                  ...prev,
                  integratorOrganizationIds: newValue.map(v => v.id)
                }));
              }}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  const { key, ...chipProps } = getTagProps({ index });
                  return (
                    <Chip
                      key={key}
                      label={option.name}
                      {...chipProps}
                      sx={{
                        backgroundColor: colors.background.darkGrey,
                        color: colors.text.white,
                        fontSize: { xs: '0.8rem', sm: '0.9rem' }
                      }}
                    />
                  );
                })
              }
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="חברות אינטגרציה"
                  sx={commonTextFieldStyles}
                />
              )}
            />
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth>
            <Autocomplete
              multiple
              options={maintenanceOrgs}
              getOptionLabel={(option) => option.name}
              value={siteDetails.maintenanceOrganizationIds.length > 0 
                ? maintenanceOrgs.filter(org => siteDetails.maintenanceOrganizationIds.includes(org.id))
                : []}
              onChange={(event, newValue) => {
                setSiteDetails(prev => ({
                  ...prev,
                  maintenanceOrganizationIds: newValue.map(v => v.id)
                }));
              }}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  const { key, ...chipProps } = getTagProps({ index });
                  return (
                    <Chip
                      key={key}
                      label={option.name}
                      {...chipProps}
                      sx={{
                        backgroundColor: colors.background.darkGrey,
                        color: colors.text.white,
                        fontSize: { xs: '0.8rem', sm: '0.9rem' }
                      }}
                    />
                  );
                })
              }
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="חברות אחזקה"
                  sx={commonTextFieldStyles}
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
                  sx={commonTextFieldStyles}
                />
              )}
            />
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Button
            variant="outlined"
            onClick={() => setDialogOpen(true)}
            startIcon={<NotificationsIcon />}
            sx={notificationRecipientsStyles.button}
            fullWidth
          >
            דיווח
          </Button>
          <NotificationRecipientsDialog
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            selectedRecipients={siteDetails.notificationRecipientIds}
            onChange={handleNotificationRecipientsChange}
          />
        </Grid>

        {customFields.length > 0 && (
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ 
              color: colors.text.white, 
              mb: 1,
              fontSize: { xs: '0.9rem', sm: '1rem' }
            }}>
              שדות נוספים
            </Typography>
          </Grid>
        )}
        
        {customFields.map((field, index) => (
          <Grid item xs={12} key={index}>
            <Grid container spacing={{ xs: 1, sm: 2 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="שדה"
                  value={field.name}
                  onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                  sx={commonTextFieldStyles}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="ערך"
                  value={field.value}
                  onChange={(e) => handleFieldChange(index, 'value', e.target.value)}
                  sx={commonTextFieldStyles}
                />
              </Grid>
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

        <Grid item xs={12}>
          <Box sx={{ 
            display: 'flex', 
            gap: { xs: 1, sm: 2 },
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'flex-end'
          }}>
            <Button
              variant="outlined"
              onClick={onCancel}
              fullWidth={isMobile}
              sx={{
                ...dialogStyles.cancelButton,
                fontSize: { xs: '0.9rem', sm: '1rem' },
                order: { xs: 2, sm: 1 }
              }}
            >
              ביטול
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              fullWidth={isMobile}
              sx={{
                ...dialogStyles.submitButton,
                fontSize: { xs: '0.9rem', sm: '1rem' },
                order: { xs: 1, sm: 2 }
              }}
            >
              {submitLabel}
            </Button>
          </Box>
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
    notificationRecipients: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.number,
      name: PropTypes.string,
      email: PropTypes.string
    })),
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
