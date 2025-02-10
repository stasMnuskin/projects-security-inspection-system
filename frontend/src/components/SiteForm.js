import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Grid, Typography, useTheme, useMediaQuery } from '@mui/material';
// import AddIcon from '@mui/icons-material/Add';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Select from 'react-select';
import { getEntrepreneurs, getOrganizations } from '../services/api';
import { colors } from '../styles/colors';
import { dialogStyles, notificationRecipientsStyles, selectStyles } from '../styles/components';
import FormField from './common/FormField';
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
  const [controlCenterOrgs, setControlCenterOrgs] = useState([]);

  const [siteDetails, setSiteDetails] = useState({
    name: '',
    type: 'inductive_fence',
    entrepreneurId: '',
    integratorOrganizationIds: [],
    maintenanceOrganizationIds: [],
    controlCenterOrganizationIds: [],
    notificationRecipientIds: []
  });

  const [customFields, setCustomFields] = useState([]);

  const fetchUsers = useCallback(async () => {
    try {
      const entrepreneursData = await getEntrepreneurs();
      setEntrepreneurs(entrepreneursData);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, []);

  const fetchOrganizations = useCallback(async () => {
    try {
      const [integratorOrganizations, maintenanceOrganizations, controlCenterOrganizations] = await Promise.all([
        getOrganizations('integrator'),
        getOrganizations('maintenance'),
        getOrganizations('control_center')
      ]);
      setIntegratorOrgs(integratorOrganizations);
      setMaintenanceOrgs(maintenanceOrganizations);
      setControlCenterOrgs(controlCenterOrganizations);
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
        integratorOrganizationIds: initialData.serviceOrganizations
          ?.filter(org => org.type === 'integrator')
          .map(org => org.id) || [],
        maintenanceOrganizationIds: initialData.serviceOrganizations
          ?.filter(org => org.type === 'maintenance')
          .map(org => org.id) || [],
        controlCenterOrganizationIds: initialData.serviceOrganizations
          ?.filter(org => org.type === 'control_center')
          .map(org => org.id) || [],
        notificationRecipientIds: initialData.notificationRecipients?.map(user => user.id) || []
      });
      setCustomFields(initialData.customFields || []);
    }
  }, [initialData]);

  // const handleAddField = () => {
  //   setCustomFields([...customFields, { name: '', value: '' }]);
  // };

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
    const errors = {};
    if (!siteDetails.name) errors.name = 'שדה שם האתר לא יכול להיות ריק';
    if (!siteDetails.entrepreneurId) errors.entrepreneurId = 'שדה יזם לא יכול להיות ריק';
    if (!siteDetails.type) errors.type = 'שדה סוג האתר לא יכול להיות ריק';

    if (Object.keys(errors).length > 0) {
      onSubmit({ hasErrors: true, errors });
      return;
    }

    onSubmit({
      ...siteDetails,
      customFields
    });
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
          <FormField label="שם האתר" required>
            <Select
              inputValue={siteDetails.name}
              value={siteDetails.name ? { value: siteDetails.name, label: siteDetails.name } : null}
              onInputChange={(inputValue, { action }) => {
                if (action === 'input-change') {
                  setSiteDetails(prev => ({ ...prev, name: inputValue }));
                }
              }}
              onChange={(newValue) => setSiteDetails(prev => ({ ...prev, name: newValue?.value || '' }))}
              options={[]}
              styles={selectStyles}
              placeholder=""
              isClearable
              components={{
                DropdownIndicator: () => null,
                IndicatorSeparator: () => null,
                Menu: () => null
              }}
            />
          </FormField>
        </Grid>

        <Grid item xs={12}>
          <FormField label="יזם" required>
            <Select
              value={entrepreneurs.find(e => e.id === siteDetails.entrepreneurId) ? {
                value: siteDetails.entrepreneurId,
                label: entrepreneurs.find(e => e.id === siteDetails.entrepreneurId)?.organization?.name || 
                       entrepreneurs.find(e => e.id === siteDetails.entrepreneurId)?.name || ''
              } : null}
              onChange={(newValue) => setSiteDetails(prev => ({
                ...prev,
                entrepreneurId: newValue?.value || ''
              }))}
              options={entrepreneurs.map(e => ({
                value: e.id,
                label: e.organization?.name || e.name || ''
              }))}
              styles={selectStyles}
              placeholder=""
              isClearable
            />
          </FormField>
        </Grid>

        <Grid item xs={12}>
          <FormField label="סוג האתר" required>
            <Select
              value={SITE_TYPES.find(type => type.value === siteDetails.type)}
              onChange={(newValue) => setSiteDetails(prev => ({
                ...prev,
                type: newValue?.value || 'inductive_fence'
              }))}
              options={SITE_TYPES}
              styles={selectStyles}
              placeholder=""
              isClearable={false}
            />
          </FormField>
        </Grid>

        <Grid item xs={12}>
          <FormField label="חברות אינטגרציה">
            <Select
              isMulti
              value={integratorOrgs
                .filter(org => siteDetails.integratorOrganizationIds.includes(org.id))
                .map(org => ({ value: org.id, label: org.name }))}
              onChange={(newValue) => setSiteDetails(prev => ({
                ...prev,
                integratorOrganizationIds: newValue.map(v => v.value)
              }))}
              options={integratorOrgs.map(org => ({ value: org.id, label: org.name }))}
              styles={selectStyles}
              placeholder=""
            />
          </FormField>
        </Grid>

        <Grid item xs={12}>
          <FormField label="חברות אחזקה">
            <Select
              isMulti
              value={maintenanceOrgs
                .filter(org => siteDetails.maintenanceOrganizationIds.includes(org.id))
                .map(org => ({ value: org.id, label: org.name }))}
              onChange={(newValue) => setSiteDetails(prev => ({
                ...prev,
                maintenanceOrganizationIds: newValue.map(v => v.value)
              }))}
              options={maintenanceOrgs.map(org => ({ value: org.id, label: org.name }))}
              styles={selectStyles}
              placeholder=""
            />
          </FormField>
        </Grid>

        <Grid item xs={12}>
          <FormField label="מוקד">
            <Select
              isMulti
              value={controlCenterOrgs
                .filter(org => siteDetails.controlCenterOrganizationIds.includes(org.id))
                .map(org => ({ value: org.id, label: org.name }))}
              onChange={(newValue) => setSiteDetails(prev => ({
                ...prev,
                controlCenterOrganizationIds: newValue.map(v => v.value)
              }))}
              options={controlCenterOrgs.map(org => ({ value: org.id, label: org.name }))}
              styles={selectStyles}
              placeholder=""
            />
          </FormField>
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
                <FormField label="שדה">
                  <Select
                    value={field.name ? { value: field.name, label: field.name } : null}
                    onChange={(newValue) => handleFieldChange(index, 'name', newValue?.value || '')}
                    options={[]}
                    styles={selectStyles}
                    placeholder=""
                    isClearable
                  />
                </FormField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormField label="ערך">
                  <Select
                    value={field.value ? { value: field.value, label: field.value } : null}
                    onChange={(newValue) => handleFieldChange(index, 'value', newValue?.value || '')}
                    options={[]}
                    styles={selectStyles}
                    placeholder=""
                    isClearable
                  />
                </FormField>
              </Grid>
            </Grid>
          </Grid>
        ))}

        {/* <Grid item xs={12}>
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
        </Grid> */}

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
