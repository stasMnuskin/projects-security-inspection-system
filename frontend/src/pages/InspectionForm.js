import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Button, TextField, FormControl, FormControlLabel, Radio, RadioGroup, Paper, Alert, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText, Select, MenuItem, CircularProgress } from '@mui/material';
import { getInspectionFormStructure, submitInspectionReport, getSiteDetails, getCurrentUser, getOpenFaultsBySite, createFault, getEntrepreneurs, getSitesByEntrepreneur, getInspectionTypes } from '../services/api';

const InspectionForm = () => {
  const { siteId, inspectionTypeId } = useParams();
  const navigate = useNavigate();
  const [formStructure, setFormStructure] = useState({ fields: {} });
  const [formData, setFormData] = useState({});
  const [faults, setFaults] = useState({});
  const [existingFaults, setExistingFaults] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formStructureLoading, setFormStructureLoading] = useState(false);
  const [siteDetails, setSiteDetails] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [openFaultDialog, setOpenFaultDialog] = useState(false);
  const [selectedField, setSelectedField] = useState(null);
  const [entrepreneurs, setEntrepreneurs] = useState([]);
  const [entrepreneursLoading, setEntrepreneursLoading] = useState(false);
  const [selectedEntrepreneur, setSelectedEntrepreneur] = useState('');
  const [sites, setSites] = useState([]);
  const [sitesLoading, setSitesLoading] = useState(false);
  const [selectedSite, setSelectedSite] = useState(siteId || '');
  const [inspectionTypes, setInspectionTypes] = useState([]);
  const [inspectionTypesLoading, setInspectionTypesLoading] = useState(false);
  const [selectedInspectionType, setSelectedInspectionType] = useState(inspectionTypeId || '');

  const fetchFormData = useCallback(async (site, inspectionType) => {
    if (!site || !inspectionType) return;
    try {
      setFormStructureLoading(true);
      const [formStructureResponse, siteResponse, faultsResponse] = await Promise.all([
        getInspectionFormStructure(site, inspectionType),
        getSiteDetails(site),
        getOpenFaultsBySite(site)
      ]);
      setFormStructure(formStructureResponse);
      setSiteDetails(siteResponse);
      setExistingFaults(faultsResponse);
      console.log('formStructureResponse:', formStructureResponse);
      const initialFormData = Object.keys(formStructureResponse.fields).reduce((acc, fieldId) => {
        const field = formStructureResponse.fields[fieldId];
        if (!field.editable) {
          switch (fieldId) {
            case 'siteName':
              acc[fieldId] = siteResponse.name;
              break;
            case 'date':
              acc[fieldId] = new Date().toISOString().split('T')[0];
              break;
            case 'securityOfficerName':
              acc[fieldId] = currentUser?.username || '';
              break;
            case 'lastInspectionDate':
              // TODO fetch from backend
              acc[fieldId] = 'לא זמין';
              break;
            default:
              acc[fieldId] = '';
          }
        } else if (field.type === 'boolean') {
          acc[fieldId] = true; 
        } else {
          acc[fieldId] = '';
        }
        return acc;
      }, {});
      setFormData(initialFormData);
    } catch (error) {
      console.error('שגיאה בטעינת נתונים:', error);
      setError(error.message || 'שגיאה בטעינת נתונים. אנא נסה שנית מאוחר יותר.');
    } finally {
      setFormStructureLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setEntrepreneursLoading(true);
        setInspectionTypesLoading(true);

        const [userResponse, entrepreneursResponse, inspectionTypesResponse] = await Promise.all([
          getCurrentUser(),
          getEntrepreneurs(),
          getInspectionTypes()
        ]);

        setCurrentUser(userResponse);
        setEntrepreneurs(entrepreneursResponse);
        setInspectionTypes(inspectionTypesResponse);

        if (siteId) {
          setSitesLoading(true);
          const siteResponse = await getSiteDetails(siteId);
          setSiteDetails(siteResponse);
          setSelectedSite(siteId);
          setSelectedEntrepreneur(siteResponse.entrepreneurId ? siteResponse.entrepreneurId.toString() : '');
          const sitesResponse = await getSitesByEntrepreneur(siteResponse.entrepreneurId);
          setSites(sitesResponse);
          setSitesLoading(false);
        }

        if (inspectionTypeId) {
          setSelectedInspectionType(inspectionTypeId);
        }

        if (siteId && inspectionTypeId) {
          await fetchFormData(siteId, inspectionTypeId);
        }
      } catch (error) {
        console.error('שגיאה בטעינת נתונים ראשוניים:', error);
        setError(error.message || 'שגיאה בטעינת נתונים ראשוניים. אנא נסה שנית מאוחר יותר.');
      } finally {
        setLoading(false);
        setEntrepreneursLoading(false);
        setInspectionTypesLoading(false);
      }
    };

    fetchInitialData();
  }, [siteId, inspectionTypeId, fetchFormData]);

  useEffect(() => {
    if (selectedEntrepreneur) {
      const fetchSites = async () => {
        try {
          setSitesLoading(true);
          const sitesResponse = await getSitesByEntrepreneur(selectedEntrepreneur);
          setSites(sitesResponse);
        } catch (error) {
          console.error('שגיאה בטעינת אתרים:', error);
          setError(error.message || 'שגיאה בטעינת אתרים. אנא נסה שנית מאוחר יותר.');
        } finally {
          setSitesLoading(false);
        }
      };

      fetchSites();
    }
  }, [selectedEntrepreneur]);

  useEffect(() => {
    if (selectedSite && selectedInspectionType) {
      console.log('selectedSite changed to', selectedSite);
      console.log('selectedInspectionType changed to', selectedInspectionType);
      fetchFormData(selectedSite, selectedInspectionType);
    }
  }, [selectedSite, selectedInspectionType, fetchFormData]);

  const handleInputChange = (fieldId, value) => {
    setFormData(prevData => ({
      ...prevData,
      [fieldId]: value
    }));

    if (formStructure.fields[fieldId].type === 'boolean' && !value) {
      setFaults(prevFaults => ({
        ...prevFaults,
        [fieldId]: { description: '', isNew: true }
      }));
    } else {
      setFaults(prevFaults => {
        const { [fieldId]: _, ...rest } = prevFaults;
        return rest;
      });
    }
  };

  const handleFaultDescriptionChange = (fieldId, description) => {
    setFaults(prevFaults => ({
      ...prevFaults,
      [fieldId]: { ...prevFaults[fieldId], description }
    }));
  };

  const handleExistingFaultLink = (fieldId) => {
    setSelectedField(fieldId);
    setOpenFaultDialog(true);
  };

  const handleFaultSelection = (fault) => {
    setFaults(prevFaults => ({
      ...prevFaults,
      [selectedField]: { ...fault, isNew: false }
    }));
    setOpenFaultDialog(false);
  };

  const validateForm = () => {
    const errors = [];
    Object.entries(formStructure.fields).forEach(([fieldId, field]) => {
      if (field.required && !formData[fieldId]) {
        errors.push(`השדה "${field.label}" הוא שדה חובה`);
      }
    });
    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }
    try {
      const faultsToSubmit = await Promise.all(
        Object.entries(faults).map(async ([fieldId, faultData]) => {
          if (faultData.isNew) {
            const newFault = await createFault({
              siteId: parseInt(selectedSite),
              description: faultData.description,
              status: 'פתוח'
            });
            return { faultId: newFault.id, fieldId };
          } else {
            return { faultId: faultData.id, fieldId };
          }
        })
      );

      const reportData = {
        siteId: parseInt(selectedSite),
        inspectionTypeId: parseInt(selectedInspectionType),
        securityOfficerName: currentUser.username,
        date: new Date().toISOString(),
        formData: formData,
        faults: faultsToSubmit
      };
      await submitInspectionReport(reportData);

      setSuccess('דוח הביקורת נשלח בהצלחה');
      setTimeout(() => {
        navigate('/security-dashboard');
      }, 2000);
    } catch (error) {
      console.error('שגיאה בשליחת דוח ביקורת:', error);
      setError(error.message || 'שגיאה בשליחת דוח ביקורת. אנא נסה שנית מאוחר יותר.');
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(null);
    setError(null);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'right' }}>
        <Typography>טוען טופס ביקורת...</Typography>
      </Container>
    );
  }

  const renderField = (fieldId, field) => {
    switch (field.type) {
      case 'text':
        return (
          <TextField
            fullWidth
            label={field.label}
            value={formData[fieldId] || ''}
            onChange={(e) => handleInputChange(fieldId, e.target.value)}
            disabled={!field.editable}
            required={field.required}
            error={field.required && !formData[fieldId]}
            helperText={field.required && !formData[fieldId] ? 'שדה חובה' : ''}
          />
        );
      case 'boolean':
        return (
          <>
            <FormControl component="fieldset">
              <RadioGroup
                row
                name={`field_${fieldId}`}
                value={formData[fieldId] ? 'תקין' : 'לא תקין'}
                onChange={(e) => handleInputChange(fieldId, e.target.value === 'תקין')}
              >
                <FormControlLabel value="תקין" control={<Radio />} label="תקין" />
                <FormControlLabel value="לא תקין" control={<Radio />} label="לא תקין" />
              </RadioGroup>
            </FormControl>
            {!formData[fieldId] && (
              <>
                <TextField
                  fullWidth
                  label="תיאור התקלה"
                  value={faults[fieldId]?.description || ''}
                  onChange={(e) => handleFaultDescriptionChange(fieldId, e.target.value)}
                  multiline
                  rows={3}
                  required
                  error={!faults[fieldId]?.description}
                  helperText={!faults[fieldId]?.description ? 'נדרש תיאור תקלה' : ''}
                />
                <Button onClick={() => handleExistingFaultLink(fieldId)}>
                  קשר לתקלה קיימת
                </Button>
              </>
            )}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'right' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, color: 'primary.main' }}>
        {siteId && inspectionTypeId ? 'עריכת ביקורת' : 'טופס ביקורת חדש'}
      </Typography>
      <Paper sx={{ p: 3, mb: 4, boxShadow: 3 }}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            בחר יזם
          </Typography>
          <Select
            value={selectedEntrepreneur}
            onChange={(e) => setSelectedEntrepreneur(e.target.value)}
            displayEmpty
            disabled={!!siteId || entrepreneursLoading}
          >
            <MenuItem value="" disabled>בחר יזם</MenuItem>
            {entrepreneursLoading ? (
              <MenuItem disabled>
                <CircularProgress size={20} />
                &nbsp;טוען יזמים...
              </MenuItem>
            ) : (
              entrepreneurs.map((entrepreneur) => (
                <MenuItem key={entrepreneur.id} value={entrepreneur.id.toString()}>
                  {entrepreneur.name || entrepreneur.username}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>
        {selectedEntrepreneur && (
          <FormControl fullWidth sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              בחר אתר
            </Typography>
            <Select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              displayEmpty
              disabled={!!siteId || sitesLoading}
            >
              <MenuItem value="" disabled>בחר אתר</MenuItem>
              {sitesLoading ? (
                <MenuItem disabled>
                  <CircularProgress size={20} />
                  &nbsp;טוען אתרים...
                </MenuItem>
              ) : (
                sites.map((site) => (
                  <MenuItem key={site.id} value={site.id.toString()}>{site.name}</MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        )}
        {selectedSite && (
          <FormControl fullWidth sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              בחר סוג ביקורת
            </Typography>
            <Select
              value={selectedInspectionType}
              onChange={(e) => setSelectedInspectionType(e.target.value)}
              displayEmpty
              disabled={!!inspectionTypeId || inspectionTypesLoading}
            >
              <MenuItem value="" disabled>בחר סוג ביקורת</MenuItem>
              {inspectionTypesLoading ? (
                <MenuItem disabled>
                  <CircularProgress size={20} />
                  &nbsp;טוען סוגי ביקורת...
                </MenuItem>
              ) : (
                inspectionTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id.toString()}>{type.name}</MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        )}
      </Paper>
      {selectedSite && selectedInspectionType && (
        <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3, mb: 4, boxShadow: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ mb: 2, color: 'secondary.main' }}>
            פרטי הביקורת - {siteDetails?.name}
          </Typography>
          {formStructureLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="200px">
              <CircularProgress />
            </Box>
          ) : (
            Object.entries(formStructure.fields).map(([fieldId, field]) => (
              <FormControl key={fieldId} fullWidth sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  {field.label}
                </Typography>
                {renderField(fieldId, field)}
              </FormControl>
            ))
          )}
          <Box display="flex" justifyContent="flex-end" mt={2}>
            <Button type="submit" variant="contained" color="primary" sx={{ borderRadius: '20px', px: 4 }}>
              שלח דוח ביקורת
            </Button>
          </Box>
        </Paper>
      )}
      <Dialog open={openFaultDialog} onClose={() => setOpenFaultDialog(false)}>
        <DialogTitle>בחר תקלה קיימת</DialogTitle>
        <DialogContent>
          <List>
            {existingFaults.map(fault => (
              <ListItem button key={fault.id} onClick={() => handleFaultSelection(fault)}>
                <ListItemText primary={fault.description} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFaultDialog(false)}>ביטול</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!error || !!success} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={error ? "error" : "success"} sx={{ width: '100%' }}>
          {error || success}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default InspectionForm;