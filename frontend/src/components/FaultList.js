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
import { colors } from '../styles/colors';
import { dialogStyles } from '../styles/components';
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

  // const getOrganizationByType = (organizations, type) => {
  //   if (!organizations) return null;
  //   return organizations.find(org => org.type === type);
  // };

  const getStatusStyle = () => ({
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '0.875rem',
    backgroundColor: colors.background.darkGrey,
    border: `1px solid ${colors.border.orange}`,
    color: colors.text.white
  });

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
          sx={{ minWidth: '150px' }}
          placeholder="לחץ Enter לשמירה, Shift+Enter לשורה חדשה"
        />
      );
    }

    const content = (isLong = false) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {canEditDescription && (
          <EditIcon sx={{ fontSize: 16, color: colors.border.orange }} />
        )}
        <span style={{ 
          color: colors.text.white,
          cursor: isLong ? 'help' : 'inherit'
        }}>
          {fault.description ? (fault.description.length > MAX_TEXT_LENGTH ? truncateText(fault.description) : fault.description) : ''}
        </span>
      </Box>
    );

    return (
      <Box 
        onClick={() => canEditDescription && handleCellClick(`description-${fault.id}`, fault.description || '')}
        sx={{ 
          cursor: canEditDescription ? 'pointer' : 'default',
          '&:hover': canEditDescription ? {
            backgroundColor: 'rgba(255, 255, 255, 0.05)'
          } : {}
        }}
      >
        {fault.description && fault.description.length > MAX_TEXT_LENGTH ? (
          <Tooltip 
            title={
              <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                {fault.description}
              </Typography>
            }
            placement="top"
            arrow
            enterDelay={200}
            leaveDelay={200}
            PopperProps={{
              sx: {
                '& .MuiTooltip-tooltip': {
                  backgroundColor: colors.background.black,
                  border: `1px solid ${colors.border.grey}`,
                  borderRadius: '4px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  maxWidth: 400,
                  p: 1
                },
                '& .MuiTooltip-arrow': {
                  color: colors.background.black,
                  '&::before': {
                    border: `1px solid ${colors.border.grey}`,
                    backgroundColor: colors.background.black
                  }
                }
              }
            }}
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
      <Box sx={{ 
        width: '100%', 
        overflow: 'hidden',
        backgroundColor: colors.background.darkGrey,
        border: `1px solid ${colors.border.grey}`,
        borderRadius: '4px'
      }}>
        <TableContainer sx={{ 
          maxWidth: '100%',
          overflowX: 'auto',
          '&::-webkit-scrollbar': {
            height: '6px'
          },
          '&::-webkit-scrollbar-track': {
            background: colors.background.darkGrey
          },
          '&::-webkit-scrollbar-thumb': {
            background: colors.border.grey,
            borderRadius: '3px',
            '&:hover': {
              background: colors.border.orange
            }
          }
        }}>
          <Table sx={{ minWidth: { xs: '800px', md: '100%' } }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ whiteSpace: 'nowrap', minWidth: '120px' }}>מתקן</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap', minWidth: '120px' }}>שם הטכנאי</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap', minWidth: '100px' }}>רכיב</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap', minWidth: '100px' }}>סוג התקלה</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap', minWidth: '100px' }}>תאריך פתיחה</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap', minWidth: '100px' }}>תאריך סגירה</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap', minWidth: '100px' }}>זמן טיפול</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap', minWidth: '100px' }}>סטטוס</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap', minWidth: '150px' }}>הערות</TableCell>
                {onDeleteFault && <TableCell sx={{ whiteSpace: 'nowrap', minWidth: '80px' }}>פעולות</TableCell>}
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
                  // const maintenanceOrg = getOrganizationByType(fault.site?.serviceOrganizations, 'maintenance');
                  // const integratorOrg = getOrganizationByType(fault.site?.serviceOrganizations, 'integrator');

                  return (
                    <TableRow key={fault.id}>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <span
                          onClick={(e) => handleSiteClick(e, fault.site)}
                          style={{ 
                            color: colors.text.white,
                            textDecoration: 'underline',
                            cursor: 'pointer'
                          }}
                        >
                          {fault.site?.name || ''}
                        </span>
                      </TableCell>
                      <TableCell 
                        onClick={() => canEditTechnicianAndStatus && onTechnicianChange && handleCellClick(`technician-${fault.id}`, fault.technician)}
                        sx={{ 
                          cursor: canEditTechnicianAndStatus && onTechnicianChange ? 'pointer' : 'default',
                          '&:hover': canEditTechnicianAndStatus && onTechnicianChange ? {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)'
                          } : {},
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {editingCell === `technician-${fault.id}` ? (
                          <TextField
                            size="small"
                            value={editingTechnician}
                            onChange={(e) => setEditingTechnician(e.target.value)}
                            onBlur={() => handleTechnicianSave(fault.id)}
                            onKeyDown={(e) => handleTechnicianKeyDown(e, fault.id)}
                            autoFocus
                            fullWidth
                            sx={{ minWidth: '120px' }}
                            placeholder="לחץ Enter לשמירה"
                          />
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {canEditTechnicianAndStatus && onTechnicianChange && (
                              <EditIcon sx={{ fontSize: 16, color: colors.border.orange }} />
                            )}
                            <span style={{ color: colors.text.white }}>
                              {fault.technician || ''}
                            </span>
                          </Box>
                        )}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{fault.type}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{fault.isCritical ? 'משביתה' : 'לא משביתה'}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {new Date(fault.reportedTime).toLocaleDateString('he-IL')}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {fault.closedTime ? new Date(fault.closedTime).toLocaleDateString('he-IL') : ''}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {calculateTreatmentTime(fault)}
                      </TableCell>
                      <TableCell 
                        onClick={() => canEditTechnicianAndStatus && onStatusChange && handleCellClick(`status-${fault.id}`)}
                        sx={{ 
                          cursor: canEditTechnicianAndStatus && onStatusChange ? 'pointer' : 'default',
                          '&:hover': canEditTechnicianAndStatus && onStatusChange ? {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)'
                          } : {},
                          whiteSpace: 'nowrap'
                        }}
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
                          <span style={getStatusStyle()}>
                            {fault.status}
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        {renderDescription(fault)}
                      </TableCell>
                      {onDeleteFault && (
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          <IconButton
                            onClick={() => handleDeleteClick(fault)}
                            sx={{ color: colors.text.white }}
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
          <DialogContentText sx={{ color: colors.text.white }}>
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
