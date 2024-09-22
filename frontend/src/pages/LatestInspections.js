import React, { useState, useEffect } from 'react';
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Box, Alert } from '@mui/material';
import { getLatestInspections } from '../services/api';

function LatestInspections() {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLatestInspections = async () => {
      try {
        setLoading(true);
        const response = await getLatestInspections();
        setInspections(response.data);
        setError(null);
      } catch (error) {
        console.error('שגיאה בטעינת הביקורות האחרונות:', error);
        setError('אירעה שגיאה בטעינת הביקורות האחרונות. אנא נסה שנית מאוחר יותר.');
      } finally {
        setLoading(false);
      }
    };

    fetchLatestInspections();
  }, []);

  const translateStatus = (status) => {
    const statusMap = {
      'pending': 'ממתין',
      'completed': 'הושלם',
      'requires_action': 'דורש טיפול'
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'right' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, color: 'primary.main' }}>
        ביקורות אחרונות
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {inspections.length === 0 ? (
        <Typography>אין ביקורות אחרונות להצגה</Typography>
      ) : (
        <TableContainer component={Paper} elevation={3}>
          <Table dir="rtl">
            <TableHead>
              <TableRow>
                <TableCell>אתר</TableCell>
                <TableCell>סוג ביקורת</TableCell>
                <TableCell>תאריך</TableCell>
                <TableCell>סטטוס</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {inspections.map((inspection) => (
                <TableRow key={inspection.id}>
                  <TableCell>{inspection.Site?.name}</TableCell>
                  <TableCell>{inspection.InspectionType?.name}</TableCell>
                  <TableCell>{new Date(inspection.createdAt).toLocaleDateString('he-IL')}</TableCell>
                  <TableCell>{translateStatus(inspection.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
}

export default LatestInspections;