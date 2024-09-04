import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Select, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Grid } from '@mui/material';
import { getSitesByEntrepreneur, getFaultsBySite, getOpenFaultsByEntrepreneur, getRecentFaultsByEntrepreneur } from '../services/api';

function EntrepreneurDashboard() {
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [faults, setFaults] = useState([]);
  const [openFaults, setOpenFaults] = useState([]);
  const [recentFaults, setRecentFaults] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sitesResponse, openFaultsResponse, recentFaultsResponse] = await Promise.all([
          getSitesByEntrepreneur(),
          getOpenFaultsByEntrepreneur(),
          getRecentFaultsByEntrepreneur()
        ]);
        setSites(sitesResponse.data);
        setOpenFaults(openFaultsResponse.data);
        setRecentFaults(recentFaultsResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message || 'Failed to fetch data');
      }
    };

    fetchData();
  }, []);

  if (error) return <div>Error: {error}</div>;

  const handleSiteChange = async (event) => {
    const siteId = event.target.value;
    setSelectedSite(siteId);
    if (siteId) {
      try {
        const response = await getFaultsBySite(siteId);
        setFaults(response.data);
      } catch (error) {
        console.error('Error fetching faults:', error);
      }
    } else {
      setFaults([]);
    }
  };

  const renderFaultTable = (faults, title) => (
    <Box mb={4}>
      <Typography variant="h6" gutterBottom>{title}</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>תיאור</TableCell>
              <TableCell>חומרה</TableCell>
              <TableCell>מיקום</TableCell>
              <TableCell>סטטוס</TableCell>
              <TableCell>זמן דיווח</TableCell>
              <TableCell>שם האתר</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {faults.map((fault) => (
              <TableRow key={fault.id}>
                <TableCell>{fault.description}</TableCell>
                <TableCell>{fault.severity}</TableCell>
                <TableCell>{fault.location}</TableCell>
                <TableCell>{fault.status}</TableCell>
                <TableCell>{new Date(fault.reportedTime).toLocaleString()}</TableCell>
                <TableCell>{fault.siteName}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  return (
    <Container>
      <Typography variant="h4" gutterBottom>דשבורד יזם</Typography>
      {error && <Typography color="error">{error}</Typography>}
      <Box mb={4}>
        <Select
          value={selectedSite}
          onChange={handleSiteChange}
          displayEmpty
          fullWidth
        >
          <MenuItem value="">
            <em>בחר אתר</em>
          </MenuItem>
          {sites.map((site) => (
            <MenuItem key={site.id} value={site.id}>{site.name}</MenuItem>
          ))}
        </Select>
      </Box>
      <Grid container spacing={4}>
        <Grid item xs={12}>
          {renderFaultTable(recentFaults, '10 התקלות האחרונות בכל האתרים')}
        </Grid>
        <Grid item xs={12}>
          {renderFaultTable(openFaults, 'כל התקלות הפתוחות')}
        </Grid>
      </Grid>
      {selectedSite && renderFaultTable(faults, `תקלות באתר הנבחר: ${sites.find(site => site.id === selectedSite)?.name}`)}
    </Container>
  );
}

export default EntrepreneurDashboard;