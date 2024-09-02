import React, { useState, useEffect } from 'react';
import { TextField, Container, Typography, Box, FormControl, InputLabel, Select, MenuItem, Button } from '@mui/material';
import { getEntrepreneurs, getSites, getInspectionTypes, createInspection, createFault } from '../services/api';
import { dashboardStyles } from '../styles/dashboardStyles';
import { AppError } from '../utils/errorHandler';

function SecurityDashboard() {
  const [entrepreneurs, setEntrepreneurs] = useState([]);
  const [sites, setSites] = useState([]);
  const [inspectionTypes, setInspectionTypes] = useState([]);
  const [selectedEntrepreneur, setSelectedEntrepreneur] = useState('');
  const [selectedSite, setSelectedSite] = useState('');
  const [selectedInspectionType, setSelectedInspectionType] = useState('');
  const [faultDescription, setFaultDescription] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try{const entrepreneursData = await getEntrepreneurs();
        setEntrepreneurs(entrepreneursData.data);
      } catch (error) {
        if (error instanceof AppError) {
          setError(`${error.errorCode}: ${error.message}`);
        } else {
          setError('An unexpected error occurred');
        }
      }
        
    };
    fetchData();
  }, []);
  
  useEffect(() => {

    const fetchSites = async () => {
      try{
        if (selectedEntrepreneur) {
          const sitesData = await getSites(selectedEntrepreneur);
          setSites(sitesData.data);
        } else {
          setSites([]);
        }
        setSelectedSite('');
      } catch (error) {
        if (error instanceof AppError) {
          setError(`${error.errorCode}: ${error.message}`);
        } else {
          setError('An unexpected error occurred');
        }
      }
    };

    fetchSites();
  }, [selectedEntrepreneur]);

  useEffect(() => {
    const fetchInspectionTypes = async () => {
      try {
        if (selectedSite) {
        const inspectionTypesData = await getInspectionTypes(selectedSite);
        setInspectionTypes(inspectionTypesData.data);
      } else {
        setInspectionTypes([]);
      }
      setSelectedInspectionType('');
    } catch (error) {
      if (error instanceof AppError) {
        setError(`${error.errorCode}: ${error.message}`);
      } else {
        setError('An unexpected error occurred');
      }
    }
      
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
    if (error instanceof AppError) {
      setError(`${error.errorCode}: ${error.message}`);
    } else {
      setError('An unexpected error occurred');
    }
  };

  const handleCreateFault = async () => {
    if (selectedSite && faultDescription) {
      try {
        await createFault({
          siteId: selectedSite,
          description: faultDescription,
          status: 'open'
        });
        alert('Fault reported successfully');
        setFaultDescription('');
      } catch (error) {
        if (error instanceof AppError) {
          setError(`${error.errorCode}: ${error.message}`);
        } else {
          setError('An unexpected error occurred while reporting the fault');
        }
      }
    } else {
      alert('Please select a site and provide a fault description');
    }
  };

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Container sx={dashboardStyles.container}>
      <Typography variant="h4" gutterBottom>Security Officer Dashboard</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
        <TextField
          label="Fault Description"
          multiline
          rows={4}
          value={faultDescription}
          onChange={(e) => setFaultDescription(e.target.value)}
        />
        <Button variant="contained" color="secondary" onClick={handleCreateFault}>
          Report Fault
        </Button>
      </Box>
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