import React, { useState, useEffect } from 'react';
import { 
  Container, 
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
  Button
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterBar from '../components/FilterBar';
import Sidebar from '../components/Sidebar';
import { getInspectionsBySite, getEnabledFields, deleteInspection } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { subMonths } from 'date-fns';
import { colors } from '../styles/colors';
import { PERMISSIONS } from '../constants/roles';

const Inspections = () => {
  const [loading, setLoading] = useState(true);
  const [inspections, setInspections] = useState([]);
  const [columns, setColumns] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [inspectionToDelete, setInspectionToDelete] = useState(null);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    site: '',
    startDate: subMonths(new Date(), 6),
    endDate: new Date(),
    securityOfficer: '',
    maintenance: '',
    integrator: ''
  });
  const { user } = useAuth();

  // Load enabled fields for inspections when site changes
  useEffect(() => {
    const loadEnabledFields = async () => {
      if (!filters.site) {
        setColumns([]);
        return;
      }
      
      try {
        const response = await getEnabledFields(filters.site, 'inspection');
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
          // Always add notes column last
          ...fields
            .filter(field => field.id === 'notes')
            .map(field => ({
              id: field.id,
              label: field.label
            })),
          // Add actions column for admin users
          ...(user.hasPermission(PERMISSIONS.ADMIN) ? [{ id: 'actions', label: 'פעולות' }] : [])
        ];

        setColumns(orderedColumns);
      } catch (error) {
        console.error('Error loading enabled fields:', error);
        setColumns([]);
      }
    };

    loadEnabledFields();
  }, [filters.site, user]);

  // Handle delete click
  const handleDeleteClick = (inspection, event) => {
    event.stopPropagation(); // Prevent event bubbling
    setInspectionToDelete(inspection);
    setDeleteDialogOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    try {
      await deleteInspection(inspectionToDelete.id);
      // Refresh inspections list
      const response = await getInspectionsBySite(filters.site, {
        startDate: filters.startDate,
        endDate: filters.endDate,
        type: 'inspection',
        maintenanceOrg: filters.maintenance,
        integratorOrg: filters.integrator
      });
      const filteredInspections = (response || []).filter(item => item.type === 'inspection');
      setInspections(filteredInspections);
      setDeleteDialogOpen(false);
      setInspectionToDelete(null);
    } catch (error) {
      console.error('Error deleting inspection:', error);
      setError('שגיאה במחיקת הביקורת');
    }
  };

  // Fetch inspections when filters change
  useEffect(() => {
    const fetchInspections = async () => {
      if (!filters.site) {
        setInspections([]);
        return;
      }

      try {
        setLoading(true);
        const response = await getInspectionsBySite(filters.site, {
          startDate: filters.startDate,
          endDate: filters.endDate,
          type: 'inspection',
          maintenanceOrg: filters.maintenance,
          integratorOrg: filters.integrator
        });

        // Filter out any drills that might have slipped through
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
    };

    fetchInspections();
  }, [filters]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

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
        // Handle boolean values consistently
        if (typeof value === 'boolean') {
          return value ? 'תקין' : 'לא תקין';
        }
        // Handle string boolean values
        if (value === 'תקין' || value === 'לא תקין') {
          return value;
        }
        return value.toString();
    }
  };

  const renderTable = () => {
    if (!filters.site) {
      return (
        <Typography variant="h6" align="center" sx={{ color: colors.text.white }}>
          בחרו אתר כדי לצפות בביקורות
        </Typography>
      );
    }

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
          לא נמצאו ביקורות לאתר זה בטווח התאריכים שנבחר
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
      <Container maxWidth="lg">
        <Typography variant="h4" gutterBottom sx={{ color: colors.text.white }}>
          ביקורות
        </Typography>

        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          variant="inspections"
          userRole={user.role}
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
      </Container>
    </Box>
  );
};

export default Inspections;
