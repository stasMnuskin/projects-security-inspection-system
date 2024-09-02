import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Select, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { getSitesByEntrepreneur, getFaultsBySite } from '../services/api';

function EntrepreneurDashboard() {
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [faults, setFaults] = useState([]);

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      const response = await getSitesByEntrepreneur();
      setSites(response.data);
    } catch (error) {
      console.error('Error fetching sites:', error);
    }
  };

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

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Entrepreneur Dashboard</Typography>
      <Box mb={2}>
        <Select
          value={selectedSite}
          onChange={handleSiteChange}
          displayEmpty
          fullWidth
        >
          <MenuItem value="">
            <em>Select a site</em>
          </MenuItem>
          {sites.map((site) => (
            <MenuItem key={site.id} value={site.id}>{site.name}</MenuItem>
          ))}
        </Select>
      </Box>
      {selectedSite && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Description</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Reported Time</TableCell>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
}

export default EntrepreneurDashboard;