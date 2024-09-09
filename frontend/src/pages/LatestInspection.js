import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Typography, Paper, Box } from '@mui/material';
import { getLatestInspection } from '../services/api';

const LatestInspection = () => {
  const { siteId, inspectionTypeId } = useParams();
  const [inspection, setInspection] = useState(null);
  const [error, setError] = useState(null);

  const fetchLatestInspection = useCallback(async () => {
    try {
      const response = await getLatestInspection(siteId, inspectionTypeId);
      setInspection(response.data);
    } catch (error) {
      console.error('Error fetching latest inspection:', error);
      setError('Failed to fetch the latest inspection. Please try again later.');
    }
  }, [siteId, inspectionTypeId]);

  useEffect(() => {
    fetchLatestInspection();
  }, [fetchLatestInspection]);

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'right' }}>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  if (!inspection) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'right' }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'right' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, color: 'primary.main' }}>
        ביקורת אחרונה
      </Typography>
      <Paper sx={{ p: 3, mb: 4, boxShadow: 3 }}>
        <Box mb={2}>
          <Typography variant="h6">תאריך: {new Date(inspection.createdAt).toLocaleDateString()}</Typography>
        </Box>
        <Box mb={2}>
          <Typography variant="h6">סוג ביקורת: {inspection.inspectionType.name}</Typography>
        </Box>
        <Box mb={2}>
          <Typography variant="h6">סטטוס: {inspection.status}</Typography>
        </Box>
        <Box>
          <Typography variant="h6">פרטים:</Typography>
          <Typography>{JSON.stringify(inspection.details, null, 2)}</Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default LatestInspection;