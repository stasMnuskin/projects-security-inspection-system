import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {  
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Box,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { 
  Delete as DeleteIcon,
  Edit as EditIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { dialogStyles, dialogIconStyles } from '../styles/components';
import { 
  tableStyles, 
  getCellStyle, 
  getHeadCellStyle, 
  composeStyles,
  formatDate 
} from '../styles/tableStyles';
import { useAuth } from '../context/AuthContext';
import { PERMISSIONS } from '../constants/roles';

const FAULT_STATUSES = ['פתוח', 'בטיפול', 'סגור'];
const MAX_TEXT_LENGTH = 15;

const truncateText = (text, maxLength = MAX_TEXT_LENGTH) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const FaultList = ({ 
  faults, 
  onSiteClick, 
  onStatusChange, 
  onTechnicianChange,
  onDescriptionChange,
  onDeleteFault
}) => {
  const { user } = useAuth();
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedFault, setSelectedFault] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [editingDescription, setEditingDescription] = useState('');
  const [editingTechnician, setEditingTechnician] = useState('');

  const canEditTechnicianAndStatus = user.hasPermission(PERMISSIONS.UPDATE_FAULT_STATUS);
  const canEditDescription = ['admin', 'security_officer', 'integrator', 'maintenance'].includes(user.role);

  const handleDeleteClick = (fault) => {
    setSelectedFault(fault);
    setDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedFault && onDeleteFault) {
      onDeleteFault(selectedFault.id);
    }
    setDeleteDialog(false);
    setSelectedFault(null);
  };

  const handleStatusChange = async (event, faultId) => {
    if (onStatusChange) {
      onStatusChange(faultId, event.target.value);
    }
    setEditingCell(null);
  };

  const handleTechnicianSave = async (faultId) => {
    if (onTechnicianChange) {
      await onTechnicianChange(faultId, editingTechnician);
    }
    setEditingCell(null);
  };

  const handleTechnicianKeyDown = (event, faultId) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleTechnicianSave(faultId);
    }
  };

  const handleDescriptionChange = async (fault) => {
    try {
      if (onDescriptionChange) {
        await onDescriptionChange(fault.id, editingDescription);
      }
    } catch (error) {
      console.error('Error updating fault description:', error);
    }
    setEditingCell(null);
  };

  const handleDescriptionKeyDown = (event, fault) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleDescriptionChange(fault);
    }
  };

  const handleCellClick = (cellId, currentValue = '') => {
    setEditingCell(cellId);
    if (cellId.startsWith('description-')) {
      setEditingDescription(currentValue);
    } else if (cellId.startsWith('technician-')) {
      setEditingTechnician(currentValue || '');
    }
  };

  const handleSiteClick = (event, site) => {
    event.preventDefault();
    event.stopPropagation();
    if (site?.id) {
      onSiteClick(site.id);
    }
  };

  const calculateTreatmentTime = (fault) => {
    if (fault.status === 'פתוח') return '';

    const start = new Date(fault.reportedTime);
    const end = fault.status === 'סגור' 
      ? new Date(fault.closedTime)
      : new Date(fault.lastUpdatedTime);

    const diffInHours = (end - start) / (1000 * 60 * 60);
    const hours = Math.max(0, Math.round(diffInHours));
    return `${hours} שעות`;
  };

  const renderDescription = (fault) => {
    if (editingCell === `description-${fault.id}`) {
      return (
        <TextField
          multiline
          size="small"
          value={editingDescription}
          onChange={(e) => setEditingDescription(e.target.value)}
          onBlur={() => handleDescriptionChange(fault)}
          onKeyDown={(e) => handleDescriptionKeyDown(e, fault)}
          autoFocus
          fullWidth
          sx={tableStyles.cellFormField}
          placeholder="לחץ Enter לשמירה, Shift+Enter לשורה חדשה"
        />
      );
    }

    const content = (isLong = false) => (
      <Box sx={tableStyles.contentBox}>
        {canEditDescription && (
          <EditIcon sx={tableStyles.cellIcon} />
        )}
        <span style={tableStyles.textContent}>
          {fault.description ? (fault.description.length > MAX_TEXT_LENGTH ? truncateText(fault.description) : fault.description) : ''}
        </span>
      </Box>
    );

    return (
      <Box 
        onClick={() => canEditDescription && handleCellClick(`description-${fault.id}`, fault.description || '')}
        sx={canEditDescription ? tableStyles.editableCell : tableStyles.nonEditableCell}
      >
        {fault.description && fault.description.length > MAX_TEXT_LENGTH ? (
          <Tooltip 
            title={
              <Typography sx={tableStyles.tooltipTypography}>
                {fault.description}
              </Typography>
            }
            placement="top"
            arrow
            enterDelay={200}
            leaveDelay={200}
            PopperProps={tableStyles.tooltipProps}
          >
            {content(true)}
          </Tooltip>
        ) : (
          content(false)
        )}
      </Box>
    );
  };

  return (
    <>
      <Box sx={tableStyles.container}>
        <TableContainer sx={tableStyles.scrollContainer}>
          <Table sx={tableStyles.table}>
            <TableHead>
              <TableRow>
                <TableCell sx={getHeadCellStyle('wider')}>מתקן</TableCell>
                <TableCell sx={getHeadCellStyle('wider')}>שם הטכנאי</TableCell>
                <TableCell sx={getHeadCellStyle()}>רכיב</TableCell>
                <TableCell sx={getHeadCellStyle()}>סוג התקלה</TableCell>
                <TableCell sx={getHeadCellStyle('date')}>תאריך פתיחה</TableCell>
                <TableCell sx={getHeadCellStyle('date')}>תאריך סגירה</TableCell>
                <TableCell sx={getHeadCellStyle()}>זמן טיפול</TableCell>
                <TableCell sx={getHeadCellStyle()}>סטטוס</TableCell>
                <TableCell sx={getHeadCellStyle('widest')}>הערות</TableCell>
                {onDeleteFault && <TableCell sx={getHeadCellStyle('narrow')}>פעולות</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {faults.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} align="center">
                    אין תקלות להצגה
                  </TableCell>
                </TableRow>
              ) : (
                faults.map((fault) => {
                  return (
                    <TableRow key={fault.id}>
                      <TableCell sx={getCellStyle('wider')}>
                        <span
                          onClick={(e) => handleSiteClick(e, fault.site)}
                          style={tableStyles.linkCell}
                        >
                          {fault.site?.name || ''}
                        </span>
                      </TableCell>
                      <TableCell 
                        onClick={() => canEditTechnicianAndStatus && onTechnicianChange && handleCellClick(`technician-${fault.id}`, fault.technician)}
                        sx={getCellStyle('wider', canEditTechnicianAndStatus && onTechnicianChange)}
                      >
                        {editingCell === `technician-${fault.id}` ? (
                          <TextField
                            value={editingTechnician}
                            onChange={(e) => setEditingTechnician(e.target.value)}
                            onBlur={() => handleTechnicianSave(fault.id)}
                            onKeyDown={(e) => handleTechnicianKeyDown(e, fault.id)}
                            placeholder="לחץ Enter לשמירה"
                            sx={composeStyles(tableStyles.cellFormField, { minWidth: '120px' })}
                          />
                        ) : (
                          <Box sx={tableStyles.contentBox}>
                            {canEditTechnicianAndStatus && onTechnicianChange && (
                              <EditIcon sx={tableStyles.cellIcon} />
                            )}
                            <span style={tableStyles.textContent}>
                              {fault.technician || ''}
                            </span>
                          </Box>
                        )}
                      </TableCell>
                      <TableCell sx={getCellStyle()}>{fault.type}</TableCell>
                      <TableCell sx={getCellStyle()}>
                        {fault.isCritical ? 'משביתה' : 
                         fault.isPartiallyDisabling ? 'משביתה חלקית' : 
                         'לא משביתה'}
                      </TableCell>
                      <TableCell sx={getCellStyle('date')}>
                        {formatDate(fault.reportedTime, window.innerWidth)}
                      </TableCell>
                      <TableCell sx={getCellStyle('date')}>
                        {fault.closedTime ? formatDate(fault.closedTime, window.innerWidth) : ''}
                      </TableCell>
                      <TableCell sx={getCellStyle()}>
                        {calculateTreatmentTime(fault)}
                      </TableCell>
                      <TableCell 
                        onClick={() => canEditTechnicianAndStatus && onStatusChange && handleCellClick(`status-${fault.id}`)}
                        sx={getCellStyle('default', canEditTechnicianAndStatus && onStatusChange)}
                      >
                        {editingCell === `status-${fault.id}` ? (
                          <FormControl fullWidth size="small">
                            <Select
                              value={fault.status}
                              onChange={(e) => handleStatusChange(e, fault.id)}
                              onBlur={() => setEditingCell(null)}
                              autoFocus
                              sx={{ minWidth: '100px' }}
                            >
                              {FAULT_STATUSES.map(status => (
                                <MenuItem key={status} value={status}>{status}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        ) : (
                          <span style={tableStyles.statusBadge}>
                            {fault.status}
                          </span>
                        )}
                      </TableCell>

                      <TableCell sx={getCellStyle('widest')}>
                        {renderDescription(fault)}
                      </TableCell>
                      {onDeleteFault && (
                        <TableCell sx={composeStyles(getCellStyle('narrow'), tableStyles.actionsCell)}>
                          <IconButton
                            onClick={() => handleDeleteClick(fault)}
                            sx={{ color: 'white' }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Dialog
        open={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        sx={dialogStyles.dialog}
      >
        <DialogTitle sx={dialogStyles.dialogTitle}>
          מחיקת תקלה
          <IconButton
            onClick={() => setDeleteDialog(false)}
            sx={dialogIconStyles.closeButton}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={dialogStyles.dialogContent}>
          <DialogContentText sx={{ color: 'white' }}>
            האם אתה בטוח שברצונך למחוק את התקלה?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={dialogStyles.dialogActions}>
          <Button 
            onClick={() => setDeleteDialog(false)}
            sx={dialogStyles.cancelButton}
          >
            ביטול
          </Button>
          <Button 
            onClick={handleDeleteConfirm}
            variant="contained"
            sx={dialogStyles.submitButton}
          >
            מחק
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

FaultList.propTypes = {
  faults: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    site: PropTypes.shape({
      id: PropTypes.number,
      name: PropTypes.string,
      serviceOrganizations: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number,
        name: PropTypes.string,
        type: PropTypes.oneOf(['maintenance', 'integrator'])
      }))
    }),
    type: PropTypes.string.isRequired,
    description: PropTypes.string,
    technician: PropTypes.string,
    isCritical: PropTypes.bool.isRequired, 
    severity: PropTypes.oneOf(['non_disabling', 'partially_disabling', 'fully_disabling']),
    status: PropTypes.string.isRequired,
    reportedTime: PropTypes.string.isRequired,
    closedTime: PropTypes.string,
    lastUpdatedTime: PropTypes.string
  })).isRequired,
  onSiteClick: PropTypes.func.isRequired,
  onStatusChange: PropTypes.func,
  onTechnicianChange: PropTypes.func,
  onDescriptionChange: PropTypes.func,
  onDeleteFault: PropTypes.func
};

export default FaultList;
