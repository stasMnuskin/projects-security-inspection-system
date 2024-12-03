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
  TextField
} from '@mui/material';
import { 
  Delete as DeleteIcon,
  Edit as EditIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { colors } from '../styles/colors';
import { dialogStyles } from '../styles/components';
import { useAuth } from '../context/AuthContext';

const FAULT_STATUSES = ['פתוח', 'בטיפול', 'סגור'];

const FaultList = ({ 
  faults, 
  onSiteClick, 
  onStatusChange, 
  onTechnicianChange,
  onDeleteFault,
  onFaultUpdated
}) => {
  const { user } = useAuth();
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedFault, setSelectedFault] = useState(null);
  const [editingCell, setEditingCell] = useState(null);

  const canEditTechnicianAndStatus = ['admin', 'integrator', 'maintenance'].includes(user.role);

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

  const handleTechnicianChange = async (event, faultId) => {
    if (onTechnicianChange) {
      onTechnicianChange(faultId, event.target.value);
    }
    setEditingCell(null);
  };

  const handleCellClick = (cellId) => {
    setEditingCell(cellId);
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

  const getOrganizationByType = (organizations, type) => {
    if (!organizations) return null;
    return organizations.find(org => org.type === type);
  };

  const getStatusStyle = () => ({
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '0.875rem',
    backgroundColor: colors.background.darkGrey,
    border: `1px solid ${colors.border.orange}`,
    color: colors.text.white
  });

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
                <TableCell sx={{ whiteSpace: 'nowrap', minWidth: '120px' }}>אחזקה</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap', minWidth: '120px' }}>אינטגרטור</TableCell>
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
                  const maintenanceOrg = getOrganizationByType(fault.site?.serviceOrganizations, 'maintenance');
                  const integratorOrg = getOrganizationByType(fault.site?.serviceOrganizations, 'integrator');

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
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <span style={{ color: colors.text.white }}>
                          {maintenanceOrg?.name || ''}
                        </span>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <span style={{ color: colors.text.white }}>
                          {integratorOrg?.name || ''}
                        </span>
                      </TableCell>

                      <TableCell 
                        onClick={() => canEditTechnicianAndStatus && onTechnicianChange && handleCellClick(`technician-${fault.id}`)}
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
                            value={fault.technician || ''}
                            onChange={(e) => handleTechnicianChange(e, fault.id)}
                            onBlur={() => setEditingCell(null)}
                            autoFocus
                            fullWidth
                            sx={{ minWidth: '120px' }}
                          />
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {!fault.technician && canEditTechnicianAndStatus && onTechnicianChange && (
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

                      <TableCell sx={{ 
                        maxWidth: '150px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {fault.type === 'אחר' ? fault.description : ''}
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
  onDeleteFault: PropTypes.func,
  onFaultUpdated: PropTypes.func
};

export default FaultList;
