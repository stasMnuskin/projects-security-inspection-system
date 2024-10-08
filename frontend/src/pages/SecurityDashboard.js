import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Button, FormControl, InputLabel, Select, MenuItem, Paper, Alert } from '@mui/material';
import { getSites, getInspectionTypes, getEntrepreneurs, getLatestInspection } from '../services/api';
import { AppError } from '../utils/errorHandler';

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
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('מייבא נתוני יזמים וסוגי ביקורות...');
        const [entrepreneursResponse, inspectionTypesResponse] = await Promise.all([
          getEntrepreneurs(),
          getInspectionTypes()
        ]);
        setEntrepreneurs(entrepreneursResponse.data);
        setInspectionTypes(inspectionTypesResponse.data);
        console.log('Inspection Types:', inspectionTypesResponse.data);
        setError(null);
        console.log('נתוני יזמים וסוגי ביקורות יובאו בהצלחה');
      } catch (error) {
        console.log('שגיאה בייבוא נתונים התחלתיים:', error);
        setError(new AppError('כשל בייבוא נתונים התחלתיים. אנא נסה שוב מאוחר יותר.', 500, 'FETCH_INITIAL_DATA_ERROR'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleEntrepreneurChange = async (event) => {
    const entrepreneurId = event.target.value;
    setSelectedEntrepreneur(entrepreneurId);
    setSelectedSite('');
    setSelectedInspectionType('');
    if (entrepreneurId) {
      try {
        console.log(`מייבא אתרים עבור יזם ${entrepreneurId}...`);
        const response = await getSites(entrepreneurId);
        console.log('Response from getSites:', response);
        if (response && response.data) {
          setSites(response.data);
          console.log(`אתרים יובאו בהצלחה עבור יזם ${entrepreneurId}:`, response.data);
        } else {
          console.log('No data returned from getSites');
          setSites([]);
        }
      } catch (error) {
        console.log('שגיאה בייבוא אתרים:', error);
        setError(new AppError('כשל בייבוא אתרים. אנא נסה שוב מאוחר יותר.', 500, 'FETCH_SITES_ERROR'));
        setSites([]);
      }
    } else {
      setSites([]);
    }
  };

  const handleSiteChange = (event) => {
    const siteId = event.target.value;
    setSelectedSite(siteId);
    setSelectedInspectionType('');
    console.log(`אתר נבחר: ${siteId}`);
  };

  const handleInspectionTypeChange = (event) => {
    const value = event.target.value;
    setSelectedInspectionType(value);
    console.log(`סוג ביקורת נבחר: ${value}`);
  };

  const handleViewLatestInspection = async () => {
    if (selectedSite && selectedInspectionType) {
      try {
        console.log(`מייבא ביקורת אחרונה עבור אתר ${selectedSite} וסוג ביקורת ${selectedInspectionType}...`);
        const response = await getLatestInspection(selectedSite);
        if (response.data) {
          navigate(`/inspection/${response.data.id}`);
        } else {
          setError(new AppError('לא נמצאה ביקורת עבור האתר וסוג הביקורת שנבחרו.', 404, 'INSPECTION_NOT_FOUND'));
        }
      } catch (error) {
        console.log('שגיאה בייבוא הביקורת האחרונה:', error);
        setError(new AppError('כשל בייבוא הביקורת האחרונה. אנא נסה שוב מאוחר יותר.', 500, 'FETCH_LATEST_INSPECTION_ERROR'));
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
      console.log(`Starting new inspection for site ${selectedSite} and type ${selectedInspectionType}`);
      navigate(`/new-inspection/${selectedSite}/${selectedInspectionType}`);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'right' }}>
      {/* <Typography variant="h4" gutterBottom sx={{ mb: 4, color: 'primary.main' }}>
        דשבורד קצין הביטחון
      </Typography> */}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error.message}</Alert>}
      {loading ? (
        <Typography>טוען נתונים...</Typography>
      ) : (
        <Paper sx={{ p: 3, mb: 4, boxShadow: 3 }}>
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
                  {entrepreneur.username}
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
        </Paper>
      )}
    </Container>
  );
};

export default SecurityDashboard;