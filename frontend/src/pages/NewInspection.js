import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Paper, Button, FormControl, InputLabel, Select, MenuItem, TextField, Box, CircularProgress, Snackbar, Grid } from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import { createInspection, getInspectionTypes, getSiteDetails, getCurrentUser, getInspectionFormStructure, getLatestInspection } from '../services/api';
import { useTheme } from '@mui/material/styles';

const fieldTranslations = {
  siteName: 'שם האתר',
  date: 'תאריך',
  time: 'שעה',
  securityOfficerName: 'שם קצין הביטחון',
  lastInspectionDate: 'סיור אחרון של הסייר',
  accessRoute: 'ציר גישה',
  sitegates: 'שערי האתר',
  fence: 'גדר',
  cameras: 'מצלמות',
  publicAddress: 'כריזה',
  lighting: 'תאורה',
  vegetation: 'עשבייה',
  notes: 'הערות',
  drillType: 'סוג התרגיל'
};

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const NewInspection = () => {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [inspectionTypes, setInspectionTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [parameters, setParameters] = useState({});
  const [siteDetails, setSiteDetails] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formStructure, setFormStructure] = useState(null);
  const [lastInspection, setLastInspection] = useState(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [siteResponse, userResponse, typesResponse, latestInspectionResponse] = await Promise.all([
          getSiteDetails(siteId),
          getCurrentUser(),
          getInspectionTypes(),
          getLatestInspection(siteId)
        ]);
        setSiteDetails(siteResponse.data);
        setCurrentUser(userResponse.data);
        setInspectionTypes(typesResponse.data);
        setLastInspection(latestInspectionResponse.data);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setError('Failed to fetch initial data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [siteId]);

  const handleTypeChange = async (event) => {
    const typeId = event.target.value;
    setSelectedType(typeId);
    setParameters({});
    if (typeId) {
      try {
        const formStructureResponse = await getInspectionFormStructure(siteId, typeId);
        setFormStructure(formStructureResponse);
      } catch (error) {
        console.error('Error fetching form structure:', error);
        setError('Failed to fetch form structure. Please try again.');
      }
    } else {
      setFormStructure(null);
    }
  };

  const handleParameterChange = (key, value) => {
    setParameters(prev => ({ ...prev, [key]: value }));
  };

  const validateForm = () => {
    if (!selectedType || !formStructure) return false;
    const requiredFields = Object.entries(formStructure)
      .filter(([_, field]) => field.required)
      .map(([key, _]) => key);
    return requiredFields.every(field => parameters[field]);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setError('אנא מלא את כל השדות הנדרשים');
      return;
    }

    try {
      setSubmitting(true);
      const currentDate = new Date().toISOString();
      const inspectionData = {
        siteId: parseInt(siteId),
        inspectionTypeId: parseInt(selectedType),
        securityOfficerName: currentUser.username,
        date: currentDate,
        formData: parameters,
        status: 'completed',
        faults: [] // TODO Add site faults 
      };
      await createInspection(inspectionData);
      setSuccessMessage('הביקורת נשמרה בהצלחה');
      setTimeout(() => {
        navigate('/inspections');
      }, 2000);
    } catch (error) {
      console.error('Error creating inspection:', error);
      setError('Failed to create inspection. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderInspectionFields = () => {
    if (!formStructure) return null;

    return Object.entries(formStructure).map(([key, field]) => {
      const label = fieldTranslations[key] || field.label;
      switch (field.type) {
        case 'text':
        case 'date':
          return (
            <TextField
              key={key}
              fullWidth
              label={label}
              type={field.type}
              value={parameters[key] || ''}
              onChange={(e) => handleParameterChange(key, e.target.value)}
              disabled={!field.editable}
              required={field.required}
              margin="normal"
            />
          );
        case 'boolean':
          return (
            <FormControl fullWidth key={key} margin="normal">
              <InputLabel>{label}</InputLabel>
              <Select
                value={parameters[key] || ''}
                onChange={(e) => handleParameterChange(key, e.target.value)}
                label={label}
              >
                <MenuItem value="ok">תקין</MenuItem>
                <MenuItem value="not_ok">לא תקין</MenuItem>
              </Select>
            </FormControl>
          );
        default:
          return null;
      }
    });
  };

  const renderSiteInfo = () => (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="שם האתר"
          value={siteDetails?.name || ''}
          disabled
          margin="normal"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="כתובת"
          value={siteDetails?.address || ''}
          disabled
          margin="normal"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="ביקורת אחרונה"
          value={lastInspection ? new Date(lastInspection.date).toLocaleDateString('he-IL') : 'אין מידע'}
          disabled
          margin="normal"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="סוג ביקורת אחרונה"
          value={lastInspection?.InspectionType?.name || 'אין מידע'}
          disabled
          margin="normal"
        />
      </Grid>
    </Grid>
  );

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'right' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, color: theme.palette.primary.main }}>
        ביקורת חדשה - {siteDetails?.name}
      </Typography>
      <Paper sx={{ p: 3, mb: 4, boxShadow: 3, backgroundColor: theme.palette.background.paper }}>
        {renderSiteInfo()}
        <FormControl fullWidth margin="normal">
          <InputLabel>סוג ביקורת</InputLabel>
          <Select
            value={selectedType}
            label="סוג ביקורת"
            onChange={handleTypeChange}
          >
            <MenuItem value="">
              <em>בחר סוג ביקורת</em>
            </MenuItem>
            {inspectionTypes.map((type) => (
              <MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {renderInspectionFields()}

        <Box mt={2}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSubmit} 
            disabled={!validateForm() || submitting}
            sx={{ 
              backgroundColor: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              },
            }}
          >
            {submitting ? <CircularProgress size={24} color="inherit" /> : 'שמור ביקורת'}
          </Button>
        </Box>
      </Paper>
      <Snackbar open={!!error || !!successMessage} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert onClose={() => setError(null)} severity={error ? "error" : "success"} sx={{ width: '100%' }}>
          {error || successMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default NewInspection;
