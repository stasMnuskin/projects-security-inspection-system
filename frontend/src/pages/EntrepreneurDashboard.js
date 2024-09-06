import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Select, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Grid } from '@mui/material';
import { getSitesByEntrepreneur, getAllFaultsBySite, getOpenFaultsByEntrepreneur, getRecentFaultsByEntrepreneur, getRecurringFaultsByEntrepreneur } from '../services/api';

function EntrepreneurDashboard() {
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [siteFaults, setSiteFaults] = useState([]);
  const [openFaults, setOpenFaults] = useState([]);
  const [recentFaults, setRecentFaults] = useState([]);
  const [recurringFaults, setRecurringFaults] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sitesResponse, openFaultsResponse, recentFaultsResponse, recurringFaultsResponse] = await Promise.all([
          getSitesByEntrepreneur(),
          getOpenFaultsByEntrepreneur(),
          getRecentFaultsByEntrepreneur(),
          getRecurringFaultsByEntrepreneur()
        ]);
        setSites(sitesResponse.data);
        setOpenFaults(openFaultsResponse.data);
        setRecentFaults(recentFaultsResponse.data);
        setRecurringFaults(recurringFaultsResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message || 'Failed to fetch data');
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchSiteFaults = async () => {
      if (selectedSite) {
        try {
          const response = await getAllFaultsBySite(selectedSite);
          setSiteFaults(response.data);
        } catch (error) {
          console.error('Error fetching site faults:', error);
          setError(error.message || 'Failed to fetch site faults');
        }
      } else {
        setSiteFaults([]);
      }
    };

    fetchSiteFaults();
  }, [selectedSite]);

  if (error) return <div>Error: {error}</div>;

  const handleSiteChange = (event) => {
    setSelectedSite(event.target.value);
  };

  const renderFaultTable = (faults, title) => (
    <Box mb={4}>
      <Typography variant="h6" gutterBottom>{title}</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>חומרה</TableCell>
              <TableCell>מיקום</TableCell>
              <TableCell>סטטוס</TableCell>
              <TableCell>זמן דיווח</TableCell>
              <TableCell>שם האתר</TableCell>
              <TableCell>תיאור</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {faults.map((fault) => (
              <TableRow key={fault.id}>
                <TableCell>{fault.severity}</TableCell>
                <TableCell>{fault.location}</TableCell>
                <TableCell>{fault.status}</TableCell>
                <TableCell>{new Date(fault.reportedTime).toLocaleString()}</TableCell>
                <TableCell>{fault.siteName}</TableCell>
                <TableCell>{fault.description}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderRecurringFaultsTable = () => (
    <Box mb={4}>
      <Typography variant="h6" gutterBottom>תקלות חוזרות בחודש האחרון</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>חומרה</TableCell>
              <TableCell>מיקום</TableCell>
              <TableCell>תיאור</TableCell>
              <TableCell>מספר הופעות</TableCell>
              <TableCell>שם האתר</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recurringFaults.map((fault, index) => (
              <TableRow key={index}>
                <TableCell>{fault.severity}</TableCell>
                <TableCell>{fault.location}</TableCell>
                <TableCell>{fault.description}</TableCell>
                <TableCell>{fault.occurrences}</TableCell>
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
          {renderFaultTable(openFaults.slice(0, 10), '10 התקלות הפתוחות האחרונות')}
        </Grid>
        <Grid item xs={12}>
          {renderRecurringFaultsTable()}
        </Grid>
        <Grid item xs={12}>
          {renderFaultTable(recentFaults, '10 התקלות האחרונות בכל האתרים')}
        </Grid>
      </Grid>
      {selectedSite && renderFaultTable(siteFaults, `כל התקלות באתר הנבחר: ${sites.find(site => site.id === selectedSite)?.name}`)}
    </Container>
  );
}

export default EntrepreneurDashboard;