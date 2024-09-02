import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, Button } from '@mui/material';
import { getInspections } from '../services/api';
import { dashboardStyles } from '../styles/dashboardStyles';
import { AppError } from '../utils/errorHandler';

function UserDashboard() {
  const [upcomingInspection, setUpcomingInspection] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUpcomingInspection = async () => {
      try {
        const response = await getInspections();
        const pendingInspections = response.data.filter(i => i.status === 'pending');
        setUpcomingInspection(pendingInspections[0]); // Get the first pending inspection
      } catch (error) {
        if (error instanceof AppError) {
          setError(`${error.errorCode}: ${error.message}`);
        } else {
          setError('An unexpected error occurred');
        }
      }
    };
    fetchUpcomingInspection();
  }, []);
  
  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Container sx={dashboardStyles.container}>
      <Typography variant="h4" gutterBottom>User Dashboard</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        <Paper sx={dashboardStyles.paper}>
          <Typography variant="h6" color="primary">Upcoming Inspection</Typography>
          {upcomingInspection ? (
            <>
              <Typography>{`Site: ${upcomingInspection.Site?.name}`}</Typography>
              <Typography>{`Date: ${new Date(upcomingInspection.scheduledDate).toLocaleDateString()}`}</Typography>
              <Button variant="contained" color="primary" sx={{ mt: 2 }}>
                Start Inspection
              </Button>
            </>
          ) : (
            <Typography>No upcoming inspections</Typography>
          )}
        </Paper>
      </Box>
    </Container>
  );
}

export default UserDashboard;