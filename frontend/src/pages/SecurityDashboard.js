import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, FormControl, InputLabel, Select, MenuItem, Button } from '@mui/material';
import { getEntrepreneurs, getSites, getInspectionTypes, createInspection } from '../services/api';
import { dashboardStyles } from '../styles/dashboardStyles';

function SecurityDashboard() {
  const [entrepreneurs, setEntrepreneurs] = useState([]);
  const [sites, setSites] = useState([]);
  const [inspectionTypes, setInspectionTypes] = useState([]);
  const [selectedEntrepreneur, setSelectedEntrepreneur] = useState('');
  const [selectedSite, setSelectedSite] = useState('');
  const [selectedInspectionType, setSelectedInspectionType] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const entrepreneursData = await getEntrepreneurs();
      setEntrepreneurs(entrepreneursData.data);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchSites = async () => {
      if (selectedEntrepreneur) {
        const sitesData = await getSites(selectedEntrepreneur);
        setSites(sitesData.data);
      } else {
        setSites([]);
      }
      setSelectedSite('');
    };
    fetchSites();
  }, [selectedEntrepreneur]);

  useEffect(() => {
    const fetchInspectionTypes = async () => {
      if (selectedSite) {
        const inspectionTypesData = await getInspectionTypes(selectedSite);
        setInspectionTypes(inspectionTypesData.data);
      } else {
        setInspectionTypes([]);
      }
      setSelectedInspectionType('');
    };
    fetchInspectionTypes();
  }, [selectedSite]);

  const handleCreateInspection = async () => {
    if (selectedEntrepreneur && selectedSite && selectedInspectionType) {
      try {
        await createInspection({
          entrepreneurId: selectedEntrepreneur,
          siteId: selectedSite,
          inspectionTypeId: selectedInspectionType
        });
        alert('Inspection created successfully');
        // Reset selections
        setSelectedEntrepreneur('');
        setSelectedSite('');
        setSelectedInspectionType('');
      } catch (error) {
        alert('Error creating inspection');
      }
    } else {
      alert('Please select all fields');
    }
  };

  return (
    <Container sx={dashboardStyles.container}>
      <Typography variant="h4" gutterBottom>Security Officer Dashboard</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <FormControl fullWidth>
          <InputLabel>Entrepreneur</InputLabel>
          <Select
            value={selectedEntrepreneur}
            onChange={(e) => setSelectedEntrepreneur(e.target.value)}
          >
            {entrepreneurs.map((entrepreneur) => (
              <MenuItem key={entrepreneur.id} value={entrepreneur.id}>{entrepreneur.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth disabled={!selectedEntrepreneur}>
          <InputLabel>Site</InputLabel>
          <Select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
          >
            {sites.map((site) => (
              <MenuItem key={site.id} value={site.id}>{site.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth disabled={!selectedSite}>
          <InputLabel>Inspection Type</InputLabel>
          <Select
            value={selectedInspectionType}
            onChange={(e) => setSelectedInspectionType(e.target.value)}
          >
            {inspectionTypes.map((type) => (
              <MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="contained" color="primary" onClick={handleCreateInspection} disabled={!selectedInspectionType}>
          Create Inspection
        </Button>
      </Box>
    </Container>
  );
}

export default SecurityDashboard;