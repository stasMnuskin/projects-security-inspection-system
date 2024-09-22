import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Button, TextField, FormControl, FormControlLabel, Radio, RadioGroup, Paper, Alert, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText, Select, MenuItem } from '@mui/material';
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
  const [siteDetails, setSiteDetails] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [openFaultDialog, setOpenFaultDialog] = useState(false);
  const [selectedField, setSelectedField] = useState(null);
  const [entrepreneurs, setEntrepreneurs] = useState([]);
  const [selectedEntrepreneur, setSelectedEntrepreneur] = useState('');
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(siteId || '');
  const [inspectionTypes, setInspectionTypes] = useState([]);
  const [selectedInspectionType, setSelectedInspectionType] = useState(inspectionTypeId || '');

  const fetchFormData = useCallback(async (site, inspectionType) => {
    if (!site || !inspectionType) return;
    try {
      setLoading(true);
      const [formStructureResponse, siteResponse, faultsResponse] = await Promise.all([
        getInspectionFormStructure(site, inspectionType),
        getSiteDetails(site),
        getOpenFaultsBySite(site)
      ]);
      setFormStructure(formStructureResponse);
      setSiteDetails(siteResponse.data);
      setExistingFaults(faultsResponse.data);
      console.log('formStructureResponse:', formStructureResponse);
      const initialFormData = Object.keys(formStructureResponse.fields).reduce((acc, fieldId) => {
        const field = formStructureResponse.fields[fieldId];
        if (!field.editable) {
          switch (fieldId) {
            case 'siteName':
              acc[fieldId] = siteResponse.data.name;
              break;
            case 'date':
              acc[fieldId] = new Date().toISOString().split('T')[0];
              break;
            case 'securityOfficerName':
              acc[fieldId] = currentUser?.username || '';
              break;
            case 'lastInspectionDate':
              // This should be fetched from the backend
              acc[fieldId] = 'לא זמין';
              break;
            default:
              acc[fieldId] = '';
          }
        } else if (field.type === 'boolean') {
          acc[fieldId] = true; // Default to 'תקין'
        } else {
          acc[fieldId] = '';
        }
        return acc;
      }, {});
      setFormData(initialFormData);
    } catch (error) {
      console.error('שגיאה בטעינת נתונים:', error);
      setError('שגיאה בטעינת נתונים. אנא נסה שנית מאוחר יותר.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [userResponse, entrepreneursResponse, inspectionTypesResponse] = await Promise.all([
          getCurrentUser(),
          getEntrepreneurs(),
          getInspectionTypes()
        ]);
        setCurrentUser(userResponse.data);
        setEntrepreneurs(entrepreneursResponse.data);
        setInspectionTypes(inspectionTypesResponse.data);

        if (siteId) {
          const siteResponse = await getSiteDetails(siteId);
          setSiteDetails(siteResponse.data);
          setSelectedSite(siteId);
          setSelectedEntrepreneur(siteResponse.data.entrepreneurId.toString());
          const sitesResponse = await getSitesByEntrepreneur(siteResponse.data.entrepreneurId);
          setSites(sitesResponse.data);
        }

        if (inspectionTypeId) {
          setSelectedInspectionType(inspectionTypeId);
        }

        if (siteId && inspectionTypeId) {
          await fetchFormData(siteId, inspectionTypeId);
        }
      } catch (error) {
        console.error('שגיאה בטעינת נתונים ראשוניים:', error);
        setError('שגיאה בטעינת נתונים ראשוניים. אנא נסה שנית מאוחר יותר.');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [siteId, inspectionTypeId, fetchFormData]);

  useEffect(() => {
    if (selectedEntrepreneur) {
      const fetchSites = async () => {
        try {
          const sitesResponse = await getSitesByEntrepreneur(selectedEntrepreneur);
          setSites(sitesResponse.data);
        } catch (error) {
          console.error('שגיאה בטעינת אתרים:', error);
          setError('שגיאה בטעינת אתרים. אנא נסה שנית מאוחר יותר.');
        }
      };

      fetchSites();
    }
  }, [selectedEntrepreneur]);

  useEffect(() => {
    if (selectedSite && selectedInspectionType) {
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

  const handleSubmit = async (event) => {
    event.preventDefault();
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
      setError('שגיאה בשליחת דוח ביקורת. אנא נסה שנית מאוחר יותר.');
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
            disabled={!!siteId}
          >
            <MenuItem value="" disabled>בחר יזם</MenuItem>
            {entrepreneurs.map((entrepreneur) => (
              <MenuItem key={entrepreneur.id} value={entrepreneur.id.toString()}>{entrepreneur.name}</MenuItem>
            ))}
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
              disabled={!!siteId}
            >
              <MenuItem value="" disabled>בחר אתר</MenuItem>
              {sites.map((site) => (
                <MenuItem key={site.id} value={site.id.toString()}>{site.name}</MenuItem>
              ))}
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
              disabled={!!inspectionTypeId}
            >
              <MenuItem value="" disabled>בחר סוג ביקורת</MenuItem>
              {inspectionTypes.map((type) => (
                <MenuItem key={type.id} value={type.id.toString()}>{type.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Paper>
      {selectedSite && selectedInspectionType && (
        <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3, mb: 4, boxShadow: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ mb: 2, color: 'secondary.main' }}>
            פרטי הביקורת - {siteDetails?.name}
          </Typography>
          {Object.entries(formStructure.fields).map(([fieldId, field]) => (
            <FormControl key={fieldId} fullWidth sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                {field.label}
              </Typography>
              {renderField(fieldId, field)}
            </FormControl>
          ))}
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