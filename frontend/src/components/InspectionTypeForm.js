import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Alert,
  Snackbar,
  FormControlLabel,
  Checkbox,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { colors } from '../styles/colors';
import { dialogStyles } from '../styles/components';
import { createInspectionType } from '../services/api';

const InspectionTypeForm = ({ onSuccess, onCancel }) => {
  // State for form data with auto fields
  const [formData, setFormData] = useState({
    name: '',
    type: 'inspection',
    formStructure: [
      // Auto fields
      { 
        id: 'site',
        label: 'אתר',
        type: 'text',
        autoFill: true,
        enabled: true,
        showInForm: false,
        required: true
      },
      { 
        id: 'securityOfficer',
        label: 'קב"ט',
        type: 'text',
        autoFill: true,
        enabled: true,
        showInForm: false,
        required: true
      },
      { 
        id: 'date',
        label: 'תאריך',
        type: 'date',
        autoFill: true,
        enabled: true,
        showInForm: false,
        required: true
      },
      { 
        id: 'time',
        label: 'שעה',
        type: 'time',
        autoFill: true,
        enabled: true,
        showInForm: false,
        required: true
      }
    ]
  });

  // State for new field
  const [newField, setNewField] = useState({
    label: '',
    type: 'text',
    required: false,
    options: []
  });

  // State for UI feedback
  const [error, setError] = useState(null);
  const [showFieldDialog, setShowFieldDialog] = useState(false);
  const [newOption, setNewOption] = useState('');

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle new field input changes
  const handleNewFieldChange = (field, value) => {
    setNewField(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle adding new option
  const handleAddOption = () => {
    if (newOption.trim()) {
      setNewField(prev => ({
        ...prev,
        options: [...prev.options, newOption.trim()]
      }));
      setNewOption('');
    }
  };

  // Handle removing option
  const handleRemoveOption = (index) => {
    setNewField(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  // Handle adding new field
  const handleAddField = () => {
    if (newField.label && newField.type) {
      const fieldId = newField.label
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^\w\s]/g, '')
        .replace(/[א-ת]/g, '');

      const field = {
        id: fieldId,
        label: newField.label,
        type: newField.type,
        required: newField.required,
        enabled: true,
        showInForm: true,
        fieldType: formData.type,
        ...(newField.type === 'select' && { options: newField.options })
      };

      setFormData(prev => ({
        ...prev,
        formStructure: [...prev.formStructure, field]
      }));

      setNewField({
        label: '',
        type: formData.type === 'drill' ? 'select' : 'text',
        required: false,
        options: []
      });
      setShowFieldDialog(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      await createInspectionType(formData);
      onSuccess();
    } catch (error) {
      setError(error.message);
    }
  };

  // Get visible fields (non-auto fields)
  const visibleFields = formData.formStructure.filter(field => !field.autoFill);

return (
    <Box>
      <Paper sx={{ p: 2, backgroundColor: colors.background.black }}>
        <Typography variant="h6" sx={{ color: colors.text.white, mb: 2 }}>
          יצירת סוג חדש
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="שם"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            required
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': dialogStyles.dialogContent['& .MuiInputBase-root'],
              '& .MuiInputLabel-root': dialogStyles.dialogContent['& .MuiInputLabel-root']
            }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel sx={{ color: colors.text.grey }}>סוג</InputLabel>
            <Select
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              sx={{
                ...dialogStyles.dialogContent['& .MuiInputBase-root'],
                '& .MuiSelect-icon': {
                  color: colors.text.grey
                }
              }}
            >
              <MenuItem value="inspection">ביקורת</MenuItem>
              <MenuItem value="drill">תרגיל</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="subtitle1" sx={{ color: colors.text.white, mb: 1 }}>
            שדות
          </Typography>

          {visibleFields.map((field, index) => (
            <Box key={index} sx={{ mb: 1, color: colors.text.white }}>
              {field.label} ({field.type})
              {field.type === 'select' && (
                <Typography variant="caption" sx={{ ml: 1, color: colors.text.grey }}>
                  [{field.options.join(', ')}]
                </Typography>
              )}
            </Box>
          ))}

          <Button
            onClick={() => setShowFieldDialog(true)}
            sx={{
              mt: 2,
              color: colors.text.orange,
              '&:hover': {
                backgroundColor: colors.background.darkGrey
              }
            }}
          >
            הוסף שדה
          </Button>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              onClick={onCancel}
              sx={dialogStyles.cancelButton}
            >
              ביטול
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={dialogStyles.submitButton}
            >
              צור
            </Button>
          </Box>
        </form>
      </Paper>

      {/* New Field Dialog */}
      <Dialog
        open={showFieldDialog}
        onClose={() => setShowFieldDialog(false)}
        sx={dialogStyles.dialog}
      >
        <DialogTitle sx={dialogStyles.dialogTitle}>
          הוסף שדה חדש
          <IconButton
            onClick={() => setShowFieldDialog(false)}
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
              onChange={(e) => handleNewFieldChange('label', e.target.value)}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>סוג שדה</InputLabel>
              <Select
                value={newField.type}
                onChange={(e) => handleNewFieldChange('type', e.target.value)}
              >
                {formData.type === 'drill' ? (
                  <>
                    <MenuItem value="select">בחירה מרשימה</MenuItem>
                    <MenuItem value="textarea">הערות</MenuItem>
                  </>
                ) : (
                  <>
                    <MenuItem value="text">טקסט קצר</MenuItem>
                    <MenuItem value="textarea">טקסט ארוך</MenuItem>
                    <MenuItem value="select">בחירה מרשימה</MenuItem>
                    <MenuItem value="boolean">כן/לא</MenuItem>
                    <MenuItem value="date">תאריך</MenuItem>
                    <MenuItem value="time">שעה</MenuItem>
                  </>
                )}
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Checkbox
                  checked={newField.required}
                  onChange={(e) => handleNewFieldChange('required', e.target.checked)}
                  sx={{
                    color: colors.text.grey,
                    '&.Mui-checked': {
                      color: colors.text.orange
                    }
                  }}
                />
              }
              label="שדה חובה"
              sx={{ color: colors.text.white }}
            />

            {newField.type === 'select' && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  אפשרויות בחירה
                </Typography>
                {newField.options.map((option, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography sx={{ flexGrow: 1 }}>{option}</Typography>
                    <Button
                      onClick={() => handleRemoveOption(index)}
                      sx={{ color: colors.text.orange }}
                    >
                      הסר
                    </Button>
                  </Box>
                ))}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    label="אפשרות חדשה"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                  />
                  <Button
                    onClick={handleAddOption}
                    sx={{
                      color: colors.text.orange,
                      '&:hover': {
                        backgroundColor: colors.background.darkGrey
                      }
                    }}
                  >
                    הוסף
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={dialogStyles.dialogActions}>
          <Button
            onClick={() => setShowFieldDialog(false)}
            sx={dialogStyles.cancelButton}
          >
            ביטול
          </Button>
          <Button
            onClick={handleAddField}
            variant="contained"
            sx={dialogStyles.submitButton}
          >
            הוסף
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Notification */}
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
    </Box>
  );
};

export default InspectionTypeForm;
