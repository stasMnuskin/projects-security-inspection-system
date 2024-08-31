import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import { getInspections, getSites, getEntrepreneurs } from '../services/api';

function Dashboard() {
  const [inspections, setInspections] = useState([]);
  const [sites, setSites] = useState([]);
  const [entrepreneurs, setEntrepreneurs] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [inspectionsRes, sitesRes, entrepreneursRes] = await Promise.all([
          getInspections(),
          getSites(),
          getEntrepreneurs()
        ]);
        setInspections(inspectionsRes.data);
        setSites(sitesRes.data);
        setEntrepreneurs(entrepreneursRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        <Paper sx={{ p: 2, flexGrow: 1, minWidth: '30%' }}>
          <Typography component="h2" variant="h6" color="primary" gutterBottom>
            Inspections
          </Typography>
          <Typography component="p" variant="h4">
            {inspections.length}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, flexGrow: 1, minWidth: '30%' }}>
          <Typography component="h2" variant="h6" color="primary" gutterBottom>
            Sites
          </Typography>
          <Typography component="p" variant="h4">
            {sites.length}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, flexGrow: 1, minWidth: '30%' }}>
          <Typography component="h2" variant="h6" color="primary" gutterBottom>
            Entrepreneurs
          </Typography>
          <Typography component="p" variant="h4">
            {entrepreneurs.length}
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}

export default Dashboard;