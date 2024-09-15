import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Button, FormControl, InputLabel, Select, MenuItem, Paper, Alert } from '@mui/material';
import { getSites, getInspectionTypes, getEntrepreneurs, getLatestInspection } from '../services/api';

const SecurityDashboard = () => {
  const navigate = useNavigate();
  const [entrepreneurs, setEntrepreneurs] = useState([]);
  const [sites, setSites] = useState([]);
  const [inspectionTypes, setInspectionTypes] = useState([]);
  const [selectedEntrepreneur, setSelectedEntrepreneur] = useState('');
  const [selectedSite, setSelectedSite] = useState('');
  const [selectedInspectionType, setSelectedInspectionType] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntrepreneurs = async () => {
      try {
        setLoading(true);
        console.log('Fetching entrepreneurs...');
        const response = await getEntrepreneurs();
        console.log('Entrepreneurs response:', response);
        if (response && response.data) {
          setEntrepreneurs(response.data);
          console.log('Entrepreneurs set:', response.data);
          if (response.data.length === 0) {
            setError('No entrepreneurs found in the system.');
          } else {
            setError(null);
          }
        } else {
          console.error('Invalid response format:', response);
          setError('Failed to fetch entrepreneurs. Invalid response format.');
        }
      } catch (error) {
        console.error('Error fetching entrepreneurs:', error);
        if (error.response) {
          console.error('Error response:', error.response);
          setError(`Failed to fetch entrepreneurs. Server responded with ${error.response.status}: ${error.response.data.message}`);
        } else if (error.request) {
          console.error('No response received:', error.request);
          setError('Failed to fetch entrepreneurs. No response received from server.');
        } else {
          console.error('Error details:', error.message);
          setError(`Failed to fetch entrepreneurs. ${error.message}`);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchEntrepreneurs();
    fetchInspectionTypes();
  }, []);

  

  const fetchSites = async (entrepreneurId) => {
    try {
      const response = await getSites(entrepreneurId);
      setSites(response.data);
    } catch (error) {
      console.error('Error fetching sites:', error);
      setError('Failed to fetch sites. Please try again later.');
    }
  };

  const fetchInspectionTypes = async () => {
    try {
      const response = await getInspectionTypes();
      setInspectionTypes(response.data);
    } catch (error) {
      console.error('Error fetching inspection types:', error);
      setError('Failed to fetch inspection types. Please try again later.');
    }
  };

  const handleEntrepreneurChange = (event) => {
    const entrepreneurId = event.target.value;
    setSelectedEntrepreneur(entrepreneurId);
    setSelectedSite('');
    setSelectedInspectionType('');
    if (entrepreneurId) {
      fetchSites(entrepreneurId);
    } else {
      setSites([]);
    }
  };

  const handleSiteChange = (event) => {
    setSelectedSite(event.target.value);
    setSelectedInspectionType('');
  };

  const handleInspectionTypeChange = (event) => {
    setSelectedInspectionType(event.target.value);
  };

  const handleViewLatestInspection = async () => {
    if (selectedSite && selectedInspectionType) {
      try {
        const response = await getLatestInspection(selectedSite, selectedInspectionType);
        if (response.data) {
          navigate(`/inspection/${response.data.id}`);
        } else {
          setError('No inspection found for the selected site and inspection type.');
        }
      } catch (error) {
        console.error('Error fetching latest inspection:', error);
        setError('Failed to fetch latest inspection. Please try again later.');
      }
    }
  };

  const handleViewFaults = () => {
    if (selectedSite) {
      navigate(`/faults/${selectedSite}`);
    }
  };

  const handleStartNewInspection = () => {
    if (selectedSite && selectedInspectionType) {
      navigate(`/new-inspection/${selectedSite}/${selectedInspectionType}`);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'right' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, color: 'primary.main' }}>
        דשבורד קצין הביטחון
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? (
        <Typography>טוען נתונים...</Typography>
      ) : (
        <Paper sx={{ p: 3, mb: 4, boxShadow: 3 }}>
          {entrepreneurs.length > 0 ? (
            <>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>בחר יזם</InputLabel>
                <Select
                  value={selectedEntrepreneur}
                  onChange={handleEntrepreneurChange}
                  label="בחר יזם"
                >
                  <MenuItem value="">
                    <em>בחר יזם</em>
                  </MenuItem>
                  {entrepreneurs.map((entrepreneur) => (
                    <MenuItem key={entrepreneur.id} value={entrepreneur.id}>
                      {entrepreneur.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {selectedEntrepreneur && (
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>בחר אתר</InputLabel>
                  <Select
                    value={selectedSite}
                    onChange={handleSiteChange}
                    label="בחר אתר"
                  >
                    <MenuItem value="">
                      <em>בחר אתר</em>
                    </MenuItem>
                    {sites.map((site) => (
                      <MenuItem key={site.id} value={site.id}>
                        {site.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              {selectedSite && (
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>בחר סוג ביקורת</InputLabel>
                  <Select
                    value={selectedInspectionType}
                    onChange={handleInspectionTypeChange}
                    label="בחר סוג ביקורת"
                  >
                    <MenuItem value="">
                      <em>בחר סוג ביקורת</em>
                    </MenuItem>
                    {inspectionTypes.map((type) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              {selectedSite && (
                <Box display="flex" justifyContent="space-between" mt={2}>
                  <Button
                    onClick={handleViewLatestInspection}
                    variant="contained"
                    color="primary"
                    sx={{ borderRadius: '20px', px: 4 }}
                    disabled={!selectedInspectionType}
                  >
                    צפה בביקורת אחרונה
                  </Button>
                  <Button
                    onClick={handleViewFaults}
                    variant="contained"
                    color="secondary"
                    sx={{ borderRadius: '20px', px: 4 }}
                  >
                    צפה בתקלות
                  </Button>
                  <Button
                    onClick={handleStartNewInspection}
                    variant="contained"
                    color="success"
                    sx={{ borderRadius: '20px', px: 4 }}
                    disabled={!selectedInspectionType}
                  >
                    התחל ביקורת חדשה
                  </Button>
                </Box>
              )}
            </>
          ) : (
            <Alert severity="info">אין יזמים במערכת. אנא צור קשר עם מנהל המערכת.</Alert>
          )}
        </Paper>
      )}
    </Container>
  );
};

export default SecurityDashboard;