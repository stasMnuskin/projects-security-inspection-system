import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Alert,
  Snackbar,
  CircularProgress,
  Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import { colors } from '../styles/colors';
import { dialogStyles } from '../styles/components';
import { 
  getInspectionTypes, 
  updateInspectionType, 
  createInspectionType,
  addCustomField,
  deleteInspectionType
} from '../services/api';

const InspectionTypeConfig = () => {
  // State for inspection types
  const [inspectionTypes, setInspectionTypes] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [newTypeName, setNewTypeName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // State for new drill type dialog
  const [showNewDrillTypeDialog, setShowNewDrillTypeDialog] = useState(false);
  const [newDrillType, setNewDrillType] = useState('');

  // State for new field dialog
  const [showNewFieldDialog, setShowNewFieldDialog] = useState(false);
  const [newField, setNewField] = useState({
    label: '',
    type: 'boolean'
  });

  // State for UI feedback
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Load inspection types
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        setIsLoading(true);
        const response = await getInspectionTypes();
        setInspectionTypes(response.data);
      } catch (error) {
        setError('שגיאה בטעינת סוגי ביקורת');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTypes();
  }, []);

  // Handle creating new type
  const handleCreateType = async () => {
    if (!newTypeName?.trim()) {
      setError('יש להזין שם לסוג הביקורת');
      return;
    }

    // Check if type already exists
    const exists = inspectionTypes.some(
      type => type.name.toLowerCase() === newTypeName.trim().toLowerCase()
    );
    if (exists) {
      setError('סוג ביקורת זה כבר קיים');
      return;
    }

    try {
      setIsLoading(true);
      const newType = {
        name: newTypeName.trim(),
        type: 'inspection',
        formStructure: []
      };

      const response = await createInspectionType(newType);
      setInspectionTypes(prev => [...prev, response.data]);
      setSelectedType(response.data);
      setNewTypeName('');
      setSuccess('סוג ביקורת נוסף בהצלחה');
    } catch (error) {
      console.error('Error creating inspection type:', error);
      setError('שגיאה בהוספת סוג ביקורת');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deleting type
  const handleDeleteType = async () => {
    if (!selectedType || selectedType.type === 'drill') return;

    try {
      setIsLoading(true);
      await deleteInspectionType(selectedType.id);
      setInspectionTypes(prev => prev.filter(type => type.id !== selectedType.id));
      setSelectedType(null);
      setSuccess('סוג ביקורת נמחק בהצלחה');
    } catch (error) {
      setError('שגיאה במחיקת סוג ביקורת');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle field toggle
  const handleFieldToggle = async (field) => {
    try {
      const updatedFields = selectedType.formStructure.map(f => 
        f.id === field.id ? { ...f, enabled: !f.enabled } : f
      );

      await updateInspectionType(selectedType.id, {
        ...selectedType,
        formStructure: updatedFields
      });

      setInspectionTypes(prev => prev.map(type => 
        type.id === selectedType.id 
          ? { ...type, formStructure: updatedFields }
          : type
      ));

      setSelectedType(prev => ({
        ...prev,
        formStructure: updatedFields
      }));

      setSuccess('השדה עודכן בהצלחה');
    } catch (error) {
      setError('שגיאה בעדכון השדה');
    }
  };

  // Handle field deletion
  const handleDeleteField = async (field) => {
    if (field.autoFill) return;

    try {
      const updatedFields = selectedType.formStructure.filter(f => f.id !== field.id);

      await updateInspectionType(selectedType.id, {
        ...selectedType,
        formStructure: updatedFields
      });

      setInspectionTypes(prev => prev.map(type => 
        type.id === selectedType.id 
          ? { ...type, formStructure: updatedFields }
          : type
      ));

      setSelectedType(prev => ({
        ...prev,
        formStructure: updatedFields
      }));

      setSuccess('השדה נמחק בהצלחה');
    } catch (error) {
      setError('שגיאה במחיקת השדה');
    }
  };

  // Handle adding new drill type
  const handleAddDrillType = async () => {
    if (!newDrillType?.trim()) {
      setError('יש להזין שם לסוג התרגיל');
      return;
    }

    try {
      setIsLoading(true);
      const drillType = inspectionTypes.find(type => type.type === 'drill');
      if (!drillType) {
        setError('לא נמצא סוג תרגיל');
        return;
      }

      const drillTypeField = drillType.formStructure.find(f => f.id === 'drill_type');
      if (!drillTypeField) {
        setError('לא נמצא שדה סוג תרגיל');
        return;
      }

      const updatedOptions = [...drillTypeField.options, newDrillType.trim()];
      const updatedFields = drillType.formStructure.map(field => 
        field.id === 'drill_type' 
          ? { ...field, options: updatedOptions }
          : field
      );

      await updateInspectionType(drillType.id, {
        ...drillType,
        formStructure: updatedFields
      });

      setInspectionTypes(prev => prev.map(type => 
        type.id === drillType.id 
          ? { ...type, formStructure: updatedFields }
          : type
      ));

      if (selectedType?.id === drillType.id) {
        setSelectedType(prev => ({
          ...prev,
          formStructure: updatedFields
        }));
      }

      setShowNewDrillTypeDialog(false);
      setNewDrillType('');
      setSuccess('סוג תרגיל נוסף בהצלחה');
    } catch (error) {
      setError('שגיאה בהוספת סוג תרגיל');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deleting drill type
  const handleDeleteDrillType = async (optionToDelete) => {
    try {
      setIsLoading(true);
      const drillType = inspectionTypes.find(type => type.type === 'drill');
      if (!drillType) {
        setError('לא נמצא סוג תרגיל');
        return;
      }

      const drillTypeField = drillType.formStructure.find(f => f.id === 'drill_type');
      if (!drillTypeField) {
        setError('לא נמצא שדה סוג תרגיל');
        return;
      }

      if (drillTypeField.options.length <= 1) {
        setError('לא ניתן למחוק את סוג התרגיל האחרון');
        return;
      }

      const updatedOptions = drillTypeField.options.filter(option => option !== optionToDelete);
      const updatedFields = drillType.formStructure.map(field => 
        field.id === 'drill_type' 
          ? { ...field, options: updatedOptions }
          : field
      );

      await updateInspectionType(drillType.id, {
        ...drillType,
        formStructure: updatedFields
      });

      setInspectionTypes(prev => prev.map(type => 
        type.id === drillType.id 
          ? { ...type, formStructure: updatedFields }
          : type
      ));

      if (selectedType?.id === drillType.id) {
        setSelectedType(prev => ({
          ...prev,
          formStructure: updatedFields
        }));
      }

      setSuccess('סוג תרגיל נמחק בהצלחה');
    } catch (error) {
      setError('שגיאה במחיקת סוג תרגיל');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle adding new field
  const handleAddField = async () => {
    if (selectedType.type === 'drill') return;

    if (!newField.label?.trim()) {
      setError('יש להזין שם לשדה');
      return;
    }

    try {
      setIsLoading(true);
      await addCustomField(selectedType.id, newField.label.trim(), newField.type, selectedType.type);

      // Refresh inspection types to get the updated data
      const response = await getInspectionTypes();
      setInspectionTypes(response.data);

      // Update selected type
      const updatedType = response.data.find(type => type.id === selectedType.id);
      if (updatedType) {
        setSelectedType(updatedType);
      }

      setShowNewFieldDialog(false);
      setNewField({ label: '', type: 'boolean' });
      setSuccess('השדה נוסף בהצלחה');
    } catch (error) {
      setError('שגיאה בהוספת שדה');
    } finally {
      setIsLoading(false);
    }
  };

return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ color: colors.text.white }}>
        איפיון ביקורת/תרגיל
      </Typography>

      <Box sx={{ display: 'flex', gap: 2 }}>
        {/* Types List */}
        <Paper sx={{ p: 2, width: 250, backgroundColor: colors.background.black }}>
          {/* Add New Type */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ color: colors.text.white, mb: 1 }}>
              הוספת סוג ביקורת חדש
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="הזן שם לסוג ביקורת"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: colors.text.white
                  }
                }}
              />
              <Button
                onClick={handleCreateType}
                disabled={isLoading || !newTypeName?.trim()}
                variant="contained"
                size="small"
                sx={{
                  backgroundColor: colors.background.orange,
                  '&:hover': {
                    backgroundColor: colors.background.darkOrange
                  },
                  minWidth: 'auto'
                }}
              >
                {isLoading ? <CircularProgress size={20} /> : 'הוסף'}
              </Button>
            </Box>
          </Box>

          <Divider sx={{ backgroundColor: colors.background.darkGrey, my: 2 }} />

          {/* Existing Types */}
          <Typography variant="subtitle2" sx={{ color: colors.text.white, mb: 1 }}>
            סוגי ביקורת קיימים
          </Typography>
          <List>
            {inspectionTypes
              .filter(type => type.type !== 'drill')
              .map(type => (
                <ListItem
                  key={type.id}
                  button
                  selected={selectedType?.id === type.id}
                  onClick={() => setSelectedType(type)}
                  sx={{
                    color: colors.text.white,
                    '&.Mui-selected': {
                      backgroundColor: colors.background.darkGrey
                    }
                  }}
                >
                  <ListItemText primary={type.name} />
                  {selectedType?.id === type.id && (
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={handleDeleteType}
                        disabled={isLoading}
                        sx={{ color: colors.text.orange }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
              ))}
          </List>

          <Divider sx={{ backgroundColor: colors.background.darkGrey, my: 2 }} />

          {/* Drill Types */}
          <Typography variant="subtitle2" sx={{ color: colors.text.white, mb: 1 }}>
            תרגילים
          </Typography>
          <List>
            {inspectionTypes
              .filter(type => type.type === 'drill')
              .map(type => (
                <ListItem
                  key={type.id}
                  button
                  selected={selectedType?.id === type.id}
                  onClick={() => setSelectedType(type)}
                  sx={{
                    color: colors.text.white,
                    '&.Mui-selected': {
                      backgroundColor: colors.background.darkGrey
                    }
                  }}
                >
                  <ListItemText primary={type.name} />
                </ListItem>
              ))}
          </List>
        </Paper>

        {/* Content Area */}
        {selectedType && (
          <Paper sx={{ p: 2, flexGrow: 1, backgroundColor: colors.background.black }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ color: colors.text.white }}>
                {selectedType.type === 'drill' ? 'סוגי תרגילים' : `שדות ${selectedType.name}`}
              </Typography>
              <Button
                onClick={() => selectedType.type === 'drill' ? setShowNewDrillTypeDialog(true) : setShowNewFieldDialog(true)}
                disabled={isLoading}
                sx={{
                  color: colors.text.orange,
                  '&:hover': {
                    backgroundColor: colors.background.darkGrey
                  }
                }}
              >
                {selectedType.type === 'drill' ? 'הוסף סוג תרגיל' : 'הוסף שדה'}
              </Button>
            </Box>

            <List>
              {selectedType.type === 'drill' ? (
                // Drill Types List
                selectedType.formStructure
                  .find(field => field.id === 'drill_type')
                  ?.options.map((option, index) => (
                    <ListItem
                      key={index}
                      sx={{
                        borderBottom: `1px solid ${colors.background.darkGrey}`,
                        color: colors.text.white
                      }}
                    >
                      <ListItemText primary={option} />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleDeleteDrillType(option)}
                          disabled={isLoading}
                          sx={{ color: colors.text.orange }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))
              ) : (
                // Inspection Fields List
                selectedType.formStructure.map(field => (
                  <ListItem
                    key={field.id}
                    sx={{
                      borderBottom: `1px solid ${colors.background.darkGrey}`,
                      color: colors.text.white
                    }}
                  >
                    <ListItemText
                      primary={field.label}
                      secondary={
                        <Typography variant="body2" sx={{ color: colors.text.grey }}>
                          {field.type === 'boolean' ? 'תקין/לא תקין' : 'טקסט'}
                          {field.autoFill ? ' (אוטומטי)' : ''}
                        </Typography>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        edge="end"
                        checked={field.enabled}
                        onChange={() => handleFieldToggle(field)}
                        disabled={isLoading}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: colors.background.orange
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: colors.background.orange
                          }
                        }}
                      />
                      {!field.autoFill && (
                        <IconButton
                          edge="end"
                          onClick={() => handleDeleteField(field)}
                          disabled={isLoading}
                          sx={{ color: colors.text.orange }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                ))
              )}
            </List>
          </Paper>
        )}
      </Box>

      {/* New Drill Type Dialog */}
      <Dialog
        open={showNewDrillTypeDialog}
        onClose={() => !isLoading && setShowNewDrillTypeDialog(false)}
        sx={dialogStyles.dialog}
      >
        <DialogTitle sx={dialogStyles.dialogTitle}>
          הוסף סוג תרגיל
          <IconButton
            onClick={() => !isLoading && setShowNewDrillTypeDialog(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: colors.text.grey,
              '&:hover': {
                color: colors.text.white,
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={dialogStyles.dialogContent}>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="שם התרגיל"
              value={newDrillType}
              onChange={(e) => setNewDrillType(e.target.value)}
              disabled={isLoading}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={dialogStyles.dialogActions}>
          <Button
            onClick={() => setShowNewDrillTypeDialog(false)}
            disabled={isLoading}
            sx={dialogStyles.cancelButton}
          >
            ביטול
          </Button>
          <Button
            onClick={handleAddDrillType}
            disabled={isLoading || !newDrillType?.trim()}
            variant="contained"
            sx={dialogStyles.submitButton}
          >
            {isLoading ? <CircularProgress size={24} /> : 'הוסף'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Field Dialog */}
      <Dialog
        open={showNewFieldDialog}
        onClose={() => !isLoading && setShowNewFieldDialog(false)}
        sx={dialogStyles.dialog}
      >
        <DialogTitle sx={dialogStyles.dialogTitle}>
          הוסף שדה חדש
          <IconButton
            onClick={() => !isLoading && setShowNewFieldDialog(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: colors.text.grey,
              '&:hover': {
                color: colors.text.white,
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={dialogStyles.dialogContent}>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="שם השדה"
              value={newField.label}
              onChange={(e) => setNewField(prev => ({ ...prev, label: e.target.value }))}
              disabled={isLoading}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth>
              <InputLabel>סוג שדה</InputLabel>
              <Select
                value={newField.type}
                onChange={(e) => setNewField(prev => ({ ...prev, type: e.target.value }))}
                disabled={isLoading}
              >
                <MenuItem value="boolean">תקין/לא תקין</MenuItem>
                <MenuItem value="textarea">טקסט</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={dialogStyles.dialogActions}>
          <Button
            onClick={() => setShowNewFieldDialog(false)}
            disabled={isLoading}
            sx={dialogStyles.cancelButton}
          >
            ביטול
          </Button>
          <Button
            onClick={handleAddField}
            disabled={isLoading || !newField.label?.trim()}
            variant="contained"
            sx={dialogStyles.submitButton}
          >
            {isLoading ? <CircularProgress size={24} /> : 'הוסף'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert
          onClose={() => setError(null)}
          severity="error"
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert
          onClose={() => setSuccess(null)}
          severity="success"
          sx={{ width: '100%' }}
        >
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InspectionTypeConfig;
