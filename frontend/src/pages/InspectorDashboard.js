import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, List, ListItem, ListItemText, Button, Dialog, 
  DialogTitle, DialogContent, DialogActions, TextField, CircularProgress,
  Box, Paper
} from '@mui/material';
import { getInspections, updateInspection } from '../services/api';
import { AppError } from '../utils/errorHandler';

function InspectorDashboard() {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [inspectionNotes, setInspectionNotes] = useState('');

  useEffect(() => {
    fetchInspections();
  }, []);

  const fetchInspections = async () => {
    try {
      setLoading(true);
      const response = await getInspections();
      setInspections(response.data);
    } catch (error) {
      setError(new AppError('Failed to fetch inspections', 500, 'FETCH_INSPECTIONS_ERROR'));
    } finally {
      setLoading(false);
    }
  };

  const handleInspectionClick = (inspection) => {
    setSelectedInspection(inspection);
    setInspectionNotes(inspection.notes || '');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedInspection(null);
    setInspectionNotes('');
  };

  const handleUpdateInspection = async () => {
    try {
      await updateInspection(selectedInspection.id, {
        ...selectedInspection,
        notes: inspectionNotes,
        status: 'completed'
      });
      handleCloseDialog();
      fetchInspections();
    } catch (error) {
      setError(new AppError('Failed to update inspection', 500, 'UPDATE_INSPECTION_ERROR'));
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography color="error">{error.message}</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'right' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, color: 'primary.main' }}>
        דשבורד מפקח
      </Typography>
      {inspections.length === 0 ? (
        <Typography variant="h4" gutterBottom sx={{ mb: 4, color: 'primary.main' }}>לא נמצאו ביקורות.</Typography>
      ) : (
        <Paper elevation={3}>
          <List>
            {inspections.map((inspection) => (
              <ListItem 
                key={inspection.id} 
                button 
                onClick={() => handleInspectionClick(inspection)}
                divider
              >
                <ListItemText 
                  primary={`ביקורת באתר ${inspection.Site?.name}`}
                  secondary={`סטטוס: ${inspection.status}, תאריך: ${new Date(inspection.createdAt).toLocaleDateString()}`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>פרטי ביקורת</DialogTitle>
        <DialogContent>
        <Typography variant="h4" gutterBottom sx={{ mb: 4, color: 'primary.main' }}>אתר: {selectedInspection?.Site?.name}</Typography>
        <Typography variant="h4" gutterBottom sx={{ mb: 4, color: 'primary.main' }}>תאריך: {selectedInspection && new Date(selectedInspection.createdAt).toLocaleDateString()}</Typography>
        <Typography variant="h4" gutterBottom sx={{ mb: 4, color: 'primary.main' }}>סטטוס: {selectedInspection?.status}</Typography>
          <TextField
            margin="dense"
            id="inspection-notes"
            label="הערות ביקורת"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={inspectionNotes}
            onChange={(e) => setInspectionNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>ביטול</Button>
          <Button onClick={handleUpdateInspection} color="primary">
            סיים ביקורת
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default InspectorDashboard;