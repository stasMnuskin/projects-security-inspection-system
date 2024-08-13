import React, { useState, useEffect } from 'react';
import { Container, Typography, Button, Grid, Paper, Box } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [inspections, setInspections] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInspections = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/inspections`, {
          headers: { 'x-auth-token': token }
        });
        setInspections(response.data);
      } catch (error) {
        console.error('Error fetching inspections', error.response?.data || error.message);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      }
    };

    fetchInspections();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleNewInspection = () => {
    navigate('/new-inspection');
  };

  return (
    <Container>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Button variant="contained" color="secondary" onClick={handleLogout}>
          Logout
        </Button>
      </Box>
      <Button variant="contained" color="primary" onClick={handleNewInspection} sx={{ mb: 3 }}>
        New Inspection
      </Button>
      <Grid container spacing={3}>
        {inspections.map((inspection) => (
          <Grid item xs={12} sm={6} md={4} key={inspection.id}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h6">{inspection.site}</Typography>
              <Typography>Type: {inspection.type}</Typography>
              <Typography>Status: {inspection.status}</Typography>
              <Typography>Date: {new Date(inspection.date).toLocaleDateString()}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Dashboard;