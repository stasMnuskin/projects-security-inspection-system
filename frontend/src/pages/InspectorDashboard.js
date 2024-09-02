import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  TextField,
  CircularProgress
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
      fetchInspections(); // Refresh the list
    } catch (error) {
      setError(new AppError('Failed to update inspection', 500, 'UPDATE_INSPECTION_ERROR'));
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Typography color="error">{error.message}</Typography>;
  }

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Inspector Dashboard</Typography>
      {inspections.length === 0 ? (
        <Typography>No inspections found.</Typography>
      ) : (
        <List>
          {inspections.map((inspection) => (
            <ListItem 
              key={inspection.id} 
              button 
              onClick={() => handleInspectionClick(inspection)}
            >
              <ListItemText 
                primary={`Inspection at ${inspection.Site?.name}`}
                secondary={`Status: ${inspection.status}, Date: ${new Date(inspection.createdAt).toLocaleDateString()}`}
              />
            </ListItem>
          ))}
        </List>
      )}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Inspection Details</DialogTitle>
        <DialogContent>
          <Typography>Site: {selectedInspection?.Site?.name}</Typography>
          <Typography>Date: {selectedInspection && new Date(selectedInspection.createdAt).toLocaleDateString()}</Typography>
          <Typography>Status: {selectedInspection?.status}</Typography>
          <TextField
            margin="dense"
            id="inspection-notes"
            label="Inspection Notes"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={inspectionNotes}
            onChange={(e) => setInspectionNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleUpdateInspection} color="primary">
            Complete Inspection
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default InspectorDashboard;