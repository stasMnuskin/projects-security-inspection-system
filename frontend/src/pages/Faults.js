import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button } from '@mui/material';
import { getFaultsBySite } from '../services/api';
import { exportToPdf, exportToExcel } from '../utils/exportUtils';

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

  const handleExportPdf = () => {
    exportToPdf(faults, 'Site Name');
  };

  const handleExportExcel = () => {
    exportToExcel(faults, 'Site Name');
  };

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
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <Button variant="contained" color="primary" onClick={handleExportPdf} sx={{ mr: 2 }}>
          Export to PDF
        </Button>
        <Button variant="contained" color="primary" onClick={handleExportExcel}>
          Export to Excel
        </Button>
      </div>
      <TableContainer component={Paper} sx={{ mb: 4, boxShadow: 3 }}>
        <Table dir="rtl">
          <TableHead>
            <TableRow>
              <TableCell>תיאור</TableCell>
              <TableCell>משבית</TableCell>
              <TableCell>סטטוס</TableCell>
              <TableCell>מיקום</TableCell>
              <TableCell>תאריך דיווח</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {faults.map((fault) => (
              <TableRow key={fault.id}>
                <TableCell>{fault.description}</TableCell>
                <TableCell>{fault.disabling ? 'כן' : 'לא'}</TableCell>
                <TableCell>{fault.status}</TableCell>
                <TableCell>{fault.location}</TableCell>
                <TableCell>{new Date(fault.reportedTime).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default Faults;