import React, { useState, useEffect } from 'react';
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Box, Alert } from '@mui/material';
import { getInspections } from '../services/api';
import { useAuth } from '../context/AuthContext';

function Inspections() {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchInspections = async () => {
      try {
        setLoading(true);
        const response = await getInspections();
        setInspections(response.data);
        setError(null);
      } catch (error) {
        console.error('שגיאה בטעינת הביקורות:', error);
        setError('אירעה שגיאה בטעינת הביקורות. אנא נסה שנית מאוחר יותר.');
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

  const translateStatus = (status) => {
    const statusMap = {
      'pending': 'ממתין',
      'completed': 'הושלם',
      'requires_action': 'דורש טיפול'
    };
    return statusMap[status] || status;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'right' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, color: 'primary.main' }}>
        {user.role === 'inspector' ? 'הביקורות שלי' : 'ביקורות'}
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {inspections.length === 0 ? (
        <Typography>אין ביקורות להצגה</Typography>
      ) : (
        <TableContainer component={Paper} elevation={3}>
          <Table dir="rtl">
            <TableHead>
              <TableRow>
                <TableCell>מזהה</TableCell>
                <TableCell>אתר</TableCell>
                <TableCell>סוג ביקורת</TableCell>
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
                  <TableCell>{translateStatus(inspection.status)}</TableCell>
                  <TableCell>{new Date(inspection.createdAt).toLocaleDateString('he-IL')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
}

export default Inspections;