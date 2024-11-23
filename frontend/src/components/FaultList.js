import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  Paper, 
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
  onMaintenanceChange,
  onIntegratorChange,
  onDeleteFault,
  onTechnicianChange,
  maintenanceUsers,
  integratorUsers,
  onFaultUpdated
}) => {
  const { user } = useAuth();
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedFault, setSelectedFault] = useState(null);
  const [editingCell, setEditingCell] = useState(null);

  const canEditMaintenanceIntegrator = user.role === 'admin';
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

  const handleMaintenanceChange = async (event, faultId) => {
    if (onMaintenanceChange) {
      onMaintenanceChange(faultId, event.target.value);
    }
    setEditingCell(null);
  };

  const handleIntegratorChange = async (event, faultId) => {
    if (onIntegratorChange) {
      onIntegratorChange(faultId, event.target.value);
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

    const hours = Math.round((end - start) / (1000 * 60 * 60));
    return `${hours} שעות`;
  };

  return (
    <>
      <TableContainer component={Paper} sx={{ 
        backgroundColor: colors.background.darkGrey,
        border: `1px solid ${colors.border.grey}`
      }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>מתקן</TableCell>
              <TableCell>אחזקה</TableCell>
              <TableCell>אינטגרטור</TableCell>
              <TableCell>שם הטכנאי</TableCell>
              <TableCell>סוג התקלה</TableCell>
              <TableCell>תיאור התקלה</TableCell>
              <TableCell>תאריך פתיחה</TableCell>
              <TableCell>תאריך סגירה</TableCell>
              <TableCell>זמן טיפול</TableCell>
              <TableCell>סטטוס</TableCell>
              <TableCell>הערות</TableCell>
              {onDeleteFault && <TableCell>פעולות</TableCell>}
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
              faults.map((fault) => (
                <TableRow key={fault.id}>
                  <TableCell>
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
                    onClick={() => canEditMaintenanceIntegrator && onMaintenanceChange && handleCellClick(`maintenance-${fault.id}`)}
                    sx={{ 
                      cursor: canEditMaintenanceIntegrator && onMaintenanceChange ? 'pointer' : 'default',
                      '&:hover': canEditMaintenanceIntegrator && onMaintenanceChange ? {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)'
                      } : {}
                    }}
                  >
                    {editingCell === `maintenance-${fault.id}` ? (
                      <FormControl fullWidth size="small">
                        <Select
                          value={fault.maintenanceUser?.id || ''}
                          onChange={(e) => handleMaintenanceChange(e, fault.id)}
                          onBlur={() => setEditingCell(null)}
                          autoFocus
                        >
                          <MenuItem value="">
                            <em>ללא</em>
                          </MenuItem>
                          {maintenanceUsers.map(user => (
                            <MenuItem key={user.id} value={user.id}>
                              {`${user.firstName} ${user.lastName}`}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {!fault.maintenanceUser?.name && canEditMaintenanceIntegrator && onMaintenanceChange && (
                          <EditIcon sx={{ fontSize: 16, color: colors.text.grey }} />
                        )}
                        <span style={{ color: fault.maintenanceUser?.name ? colors.text.white : colors.text.grey }}>
                          {fault.maintenanceUser?.name || ''}
                        </span>
                      </Box>
                    )}
                  </TableCell>
                  <TableCell 
                    onClick={() => canEditMaintenanceIntegrator && onIntegratorChange && handleCellClick(`integrator-${fault.id}`)}
                    sx={{ 
                      cursor: canEditMaintenanceIntegrator && onIntegratorChange ? 'pointer' : 'default',
                      '&:hover': canEditMaintenanceIntegrator && onIntegratorChange ? {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)'
                      } : {}
                    }}
                  >
                    {editingCell === `integrator-${fault.id}` ? (
                      <FormControl fullWidth size="small">
                        <Select
                          value={fault.integratorUser?.id || ''}
                          onChange={(e) => handleIntegratorChange(e, fault.id)}
                          onBlur={() => setEditingCell(null)}
                          autoFocus
                        >
                          <MenuItem value="">
                            <em>ללא</em>
                          </MenuItem>
                          {integratorUsers.map(user => (
                            <MenuItem key={user.id} value={user.id}>
                              {`${user.firstName} ${user.lastName}`}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {!fault.integratorUser?.name && canEditMaintenanceIntegrator && onIntegratorChange && (
                          <EditIcon sx={{ fontSize: 16, color: colors.text.grey }} />
                        )}
                        <span style={{ color: fault.integratorUser?.name ? colors.text.white : colors.text.grey }}>
                          {fault.integratorUser?.name || ''}
                        </span>
                      </Box>
                    )}
                  </TableCell>
                  <TableCell 
                    onClick={() => canEditTechnicianAndStatus && onTechnicianChange && handleCellClick(`technician-${fault.id}`)}
                    sx={{ 
                      cursor: canEditTechnicianAndStatus && onTechnicianChange ? 'pointer' : 'default',
                      '&:hover': canEditTechnicianAndStatus && onTechnicianChange ? {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)'
                      } : {}
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
                      />
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {!fault.technician && canEditTechnicianAndStatus && onTechnicianChange && (
                          <EditIcon sx={{ fontSize: 16, color: colors.text.grey }} />
                        )}
                        <span style={{ color: fault.technician ? colors.text.white : colors.text.grey }}>
                          {fault.technician || ''}
                        </span>
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>{fault.isCritical ? 'משביתה' : 'לא משביתה'}</TableCell>
                  <TableCell>{fault.type}</TableCell>
                  <TableCell>
                    {new Date(fault.reportedTime).toLocaleDateString('he-IL')}
                  </TableCell>
                  <TableCell>
                    {fault.closedTime ? new Date(fault.closedTime).toLocaleDateString('he-IL') : ''}
                  </TableCell>
                  <TableCell>
                    {calculateTreatmentTime(fault)}
                  </TableCell>
                  <TableCell 
                    onClick={() => canEditTechnicianAndStatus && onStatusChange && handleCellClick(`status-${fault.id}`)}
                    sx={{ 
                      cursor: canEditTechnicianAndStatus && onStatusChange ? 'pointer' : 'default',
                      '&:hover': canEditTechnicianAndStatus && onStatusChange ? {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)'
                      } : {}
                    }}
                  >
                    {editingCell === `status-${fault.id}` ? (
                      <FormControl fullWidth size="small">
                        <Select
                          value={fault.status}
                          onChange={(e) => handleStatusChange(e, fault.id)}
                          onBlur={() => setEditingCell(null)}
                          autoFocus
                        >
                          {FAULT_STATUSES.map(status => (
                            <MenuItem key={status} value={status}>{status}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : (
                      fault.status
                    )}
                  </TableCell>
                  <TableCell>{fault.type === 'אחר' ? fault.description : ''}</TableCell>
                  {onDeleteFault && (
                    <TableCell>
                      <IconButton
                        onClick={() => handleDeleteClick(fault)}
                        sx={{ color: colors.text.white }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

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
      name: PropTypes.string
    }),
    maintenanceUser: PropTypes.shape({
      id: PropTypes.number,
      name: PropTypes.string
    }),
    integratorUser: PropTypes.shape({
      id: PropTypes.number,
      name: PropTypes.string
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
  onMaintenanceChange: PropTypes.func,
  onIntegratorChange: PropTypes.func,
  onTechnicianChange: PropTypes.func,
  onDeleteFault: PropTypes.func,
  onFaultUpdated: PropTypes.func,
  maintenanceUsers: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired
  })).isRequired,
  integratorUsers: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired
  })).isRequired
};

export default FaultList;
