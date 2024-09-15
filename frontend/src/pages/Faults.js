import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { getFaultsBySite } from '../services/api';

const Faults = () => {
  const { siteId } = useParams();
  const [faults, setFaults] = useState([]);
  const [error, setError] = useState(null);

  const fetchFaults = useCallback(async () => {
    try {
      const response = await getFaultsBySite(siteId);
      setFaults(response.data);
    } catch (error) {
      console.error('Error fetching faults:', error);
      setError('Failed to fetch faults. Please try again later.');
    }
  }, [siteId]);

  useEffect(() => {
    fetchFaults();
  }, [fetchFaults]);

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'right' }}>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'right' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, color: 'primary.main' }}>
        תקלות באתר
      </Typography>
      <TableContainer component={Paper} sx={{ mb: 4, boxShadow: 3 }}>
        <Table dir="rtl">
          <TableHead>
            <TableRow>
              <TableCell>תיאור</TableCell>
              {/* <TableCell>חומרה</TableCell> */}
              <TableCell>סטטוס</TableCell>
              <TableCell>תאריך דיווח</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {faults.map((fault) => (
              <TableRow key={fault.id}>
                <TableCell>{fault.description}</TableCell>
                {/* <TableCell>{fault.severity}</TableCell> */}
                <TableCell>{fault.status}</TableCell>
                <TableCell>{new Date(fault.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default Faults;