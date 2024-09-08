import React, { useState, useEffect } from 'react';
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Box } from '@mui/material';
import { getInspections } from '../services/api';
import { AppError } from '../utils/errorHandler';

function Inspections() {
  const [inspections, setInspections] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInspections = async () => {
      try {
        setLoading(true);
        const response = await getInspections();
        setInspections(response.data);
      } catch (error) {
        if (error instanceof AppError) {
          setError(`${error.errorCode}: ${error.message}`);
        } else {
          setError('An unexpected error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchInspections();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'right' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, color: 'primary.main' }}>
        ביקורות
      </Typography>
      <TableContainer component={Paper} elevation={3}>
        <Table dir="rtl">
          <TableHead>
            <TableRow>
              <TableCell>מזהה</TableCell>
              <TableCell>אתר</TableCell>
              <TableCell>סוג</TableCell>
              <TableCell>סטטוס</TableCell>
              <TableCell>תאריך</TableCell>
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