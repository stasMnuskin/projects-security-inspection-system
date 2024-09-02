import React, { useState, useEffect } from 'react';
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { getInspections } from '../services/api';
import { AppError } from '../utils/errorHandler';

function Inspections() {
  const [inspections, setInspections] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInspections = async () => {
      try {
        const response = await getInspections();
        setInspections(response.data);
      } catch (error) {
        if (error instanceof AppError) {
          setError(`${error.errorCode}: ${error.message}`);
        } else {
          setError('An unexpected error occurred');
        }
      }
    };

    fetchInspections();
  }, []);

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Inspections
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Site</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inspections.map((inspection) => (
              <TableRow key={inspection.id}>
                <TableCell>{inspection.id}</TableCell>
                <TableCell>{inspection.Site?.name}</TableCell>
                <TableCell>{inspection.InspectionType?.name}</TableCell>
                <TableCell>{inspection.status}</TableCell>
                <TableCell>{new Date(inspection.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}

export default Inspections;