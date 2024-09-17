import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Button, TextField, FormControl, FormControlLabel, Radio, RadioGroup, Paper, Alert, Snackbar, Checkbox, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText } from '@mui/material';
import { getInspectionFormStructure, submitInspectionReport, getSiteDetails, getCurrentUser, getOpenFaultsBySite, createFault, updateFault } from '../services/api';

const InspectionForm = () => {
  const { siteId, inspectionTypeId } = useParams();
  const navigate = useNavigate();
  const [formStructure, setFormStructure] = useState([]);
  const [formData, setFormData] = useState({});
  const [newFaults, setNewFaults] = useState({});
  const [existingFaults, setExistingFaults] = useState([]);
  const [linkedFaults, setLinkedFaults] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [siteDetails, setSiteDetails] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [openFaultDialog, setOpenFaultDialog] = useState(false);
  const [selectedField, setSelectedField] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [formStructureResponse, siteResponse, userResponse, faultsResponse] = await Promise.all([
          getInspectionFormStructure(inspectionTypeId),
          getSiteDetails(siteId),
          getCurrentUser(),
          getOpenFaultsBySite(siteId)
        ]);
        setFormStructure(formStructureResponse.data);
        setSiteDetails(siteResponse.data);
        setCurrentUser(userResponse.data);
        setExistingFaults(faultsResponse.data);
        
        const initialFormData = formStructureResponse.data.reduce((acc, field) => {
          if (field.autoFill) {
            switch (field.id) {
              case 'siteName':
                acc[field.id] = siteResponse.data.name;
                break;
              case 'date':
                acc[field.id] = new Date().toISOString().split('T')[0];
                break;
              case 'time':
                acc[field.id] = new Date().toTimeString().split(' ')[0];
                break;
              case 'inspectorName':
                acc[field.id] = userResponse.data.username;
                break;
              default:
                acc[field.id] = '';
            }
          } else {
            acc[field.id] = '';
          }
          return acc;
        }, {});
        setFormData(initialFormData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch necessary data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [inspectionTypeId, siteId]);

  const handleInputChange = (fieldId, value) => {
    setFormData(prevData => ({
      ...prevData,
      [fieldId]: value
    }));
  };

  const handleNewFaultToggle = (fieldId) => {
    setNewFaults(prevFaults => ({
      ...prevFaults,
      [fieldId]: !prevFaults[fieldId]
    }));
  };

  const handleExistingFaultLink = (fieldId) => {
    setSelectedField(fieldId);
    setOpenFaultDialog(true);
  };

  const handleFaultSelection = (faultId) => {
    setLinkedFaults(prevLinkedFaults => ({
      ...prevLinkedFaults,
      [selectedField]: faultId
    }));
    setOpenFaultDialog(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      // Create new faults
      const createdFaults = await Promise.all(
        Object.entries(newFaults)
          .filter(([_, isNewFault]) => isNewFault)
          .map(([fieldId, _]) => createFault({
            siteId: parseInt(siteId),
            description: formData[fieldId],
            status: 'open'
          }))
      );

      // Prepare linked faults data
      const linkedFaultsData = Object.entries(linkedFaults).map(([fieldId, faultId]) => ({
        faultId,
        fieldId
      }));

      // Combine new and linked faults
      const allFaults = [
        ...createdFaults.map(fault => ({ faultId: fault.id, fieldId: fault.description })),
        ...linkedFaultsData
      ];

      // Submit inspection report
      const reportData = {
        siteId: parseInt(siteId),
        inspectionTypeId: parseInt(inspectionTypeId),
        inspectorName: currentUser.username,
        date: new Date().toISOString(),
        formData: formData,
        faults: allFaults
      };
      await submitInspectionReport(reportData);

      // Close linked faults if they were marked as resolved
      await Promise.all(
        Object.entries(linkedFaults).map(async ([fieldId, faultId]) => {
          if (formData[`resolved_${fieldId}`]) {
            await updateFault(faultId, { status: 'closed' });
          }
        })
      );

      setSuccess('Inspection report submitted successfully');
      setTimeout(() => {
        navigate('/security-dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error submitting inspection report:', error);
      setError('Failed to submit inspection report. Please try again later.');
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

  const renderField = (field) => {
    return (
      <>
        {renderInputField(field)}
        {!field.autoFill && renderFaultOptions(field)}
      </>
    );
  };

  const renderInputField = (field) => {
    switch (field.type) {
      case 'text':
      case 'date':
      case 'time':
        return (
          <TextField
            fullWidth
            label={field.label}
            type={field.type}
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            disabled={field.autoFill}
            required={field.required}
          />
        );
      case 'radio':
        return (
          <FormControl component="fieldset">
            <RadioGroup
              row
              name={`field_${field.id}`}
              value={formData[field.id] || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
            >
              {field.options.map(option => (
                <FormControlLabel key={option.value} value={option.value} control={<Radio />} label={option.label} />
              ))}
            </RadioGroup>
          </FormControl>
        );
      case 'textarea':
        return (
          <TextField
            fullWidth
            label={field.label}
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            multiline
            rows={3}
            required={field.required}
          />
        );
      default:
        return null;
    }
  };

  const renderFaultOptions = (field) => {
    return (
      <Box mt={1}>
        <FormControlLabel
          control={
            <Checkbox
              checked={!!newFaults[field.id]}
              onChange={() => handleNewFaultToggle(field.id)}
            />
          }
          label="סמן כתקלה חדשה"
        />
        <Button onClick={() => handleExistingFaultLink(field.id)}>
          קשר לתקלה קיימת
        </Button>
        {linkedFaults[field.id] && (
          <FormControlLabel
            control={
              <Checkbox
                checked={!!formData[`resolved_${field.id}`]}
                onChange={(e) => handleInputChange(`resolved_${field.id}`, e.target.checked)}
              />
            }
            label="סמן כתקלה שנפתרה"
          />
        )}
      </Box>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'right' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, color: 'primary.main' }}>
        טופס ביקורת - {siteDetails?.name}
      </Typography>
      <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3, mb: 4, boxShadow: 3 }}>
        {formStructure.map(field => (
          <FormControl key={field.id} fullWidth sx={{ mb: 2 }}>
            {renderField(field)}
          </FormControl>
        ))}
        <Box display="flex" justifyContent="flex-end" mt={2}>
          <Button type="submit" variant="contained" color="primary" sx={{ borderRadius: '20px', px: 4 }}>
            שלח דוח ביקורת
          </Button>
        </Box>
      </Paper>
      <Dialog open={openFaultDialog} onClose={() => setOpenFaultDialog(false)}>
        <DialogTitle>בחר תקלה קיימת</DialogTitle>
        <DialogContent>
          <List>
            {existingFaults.map(fault => (
              <ListItem button key={fault.id} onClick={() => handleFaultSelection(fault.id)}>
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