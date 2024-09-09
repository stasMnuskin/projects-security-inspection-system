import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Button, FormControl, InputLabel, Select, MenuItem, Paper } from '@mui/material';
import { getSites, getInspectionTypes } from '../services/api';

const SecurityDashboard = () => {
  const navigate = useNavigate();
  const [sites, setSites] = useState([]);
  const [inspectionTypes, setInspectionTypes] = useState([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [selectedInspectionType, setSelectedInspectionType] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSites();
    fetchInspectionTypes();
  }, []);

  const fetchSites = async () => {
    try {
      const response = await getSites();
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

  const handleSiteChange = (event) => {
    setSelectedSite(event.target.value);
    setSelectedInspectionType('');
  };

  const handleInspectionTypeChange = (event) => {
    setSelectedInspectionType(event.target.value);
  };

  const handleViewLatestInspection = () => {
    if (selectedSite && selectedInspectionType) {
      navigate(`/inspection/${selectedSite}/${selectedInspectionType}`);
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
      {error && <Typography color="error">{error}</Typography>}
      <Paper sx={{ p: 3, mb: 4, boxShadow: 3 }}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>בחר אתר</InputLabel>
          <Select
            value={selectedSite}
            onChange={handleSiteChange}
            label="בחר אתר"
          >
            {sites.map((site) => (
              <MenuItem key={site.id} value={site.id}>
                {site.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {selectedSite && (
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>בחר סוג ביקורת</InputLabel>
            <Select
              value={selectedInspectionType}
              onChange={handleInspectionTypeChange}
              label="בחר סוג ביקורת"
            >
              {inspectionTypes.map((type) => (
                <MenuItem key={type.id} value={type.id}>
                  {type.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        {selectedSite && selectedInspectionType && (
          <Box display="flex" justifyContent="space-between" mt={2}>
            <Button
              onClick={handleViewLatestInspection}
              variant="contained"
              color="primary"
              sx={{ borderRadius: '20px', px: 4 }}
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
            >
              התחל ביקורת חדשה
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default SecurityDashboard;