import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import { getInspections, getSites, getEntrepreneurs, getUsers } from '../services/api';
import { dashboardStyles } from '../styles/dashboardStyles';

function AdminDashboard() {
  const [stats, setStats] = useState({
    inspections: 0,
    sites: 0,
    entrepreneurs: 0,
    users: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      const [inspections, sites, entrepreneurs, users] = await Promise.all([
        getInspections(),
        getSites(),
        getEntrepreneurs(),
        getUsers()
      ]);
      setStats({
        inspections: inspections.data.length,
        sites: sites.data.length,
        entrepreneurs: entrepreneurs.data.length,
        users: users.data.length
      });
    };
    fetchData();
  }, []);

  return (
    <Container sx={dashboardStyles.container}>
      <Typography variant="h4" gutterBottom>Admin Dashboard</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {Object.entries(stats).map(([key, value]) => (
          <Paper key={key} sx={dashboardStyles.paper}>
            <Typography variant="h6" color="primary">{key.charAt(0).toUpperCase() + key.slice(1)}</Typography>
            <Typography variant="h4">{value}</Typography>
          </Paper>
        ))}
      </Box>
    </Container>
  );
}

export default AdminDashboard;