import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Button, TextField, FormControl, FormControlLabel, Radio, RadioGroup, Paper, Alert, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText } from '@mui/material';
import { getInspectionCriteria, submitInspectionReport, getSiteDetails, getCurrentUser, getFaults } from '../services/api';

const InspectionForm = () => {
  const { siteId, inspectionTypeId } = useParams();
  const navigate = useNavigate();
  const [criteria, setCriteria] = useState([]);
  const [formData, setFormData] = useState({});
  const [linkedFaults, setLinkedFaults] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [siteDetails, setSiteDetails] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [existingFaults, setExistingFaults] = useState([]);
  const [openFaultDialog, setOpenFaultDialog] = useState(false);
  const [selectedCriterion, setSelectedCriterion] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [criteriaResponse, siteResponse, userResponse, faultsResponse] = await Promise.all([
          getInspectionCriteria(inspectionTypeId),
          getSiteDetails(siteId),
          getCurrentUser(),
          getFaults(siteId)
        ]);
        setCriteria(criteriaResponse.data);
        setSiteDetails(siteResponse.data);
        setCurrentUser(userResponse.data);
        setExistingFaults(faultsResponse.data);
        
        const initialFormData = criteriaResponse.data.reduce((acc, criterion) => {
          acc[criterion.id] = '';
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

  const handleInputChange = (criterionId, value) => {
    setFormData(prevData => ({
      ...prevData,
      [criterionId]: value
    }));
  };

  const handleFaultLinking = (criterionId) => {
    setSelectedCriterion(criterionId);
    setOpenFaultDialog(true);
  };

  const handleFaultSelection = (faultId) => {
    setLinkedFaults(prevLinkedFaults => ({
      ...prevLinkedFaults,
      [selectedCriterion]: faultId
    }));
    setOpenFaultDialog(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const reportData = {
        ...formData,
        siteId,
        inspectionTypeId,
        inspectorName: currentUser.username,
        date: new Date().toISOString(),
        linkedFaults: linkedFaults
      };
      await submitInspectionReport(reportData);
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

  const renderField = (criterion) => {
    switch (criterion.name) {
      case 'שם האתר':
      case 'תאריך':
      case 'שעה':
      case 'שם קצין הביטחון':
      case 'סיור אחרון באתר':
      case 'שם מבצע הביקורת':
        return (
          <TextField
            fullWidth
            label={criterion.name}
            value={
              criterion.name === 'שם האתר' ? siteDetails.name :
              criterion.name === 'תאריך' ? new Date().toLocaleDateString() :
              criterion.name === 'שעה' ? new Date().toLocaleTimeString() :
              criterion.name === 'שם קצין הביטחון' || criterion.name === 'שם מבצע הביקורת' ? currentUser.username :
              criterion.name === 'סיור אחרון באתר' ? siteDetails.lastInspectionDate || 'לא ידוע' :
              formData[criterion.id]
            }
            disabled
          />
        );
      case 'הצלחה':
        return (
          <FormControl component="fieldset">
            <RadioGroup
              row
              name={`success_${criterion.id}`}
              value={formData[criterion.id]}
              onChange={(e) => handleInputChange(criterion.id, e.target.value)}
            >
              <FormControlLabel value="כן" control={<Radio />} label="כן" />
              <FormControlLabel value="לא" control={<Radio />} label="לא" />
            </RadioGroup>
          </FormControl>
        );
      default:
        return (
          <>
            <TextField
              fullWidth
              label={criterion.name}
              value={formData[criterion.id]}
              onChange={(e) => handleInputChange(criterion.id, e.target.value)}
              multiline
              rows={3}
            />
            <Button onClick={() => handleFaultLinking(criterion.id)}>
              {linkedFaults[criterion.id] ? 'Change Linked Fault' : 'Link to Existing Fault'}
            </Button>
          </>
        );
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'right' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, color: 'primary.main' }}>
        טופס ביקורת
      </Typography>
      <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3, mb: 4, boxShadow: 3 }}>
        {criteria.map(criterion => (
          <FormControl key={criterion.id} fullWidth sx={{ mb: 2 }}>
            {renderField(criterion)}
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