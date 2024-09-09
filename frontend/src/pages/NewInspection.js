import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Paper, Button, FormControl, InputLabel, Select, MenuItem, TextField, Box, Grid } from '@mui/material';
import { createInspection } from '../services/api';
import { useTheme } from '@mui/material/styles';

const inspectionTypes = [
  { id: 1, name: 'ביקורת שגרתית' },
  { id: 2, name: 'ביקורת משטרה' },
  { id: 3, name: 'ביקורת משרד האנרגיה' },
  { id: 4, name: 'ביקורת תרגיל פנימי' },
];

const RoutineInspection = ({ onParameterChange }) => (
  <Grid container spacing={2}>
    <Grid item xs={12} md={6}>
      <TextField fullWidth label="גדר היקפית" onChange={(e) => onParameterChange('gaderHikeft', e.target.value)} margin="normal" required />
    </Grid>
    <Grid item xs={12} md={6}>
      <TextField fullWidth label="שער כניסה" onChange={(e) => onParameterChange('shaarKnisa', e.target.value)} margin="normal" required />
    </Grid>
    <Grid item xs={12} md={6}>
      <TextField fullWidth label="מבנה שומר" onChange={(e) => onParameterChange('mivnehShomer', e.target.value)} margin="normal" required />
    </Grid>
    <Grid item xs={12} md={6}>
      <TextField fullWidth label="תאורה היקפית" onChange={(e) => onParameterChange('teuraHikefit', e.target.value)} margin="normal" required />
    </Grid>
  </Grid>
);

const PoliceInspection = ({ onParameterChange }) => (
  <Grid container spacing={2}>
    <Grid item xs={12} md={6}>
      <TextField fullWidth label="שם השוטר" onChange={(e) => onParameterChange('officerName', e.target.value)} margin="normal" required />
    </Grid>
    <Grid item xs={12} md={6}>
      <TextField fullWidth label="מספר תג" onChange={(e) => onParameterChange('badgeNumber', e.target.value)} margin="normal" required />
    </Grid>
    <Grid item xs={12} md={6}>
      <TextField fullWidth label="תחנת משטרה" onChange={(e) => onParameterChange('policeStation', e.target.value)} margin="normal" required />
    </Grid>
    <Grid item xs={12} md={6}>
      <TextField fullWidth label="תאריך הביקורת" type="date" InputLabelProps={{ shrink: true }} onChange={(e) => onParameterChange('inspectionDate', e.target.value)} margin="normal" required />
    </Grid>
  </Grid>
);

const EnergyMinistryInspection = ({ onParameterChange }) => (
  <Grid container spacing={2}>
    <Grid item xs={12} md={6}>
      <TextField fullWidth label="שם המפקח" onChange={(e) => onParameterChange('inspectorName', e.target.value)} margin="normal" required />
    </Grid>
    <Grid item xs={12} md={6}>
      <TextField fullWidth label="תחום ביקורת" onChange={(e) => onParameterChange('inspectionArea', e.target.value)} margin="normal" required />
    </Grid>
    <Grid item xs={12} md={6}>
      <TextField fullWidth label="מספר רישיון" onChange={(e) => onParameterChange('licenseNumber', e.target.value)} margin="normal" required />
    </Grid>
    <Grid item xs={12} md={6}>
      <TextField fullWidth label="תאריך הביקורת" type="date" InputLabelProps={{ shrink: true }} onChange={(e) => onParameterChange('inspectionDate', e.target.value)} margin="normal" required />
    </Grid>
  </Grid>
);

const InternalDrillInspection = ({ onParameterChange }) => (
  <Grid container spacing={2}>
    <Grid item xs={12} md={6}>
      <TextField fullWidth label="סוג התרגיל" onChange={(e) => onParameterChange('drillType', e.target.value)} margin="normal" required />
    </Grid>
    <Grid item xs={12} md={6}>
      <TextField fullWidth label="מספר משתתפים" onChange={(e) => onParameterChange('participantCount', e.target.value)} type="number" margin="normal" required />
    </Grid>
    <Grid item xs={12} md={6}>
      <TextField fullWidth label="אחראי התרגיל" onChange={(e) => onParameterChange('drillManager', e.target.value)} margin="normal" required />
    </Grid>
    <Grid item xs={12} md={6}>
      <TextField fullWidth label="תאריך התרגיל" type="date" InputLabelProps={{ shrink: true }} onChange={(e) => onParameterChange('drillDate', e.target.value)} margin="normal" required />
    </Grid>
  </Grid>
);

const NewInspection = () => {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [selectedType, setSelectedType] = useState('');
  const [parameters, setParameters] = useState({});
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);

  const handleTypeChange = (event) => {
    setSelectedType(event.target.value);
    setParameters({});
  };

  const handleParameterChange = (key, value) => {
    setParameters(prev => ({ ...prev, [key]: value }));
  };

  const validateForm = () => {
    if (!selectedType) return false;
    const requiredParams = Object.values(parameters).filter(Boolean);
    return requiredParams.length >= 4 && notes.trim() !== '';
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setError('אנא מלא את כל השדות הנדרשים');
      return;
    }

    try {
      const inspectionData = {
        siteId: parseInt(siteId),
        inspectionTypeId: selectedType,
        details: {
          parameters: parameters,
          notes: notes
        },
        status: 'completed'
      };
      await createInspection(inspectionData);
      navigate('/inspections');
    } catch (error) {
      console.error('Error creating inspection:', error);
      setError('Failed to create inspection. Please try again.');
    }
  };

  const renderInspectionParameters = () => {
    switch(selectedType) {
      case 1:
        return <RoutineInspection onParameterChange={handleParameterChange} />;
      case 2:
        return <PoliceInspection onParameterChange={handleParameterChange} />;
      case 3:
        return <EnergyMinistryInspection onParameterChange={handleParameterChange} />;
      case 4:
        return <InternalDrillInspection onParameterChange={handleParameterChange} />;
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'right' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, color: theme.palette.primary.main }}>
        ביקורת חדשה
      </Typography>
      <Paper sx={{ p: 3, mb: 4, boxShadow: 3, backgroundColor: theme.palette.background.paper }}>
        <FormControl fullWidth margin="normal">
          <InputLabel id="inspection-type-label">סוג ביקורת</InputLabel>
          <Select
            labelId="inspection-type-label"
            value={selectedType}
            label="סוג ביקורת"
            onChange={handleTypeChange}
          >
            {inspectionTypes.map((type) => (
              <MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {renderInspectionParameters()}

        <TextField
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          label="הערות"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          margin="normal"
          required
        />
        <Box mt={2}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSubmit} 
            disabled={!validateForm()}
            sx={{ 
              backgroundColor: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              },
            }}
          >
            שמור ביקורת
          </Button>
        </Box>
      </Paper>
      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}
    </Container>
  );
};

export default NewInspection;
