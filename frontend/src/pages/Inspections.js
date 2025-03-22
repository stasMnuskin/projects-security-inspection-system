import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Typography, 
  // Paper, 
  Box, 
  CircularProgress, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterBar from '../components/FilterBar';
import Sidebar from '../components/Sidebar';
// import Sidebar from '../components/Sidebar';
import { getInspections, getEnabledFields, deleteInspection } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { subMonths } from 'date-fns';
// import { colors } from '../styles/colors';
import { PERMISSIONS } from '../constants/roles';
import { 
  dialogStyles, 
  pageContainerStyles, 
  statusMessageStyles 
} from '../styles/components';
import {
  tableStyles,
  getCellStyle,
  getHeadCellStyle,
  formatDate,
} from '../styles/tableStyles';

// Helper to truncate text and add ellipsis
const truncateText = (text, maxLength = 15) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Render text with tooltip for longer content
const renderTooltipText = (value) => {
  if (!value || !value.trim() || value.length <= 15) return value;
  
  return (
    <Tooltip 
      title={
        <Typography sx={tableStyles.tooltipTypography}>
          {value}
        </Typography>
      }
      placement="top"
      arrow
      enterDelay={200}
      leaveDelay={200}
      PopperProps={tableStyles.tooltipProps}
    >
      <span style={tableStyles.truncatedText}>
        {truncateText(value)}
      </span>
    </Tooltip>
  );
};

const Inspections = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [inspections, setInspections] = useState([]);
  const [columns, setColumns] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [inspectionToDelete, setInspectionToDelete] = useState(null);
  const [error, setError] = useState(null);
  const location = useLocation();
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    sites: [], 
    startDate: subMonths(new Date(), 6),
    endDate: new Date(),
    securityOfficer: '',
    maintenance: '',
    integrator: ''
  });

  // Handle initial filters from navigation
  useEffect(() => {
    if (location.state?.initialFilters) {
      const { sites, ...otherFilters } = location.state.initialFilters;
      setFilters(prev => ({
        ...prev,
        ...otherFilters,
        sites: sites || []
      }));
    }
  }, [location.state]);

  // Load enabled fields for inspections when sites change
  const loadEnabledFields = useCallback(async (sites) => {
    try {
      if (!sites) return; 
      const response = await getEnabledFields(sites[0], 'inspection');
      const fields = response.data.fields;
      
      // Define the order of columns
      const orderedColumns = [
        { id: 'site', label: 'אתר', source: 'Site.name' },
        { id: 'securityOfficer', label: 'קב"ט' },
        { id: 'date', label: 'תאריך' },
        { id: 'time', label: 'שעה' },
        ...fields
          .filter(field => !['site', 'securityOfficer', 'date', 'time', 'notes'].includes(field.id))
          .map(field => ({
            id: field.id,
            label: field.label
          })),
        ...fields
          .filter(field => field.id === 'notes')
          .map(field => ({
            id: field.id,
            label: field.label
          })),
        ...(user.hasPermission(PERMISSIONS.ADMIN) ? [{ id: 'actions', label: 'פעולות' }] : [])
      ];

      setColumns(orderedColumns);
    } catch (error) {
      console.error('Error loading enabled fields:', error);
      // Set default columns if there's an error
      const defaultColumns = [
        { id: 'site', label: 'אתר', source: 'Site.name' },
        { id: 'securityOfficer', label: 'קב"ט' },
        { id: 'date', label: 'תאריך' },
        { id: 'time', label: 'שעה' },
        ...(user.hasPermission(PERMISSIONS.ADMIN) ? [{ id: 'actions', label: 'פעולות' }] : [])
      ];
      setColumns(defaultColumns);
    }
  }, [user]);

  useEffect(() => {
    loadEnabledFields(filters.sites);
  }, [filters.sites, loadEnabledFields]);

  // Handle delete click
  const handleDeleteClick = (inspection, event) => {
    event.stopPropagation();
    setInspectionToDelete(inspection);
    setDeleteDialogOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    try {
      await deleteInspection(inspectionToDelete.id);
      await fetchInspections();
      setDeleteDialogOpen(false);
      setInspectionToDelete(null);
    } catch (error) {
      console.error('Error deleting inspection:', error);
      setError('שגיאה במחיקת הביקורת');
    }
  };

  // Fetch inspections
  const fetchInspections = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = {
        type: 'inspection',
        sites: filters.sites || [],
        ...(filters.startDate && { startDate: filters.startDate.toISOString() }),
        ...(filters.endDate && { endDate: filters.endDate.toISOString() }),
        ...(filters.maintenance && { maintenanceOrg: filters.maintenance }),
        ...(filters.integrator && { integratorOrg: filters.integrator })
      };

      const response = await getInspections(queryParams);
      const filteredInspections = response || [];
      setInspections(filteredInspections);
      setError(null);
    } catch (error) {
      console.error('Error fetching inspections:', error);
      setInspections([]);
      setError('שגיאה בטעינת ביקורות');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const handleFilterChange = useCallback((field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Load data on mount and when filters change
  useEffect(() => {
    fetchInspections();
  }, [filters, fetchInspections]);

  const getValue = (inspection, column) => {
    if (column.source) {
      // Handle nested properties like 'Site.name'
      return column.source.split('.').reduce((obj, key) => obj?.[key], inspection);
    }
    return inspection.formData?.[column.id];
  };

  const formatValue = (value, fieldId) => {
    if (value === undefined || value === null) return '-';
    
    switch (fieldId) {
      case 'date':
        // Use the responsive date formatting utility
        return formatDate(value, window.innerWidth);
      case 'time':
        return value;
      default:
        if (typeof value === 'boolean') {
          return value ? 'תקין' : 'לא תקין';
        }
        if (value === 'תקין' || value === 'לא תקין') {
          return value;
        }
        // Apply tooltip to any text that's longer than 15 characters
        return renderTooltipText(value.toString());
    }
  };

  const getCellSizeForColumn = (columnId) => {
    if (columnId === 'date' || columnId === 'time') {
      return 'date';
    } else if (['notes', 'actions'].includes(columnId)) {
      return 'widest';
    } else if (['site', 'securityOfficer'].includes(columnId)) {
      return 'wider';
    } else {
      return 'default';
    }
  };

  const renderTable = () => {
    if (!columns.length) {
      return (
        <Typography variant="h6" align="center" sx={statusMessageStyles.noDataMessage}>
          טוען את מבנה הטבלה...
        </Typography>
      );
    }

    if (loading) {
      return (
        <Box sx={statusMessageStyles.loadingContainer}>
          <CircularProgress />
        </Box>
      );
    }

    if (inspections.length === 0) {
      return (
        <Typography variant="h6" align="center" sx={statusMessageStyles.noDataMessage}>
          לא נמצאו ביקורות בטווח התאריכים שנבחר
        </Typography>
      );
    }

    return (
      <Box sx={tableStyles.container}>
        <TableContainer sx={tableStyles.scrollContainer}>
          <Table sx={tableStyles.table}>
            <TableHead>
              <TableRow>
                {columns.map((column, index) => (
                  <TableCell 
                    key={`${column.id}-${index}`} 
                    sx={getHeadCellStyle(getCellSizeForColumn(column.id))}
                  >
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {inspections.map((inspection, rowIndex) => (
                <TableRow key={inspection.id || rowIndex}>
                  {columns.map((column, colIndex) => (
                    <TableCell 
                      key={`${column.id}-${rowIndex}-${colIndex}`} 
                      sx={getCellStyle(getCellSizeForColumn(column.id))}
                    >
                      {column.id === 'actions' && user.hasPermission(PERMISSIONS.ADMIN) ? (
                        <IconButton
                          onClick={(e) => handleDeleteClick(inspection, e)}
                          sx={{ color: 'white' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      ) : (
                        formatValue(getValue(inspection, column), column.id)
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  return (
    <Box sx={pageContainerStyles.container}>
      <Sidebar 
        activeSection="inspections"  
        userInfo={{ name: user.name }}
        onNewFault={() => navigate('/faults/new')}
      />
      <Box sx={pageContainerStyles.content}>
        <Typography variant="h4" sx={pageContainerStyles.title}>
          ביקורות
        </Typography>

        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          variant="inspections"
          userRole={user.role}
          disableAutoFetch={false}
        />

        {error ? (
          <Typography sx={statusMessageStyles.errorMessage}>
            {error}
          </Typography>
        ) : (
          renderTable()
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          sx={dialogStyles.dialog}
        >
          <DialogTitle sx={dialogStyles.dialogTitle}>
            אישור מחיקה
          </DialogTitle>
          <DialogContent sx={dialogStyles.dialogContent}>
            <Typography>
              האם אתה בטוח שברצונך למחוק את הביקורת?
            </Typography>
          </DialogContent>
          <DialogActions sx={dialogStyles.dialogActions}>
            <Button 
              onClick={() => setDeleteDialogOpen(false)}
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
      </Box>
    </Box>
  );
};

export default Inspections;
