import React, { useState, useEffect, useCallback } from 'react';
import { 
  Typography, 
  Paper, 
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
import { getInspectionsBySite, getInspections, getEnabledFields, deleteInspection } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { subMonths } from 'date-fns';
import { colors } from '../styles/colors';
import { PERMISSIONS } from '../constants/roles';

const truncateText = (text, maxLength = 15) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const renderTooltipText = (value) => {
  if (!value || !value.trim() || value.length <= 15) return value;
  
  return (
    <Tooltip 
      title={
        <Typography sx={{ whiteSpace: 'pre-wrap' }}>
          {value}
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
      <span style={{ 
        cursor: 'help',
        borderBottom: `1px dotted ${colors.text.grey}`,
        color: colors.text.white
      }}>
        {truncateText(value)}
      </span>
    </Tooltip>
  );
};

const Inspections = () => {
  const [loading, setLoading] = useState(true);
  const [inspections, setInspections] = useState([]);
  const [columns, setColumns] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [inspectionToDelete, setInspectionToDelete] = useState(null);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    sites: null, // Use null to indicate initial state
    startDate: subMonths(new Date(), 6),
    endDate: new Date(),
    securityOfficer: '',
    maintenance: '',
    integrator: ''
  });
  const { user } = useAuth();

  // Load enabled fields for inspections when sites change
  const loadEnabledFields = useCallback(async (sites) => {
    try {
      if (!sites) return; // Only return if sites is null (initial state)
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
        type: 'inspection'
      };
      
      if (filters.startDate) {
        queryParams.startDate = filters.startDate.toISOString();
      }
      if (filters.endDate) {
        queryParams.endDate = filters.endDate.toISOString();
      }
      if (filters.maintenance) {
        queryParams.maintenanceOrg = filters.maintenance;
      }
      if (filters.integrator) {
        queryParams.integratorOrg = filters.integrator;
      }

      let response;
      if (filters.sites && filters.sites.length > 0) {
        // Fetch inspections for all selected sites
        const inspectionPromises = filters.sites.map(siteId => 
          getInspectionsBySite(siteId, queryParams)
        );
        const responses = await Promise.all(inspectionPromises);
        // Combine and deduplicate inspections from all sites
        response = Array.from(new Set(responses.flat()));
      } else {
        response = await getInspections();
      }

      const filteredInspections = (response || []).filter(item => item.type === 'inspection');
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

  // Fetch data when filters change
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
        return new Date(value).toLocaleDateString('he-IL');
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

  const renderTable = () => {
    if (!columns.length) {
      return (
        <Typography variant="h6" align="center" sx={{ color: colors.text.white }}>
          טוען את מבנה הטבלה...
        </Typography>
      );
    }

    if (loading) {
      return (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      );
    }

    if (inspections.length === 0) {
      return (
        <Typography variant="h6" align="center" sx={{ color: colors.text.white }}>
          לא נמצאו ביקורות בטווח התאריכים שנבחר
        </Typography>
      );
    }

    return (
      <TableContainer component={Paper} sx={{ mt: 2, backgroundColor: colors.background.black }}>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column, index) => (
                <TableCell key={`${column.id}-${index}`} sx={{ color: colors.text.white, fontWeight: 'bold' }}>
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {inspections.map((inspection, rowIndex) => (
              <TableRow key={inspection.id || rowIndex}>
                {columns.map((column, colIndex) => (
                  <TableCell key={`${column.id}-${rowIndex}-${colIndex}`} sx={{ color: colors.text.white }}>
                    {column.id === 'actions' && user.hasPermission(PERMISSIONS.ADMIN) ? (
                      <IconButton
                        onClick={(e) => handleDeleteClick(inspection, e)}
                        sx={{ 
                          color: colors.text.error,
                          '&:hover': {
                            color: colors.text.errorHover
                          }
                        }}
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
    );
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar 
        activeSection="inspections"  
        userInfo={{ name: user.name }}
      />
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h4" sx={{ color: colors.text.white, mb: 3 }}>
          ביקורות
        </Typography>

        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          variant="dashboard"
          userRole={user.role}
          disableAutoFetch={true}
        />

        {error ? (
          <Typography color="error" align="center" sx={{ mt: 2 }}>
            {error}
          </Typography>
        ) : (
          renderTable()
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          PaperProps={{
            sx: {
              backgroundColor: colors.background.black,
              color: colors.text.white
            }
          }}
        >
          <DialogTitle>אישור מחיקה</DialogTitle>
          <DialogContent>
            <Typography>
              האם אתה בטוח שברצונך למחוק את הביקורת?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setDeleteDialogOpen(false)}
              sx={{ color: colors.text.white }}
            >
              ביטול
            </Button>
            <Button 
              onClick={handleDeleteConfirm}
              sx={{ 
                color: colors.text.error,
                '&:hover': {
                  color: colors.text.errorHover
                }
              }}
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
