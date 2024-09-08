import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Button, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { getFaults, getSites, getLatestInspection } from '../services/api';

const SecurityDashboard = () => {
  const navigate = useNavigate();
  const [faults, setFaults] = useState([]);
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [latestInspection, setLatestInspection] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFaults();
    fetchSites();
  }, []);

  useEffect(() => {
    if (selectedSite) {
      fetchLatestInspection(selectedSite);
    }
  }, [selectedSite]);

  const fetchFaults = async () => {
    try {
      const response = await getFaults();
      setFaults(response.data);
    } catch (error) {
      console.error('Error fetching faults:', error);
      setError('Failed to fetch faults. Please try again later.');
    }
  };

  const fetchSites = async () => {
    try {
      const response = await getSites();
      setSites(response.data);
    } catch (error) {
      console.error('Error fetching sites:', error);
      setError('Failed to fetch sites. Please try again later.');
    }
  };

  const fetchLatestInspection = async (siteId) => {
    try {
      const response = await getLatestInspection(siteId);
      setLatestInspection(response.data);
    } catch (error) {
      console.error('Error fetching latest inspection:', error);
      setError('Failed to fetch latest inspection. Please try again later.');
    }
  };

  const handleReportFault = () => {
    navigate('/report-fault');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'right' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, color: 'primary.main' }}>
        דשבורד קצין הביטחון
      </Typography>
      {error && <Typography color="error">{error}</Typography>}
      <FormControl fullWidth sx={{ mb: 4 }}>
        <InputLabel>בחר אתר</InputLabel>
        <Select
          value={selectedSite}
          onChange={(e) => setSelectedSite(e.target.value)}
          label="בחר אתר"
        >
          {sites.map((site) => (
            <MenuItem key={site.id} value={site.id}>
              {site.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {latestInspection && (
        <Paper sx={{ p: 3, mb: 4, boxShadow: 3 }}>
          <Typography variant="h6" gutterBottom>ביקורת אחרונה</Typography>
          <Typography>תאריך: {new Date(latestInspection.date).toLocaleDateString()}</Typography>
          <Typography>סטטוס: {latestInspection.status}</Typography>
          <Typography>הערות: {latestInspection.notes}</Typography>
        </Paper>
      )}
      <TableContainer component={Paper} sx={{ mb: 4, boxShadow: 3 }}>
        <Table dir="rtl">
          <TableHead>
            <TableRow>
              <TableCell>אתר</TableCell>
              <TableCell>חומרה</TableCell>
              <TableCell>סטטוס</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {faults.map((fault) => (
              <TableRow key={fault.id}>
                <TableCell>{fault.siteName || 'N/A'}</TableCell>
                <TableCell>{fault.severity || 'N/A'}</TableCell>
                <TableCell>{fault.status || 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box display="flex" justifyContent="center">
        <Button 
          onClick={handleReportFault} 
          variant="contained" 
          color="primary"
          sx={{ borderRadius: '20px', px: 4 }}
        >
          דווח על תקלה
        </Button>
      </Box>
    </Container>
  );
};

export default SecurityDashboard;