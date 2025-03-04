import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Paper, 
  TextField, 
  Dialog, 
  DialogActions, 
  DialogContent,  
  DialogTitle, 
  Snackbar, 
  Autocomplete,
  MenuItem
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import { 
  getInspectionFormStructure, 
  createInspection, 
  getSites,
  getInspectionTypesBySite,
  getEntrepreneurs
} from '../services/api';
import { AppError } from '../utils/errorHandler';
import { useAuth } from '../context/AuthContext';
import { PERMISSIONS } from '../constants/roles';
import { colors } from '../styles/colors';
import Sidebar from '../components/Sidebar';
import FormField from '../components/common/FormField';
import { selectStyles } from '../styles/components';

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const DRILL_STATUSES = ['הצלחה', 'כישלון', 'הצלחה חלקית'];

const InspectionForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Determine if this is a drill form based on the URL
  const isDrill = location.pathname === '/drills/new';

  // State for form data and validation
  const [formData, setFormData] = useState({
    securityOfficer: user.name,
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [formStructure, setFormStructure] = useState(null);

  // State for selections
  const [selectedEntrepreneur, setSelectedEntrepreneur] = useState(null);
  const [selectedSite, setSelectedSite] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [drillTypes, setDrillTypes] = useState([]);

  // State for data lists
  const [sites, setSites] = useState([]);
  const [entrepreneurs, setEntrepreneurs] = useState([]);
  const [inspectionTypes, setInspectionTypes] = useState([]);

  // State for UI feedback
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // State for dialog
  const [showInitialDialog, setShowInitialDialog] = useState(true);

  // Check permissions
  const canCreate = isDrill 
    ? user.hasPermission(PERMISSIONS.NEW_DRILL) 
    : user.hasPermission(PERMISSIONS.NEW_INSPECTION);

  // Redirect if no permission
  useEffect(() => {
    if (!canCreate) {
      navigate(isDrill ? '/drills' : '/inspections');
    }
  }, [canCreate, navigate, isDrill]);

  // Load initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [sitesResponse, entrepreneursData] = await Promise.all([
          getSites(),
          getEntrepreneurs()
        ]);
        setSites(sitesResponse || []);
        setEntrepreneurs(entrepreneursData || []);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setError(error instanceof AppError ? error.message : 'Failed to fetch initial data');
      }
    };

    fetchInitialData();
  }, []);

  // Load inspection types when site is selected
  useEffect(() => {
    const fetchInspectionTypes = async () => {
      if (!selectedSite) return;

      try {
        const response = await getInspectionTypesBySite(selectedSite.id, isDrill ? 'drill' : 'inspection');
        const types = response.data || [];
        setInspectionTypes(types);

        // If this is a drill form, get drill types
        if (isDrill) {
          const drillType = types.find(type => type.type === 'drill');
          if (drillType) {
            const drillTypeField = drillType.formStructure.find(field => field.id === 'drill_type');
            if (drillTypeField) {
              setDrillTypes(drillTypeField.options || []);
            }
            // Set the drill type as selected type
            setSelectedType(drillType);
          }
        }
      } catch (error) {
        if (error.status === 400 && error.message.includes('Invalid inspection type')) {
          setError('סוג הביקורת לא מתאים לסוג האתר');
          setSelectedType(null);
        } else {
          console.error('Error fetching inspection types:', error);
          setError('Failed to fetch inspection types');
        }
      }
    };

    fetchInspectionTypes();
  }, [selectedSite, isDrill]);

  // Load form structure when type is selected (only for inspections)
  useEffect(() => {
    const fetchFormStructure = async () => {
      if (selectedSite && selectedType && !isDrill) {
        try {
          const response = await getInspectionFormStructure(selectedSite.id, selectedType.id);
          if (response.data?.fields) {
            setFormStructure(response.data.fields);
            // Initialize form data with auto fields
            setFormData(prev => ({
              ...prev,
              securityOfficer: user.name,
              site: selectedSite.name,
              date: new Date().toISOString().split('T')[0],
              time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
            }));
          }
        } catch (error) {
          if (error.status === 400 && error.message.includes('Invalid inspection type')) {
            setError('סוג הביקורת לא מתאים לסוג האתר');
            setSelectedType(null);
            setFormStructure(null);
          } else {
            console.error('Error fetching form structure:', error);
            setError('Failed to fetch form structure');
          }
        }
      }
    };

    fetchFormStructure();
  }, [selectedSite, selectedType, isDrill, user.name]);

  const handleTypeChange = (_, value) => {
    setSelectedType(value);
    setFormStructure(null);
    // Keep existing form data and update auto fields
    setFormData(prev => ({
      ...prev,
      securityOfficer: user.name,
      site: selectedSite.name,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
    }));
  };

  const handleEntrepreneurChange = (_, value) => {
    setSelectedEntrepreneur(value);
    setSelectedSite(null);
    setSelectedType(null);
    setFormStructure(null);
    setFormData({
      securityOfficer: user.name,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
    });
  };

  const handleSiteChange = (_, value) => {
    setSelectedSite(value);
    setSelectedType(null);
    setFormStructure(null);
    
    // Initialize form data with site name
    if (value) {
      setFormData({
        securityOfficer: user.name,
        site: value.name,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
      });
    } else {
      setFormData({
        securityOfficer: user.name,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
      });
    }
    
    // Auto-select entrepreneur if not already selected
    if (value && !selectedEntrepreneur) {
      setSelectedEntrepreneur(value.entrepreneur);
    }
  };

  const handleDrillTypeSelect = (e) => {
    const type = e.target.value;
    setFormData(prev => ({
      ...prev,
      drill_type: type,
      ...(type === 'אחר' ? { status: '', notes: '' } : {}),
      ...(type !== 'אחר' && prev.status !== 'לא תקין' ? { notes: '' } : {})
    }));
  };

  const handleStatusChange = (e) => {
    const status = e.target.value;
    setFormData(prev => ({
      ...prev,
      status,
    }));
  };

  const handleInitialDialogSubmit = async () => {
    const errors = {};

    if (!selectedSite) {
      errors.site = 'יש לבחור אתר';
    }

    // For drills, validate drill type and related fields
    if (isDrill) {
      if (!formData.drill_type) {
        errors.drill_type = 'יש לבחור סוג תרגיל';
      }

      // Only validate status if drill type is not 'אחר'
      if (formData.drill_type !== 'אחר' && !formData.status) {
        errors.status = 'יש לבחור סטטוס';
      }

      // Notes are required if:
      // 1. Drill type is 'אחר' OR
      // 2. Status is 'כישלון' or 'הצלחה חלקית'
      const notesRequired = formData.drill_type === 'אחר' || 
                          formData.status === 'כישלון' || 
                          formData.status === 'הצלחה חלקית';
      if (notesRequired && !formData.notes?.trim()) {
        errors.notes = 'יש להזין הערות';
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // For drills, submit directly
    if (isDrill) {
      try {
        // Update formData with site name before submitting
        const updatedFormData = {
          ...formData,
          site: selectedSite.name,
          securityOfficer: user.name,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
  };

  const inspectionData = {
    siteId: selectedSite.id,
    inspectionTypeId: selectedType.id,
    formData: updatedFormData,
    type: 'drill'
  };

  await createInspection(inspectionData);
  setSuccessMessage('התרגיל נשמר בהצלחה');
  
  // Navigate back after success
  setTimeout(() => {
    navigate('/drills');
  }, 2000);
} catch (error) {
  console.error('Error submitting drill:', error);
  setError(error instanceof AppError ? error.message : 'Failed to submit drill');
}
} else {
// For inspections, continue to main form
setShowInitialDialog(false);
}
};

const handleInputChange = (fieldId, value) => {
setFormData(prev => ({
...prev,
[fieldId]: value
}));
// Clear validation error for this field
setValidationErrors(prev => ({
...prev,
[fieldId]: undefined
}));
};

// Validate form data
const validateForm = () => {
const errors = {};

// Validate selections
if (!selectedSite) {
errors.site = 'יש לבחור אתר';
}

if (!selectedType) {
errors.type = isDrill ? 'יש לבחור סוג תרגיל' : 'יש לבחור סוג';
}

// Validate form fields
formStructure?.forEach(field => {

if (field.requiredIf) {
  const { field: dependentField, value: dependentValue } = field.requiredIf;
  if (formData[dependentField] === dependentValue && !formData[field.id]?.trim()) {
    errors[field.id] = 'שדה חובה';
    return;
  }
}

if (formData[field.id]) {
  const value = formData[field.id];
  
  switch (field.type) {
    case 'text':
    case 'textarea':
      if (typeof value !== 'string') {
        errors[field.id] = 'ערך חייב להיות טקסט';
      }
      break;

    case 'select':
      if (!field.options?.includes(value)) {
        errors[field.id] = `ערך לא חוקי בשדה ${field.label}`;
      }
      break;

    case 'boolean':
      if (!['תקין', 'לא תקין'].includes(value)) {
        errors[field.id] = `ערך לא חוקי בשדה ${field.label}`;
      }
      break;
    default:
      errors[field.id] = 'סוג שדה לא נתמך';
      break;
  }
}
});

setValidationErrors(errors);
return Object.keys(errors).length === 0;
};

const handleSubmit = async (event) => {
event.preventDefault();

if (!canCreate) {
setError(`אין לך הרשאה ליצור ${isDrill ? 'תרגיל' : 'ביקורת'}`);
return;
}

if (!validateForm()) {
setError('יש למלא את כל השדות הנדרשים');
return;
}

try {
// Update formData with site name before submitting
const updatedFormData = {
  ...formData,
  site: selectedSite.name,
  securityOfficer: user.name,
  date: new Date().toISOString().split('T')[0],
  time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
};

const inspectionData = {
  siteId: selectedSite.id,
  inspectionTypeId: selectedType.id,
  formData: updatedFormData,
  type: isDrill ? 'drill' : 'inspection'
};

await createInspection(inspectionData);
setSuccessMessage(`ה${isDrill ? 'תרגיל' : 'ביקורת'} נשמר/ה בהצלחה`);

// Navigate back after success
setTimeout(() => {
  navigate(isDrill ? '/drills' : '/inspections');
}, 2000);
} catch (error) {
console.error('Error submitting inspection:', error);
setError(error instanceof AppError ? error.message : `Failed to submit ${isDrill ? 'drill' : 'inspection'}`);
}
};

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar 
        activeSection={isDrill ? "drills" : "inspections"}
        userInfo={{ name: user.name }}  
      />
      <Container maxWidth="lg">
        <Typography variant="h4" gutterBottom sx={{ color: colors.text.white }}>
          {isDrill ? 'תרגיל חדש' : 'ביקורת חדשה'}
        </Typography>

        {/* Initial Dialog */}
        <Dialog
          open={showInitialDialog}
          PaperProps={{
            sx: {
              backgroundColor: colors.background.black,
              color: colors.text.white
            }
          }}
        >
          <DialogTitle>
            {isDrill ? 'תרגיל חדש' : 'ביקורת חדשה'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>

              {/* Entrepreneur Selection */}
              <FormField label="יזם" error={validationErrors.entrepreneur}>
                <Autocomplete
                  options={entrepreneurs}
                  getOptionLabel={(option) => {
                    if (!option) return '';
                    return option.organization?.name || option.name;
                  }}
                  value={selectedEntrepreneur}
                  onChange={handleEntrepreneurChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      error={!!validationErrors.entrepreneur}
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
                    />
                  )}
                />
              </FormField>

              {/* Site Selection */}
              <FormField label="אתר" error={validationErrors.site}>
                <Autocomplete
                  options={selectedEntrepreneur ? sites.filter(site => site.entrepreneur?.id === selectedEntrepreneur.id) : sites}
                  getOptionLabel={(option) => option?.name || ''}
                  value={selectedSite}
                  onChange={handleSiteChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      error={!!validationErrors.site}
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
                    />
                  )}
                />
              </FormField>

              {/* Type Selection (only for inspections) */}
              {!isDrill && (
                <FormField label="סוג ביקורת" required error={validationErrors.type}>
                  <Autocomplete
                    options={inspectionTypes}
                    getOptionLabel={(option) => option?.name || ''}
                    value={selectedType}
                    onChange={handleTypeChange}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        error={!!validationErrors.type}
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
                      />
                    )}
                  />
                </FormField>
              )}

              {/* Drill Type Selection - Only show for drills */}
              {isDrill && selectedSite && (
                <FormField label="סוג תרגיל" required error={validationErrors.drill_type}>
                  <TextField
                    select
                    fullWidth
                    value={formData.drill_type || ''}
                    onChange={handleDrillTypeSelect}
                    error={!!validationErrors.drill_type}
                    sx={{
                      width: '100%',
                      '& .MuiOutlinedInput-root': {
                        ...selectStyles.control,
                        padding: '2px 8px',
                        '& .MuiSelect-select': {
                          color: colors.text.white
                        }
                      }
                    }}
                  >
                    {drillTypes.map(type => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </TextField>
                </FormField>
              )}

              {/* Status Selection - Only show if drill type is selected and not 'אחר' */}
              {isDrill && formData.drill_type && formData.drill_type !== 'אחר' && (
                <FormField label="סטטוס" required error={validationErrors.status}>
                  <TextField
                    select
                    fullWidth
                    value={formData.status || ''}
                    onChange={handleStatusChange}
                    error={!!validationErrors.status}
                    sx={{
                      width: '100%',
                      '& .MuiOutlinedInput-root': {
                        ...selectStyles.control,
                        padding: '2px 8px',
                        '& .MuiSelect-select': {
                          color: colors.text.white
                        }
                      }
                    }}
                  >
                    {DRILL_STATUSES.map(status => (
                      <MenuItem key={status} value={status}>{status}</MenuItem>
                    ))}
                  </TextField>
                </FormField>
              )}

              {/* Notes - Always show when drill type is selected, but required only in specific cases */}
              {isDrill && formData.drill_type && (
                <FormField 
                  label="הערות" 
                  required={formData.drill_type === 'אחר' || formData.status === 'כישלון' || formData.status === 'הצלחה חלקית'}
                  error={validationErrors.notes}
                >
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    value={formData.notes || ''}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    error={!!validationErrors.notes}
                    sx={{
                      width: '100%',
                      '& .MuiOutlinedInput-root': {
                        ...selectStyles.control,
                        padding: '2px 8px',
                        '& textarea': {
                          color: colors.text.white
                        }
                      }
                    }}
                  />
                </FormField>
              )}

</Box>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => navigate(-1)}
              sx={{ color: colors.text.white }}
            >
              ביטול
            </Button>
            <Button 
              onClick={handleInitialDialogSubmit}
              variant="contained"
              sx={{
                backgroundColor: colors.background.orange,
                '&:hover': {
                  backgroundColor: colors.background.darkOrange
                }
              }}
            >
              {isDrill ? 'סיום' : 'המשך'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Main Form - Only for inspections */}
        {!isDrill && !showInitialDialog && (
          <Paper elevation={3} sx={{ p: 2, mb: 3, backgroundColor: colors.background.black }}>
            <form onSubmit={handleSubmit}>
              <Box sx={{ mt: 3 }}>
                {/* Display form fields */}
                {formStructure?.map((field) => (
                  <FormField 
                    key={field.id}
                    label={field.label}
                    error={validationErrors[field.id]}
                  >
                    <TextField
                      fullWidth
                      value={formData[field.id] || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      error={!!validationErrors[field.id]}
                      margin="normal"
                      multiline={field.type === 'textarea'}
                      rows={field.type === 'textarea' ? 4 : undefined}
                      select={field.type === 'select' || field.type === 'boolean'}
                      SelectProps={field.type === 'select' || field.type === 'boolean' ? { native: true } : undefined}
                      disabled={field.autoFill}
                      sx={{
                        width: '100%',
                        '& .MuiOutlinedInput-root': {
                          ...selectStyles.control,
                          padding: '2px 8px',
                          '& input, & textarea, & select': {
                            color: colors.text.white
                          }
                        }
                      }}
                    >
                      {field.type === 'select' && [
                        <option key="" value="" />,
                        ...(field.options || []).map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))
                      ]}
                      {field.type === 'boolean' && [
                        <option key="" value="" />,
                        <option key="תקין" value="תקין">תקין</option>,
                        <option key="לא תקין" value="לא תקין">לא תקין</option>
                      ]}
                    </TextField>
                  </FormField>
                ))}
              </Box>

              <Box mt={2} display="flex" justifyContent="flex-end">
                <Button 
                  type="submit" 
                  variant="contained"
                  sx={{
                    backgroundColor: colors.background.orange,
                    '&:hover': {
                      backgroundColor: colors.background.darkOrange
                    }
                  }}
                >
                  הגשת {isDrill ? 'תרגיל' : 'ביקורת'}
                </Button>
              </Box>
            </form>
          </Paper>
        )}

        {/* Notifications */}
        <Snackbar 
          open={!!error || !!successMessage} 
          autoHideDuration={6000} 
          onClose={() => { setError(null); setSuccessMessage(''); }}
        >
          <Alert 
            onClose={() => { setError(null); setSuccessMessage(''); }} 
            severity={error ? "error" : "success"} 
            sx={{ width: '100%' }}
          >
            {error || successMessage}
          </Alert>
        </Snackbar>

      </Container>
    </Box>
  );
};

export default InspectionForm;
