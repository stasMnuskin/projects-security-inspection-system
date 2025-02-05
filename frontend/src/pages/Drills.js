import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Tooltip,
  Container,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { getDrillsBySite, getInspections, deleteInspection } from '../services/api';
import FilterBar from '../components/FilterBar';
import Sidebar from '../components/Sidebar';
import { colors } from '../styles/colors';
import { useAuth } from '../context/AuthContext';
import { PERMISSIONS } from '../constants/roles';

const Drills = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [drills, setDrills] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [drillToDelete, setDrillToDelete] = useState(null);
  const [filters, setFilters] = useState({
    sites: [],
    startDate: (() => {
      const date = new Date();
      date.setMonth(date.getMonth() - 6);
      date.setHours(0, 0, 0, 0);
      return date;
    })(),
    endDate: (() => {
      const date = new Date();
      date.setHours(23, 59, 59, 999);
      return date;
    })(),
    drillType: '',
    securityOfficer: '',
    entrepreneur: ''
  });

  const columns = [
    { id: 'site', label: 'אתר', getValue: drill => drill.Site?.name },
    { id: 'securityOfficer', label: 'קב"ט', getValue: drill => drill.formData?.securityOfficer },
    { id: 'date', label: 'תאריך', getValue: drill => drill.formData?.date },
    { id: 'drill_type', label: 'סוג תרגיל', getValue: drill => drill.formData?.drill_type },
    { id: 'status', label: 'סטטוס', getValue: drill => drill.formData?.status },
    { id: 'notes', label: 'הערות', getValue: drill => drill.formData?.notes },
    ...(user.hasPermission(PERMISSIONS.ADMIN) ? [{ id: 'actions', label: 'פעולות' }] : [])
  ];

  const formatDate = (date) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const truncateText = (text, maxLength = 15) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

const formatValue = (value, columnId) => {
  if (value === undefined || value === null) return '-';
  
  switch (columnId) {
    case 'date':
      return formatDate(value);
    case 'status':
      switch (value) {
        case 'הצלחה':
          return <span>הצלחה</span>;
        case 'כישלון':
          return <span>כישלון</span>;
        case 'הצלחה חלקית':
          return <span>הצלחה חלקית</span>;
        default:
          return value;
      }
    case 'notes':
      if (!value.trim()) return '-';
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
            borderBottom: `1px dotted ${colors.text.grey}`
          }}>
            {truncateText(value)}
          </span>
        </Tooltip>
      );
    default:
      return value.toString();
  }
};

const getValue = (drill, column) => {
  return column.getValue(drill);
};

const fetchDrills = useCallback(async () => {
  try {
    setLoading(true);
  const queryParams = {
      type: 'drill'
    };
    
    if (filters.startDate) {
      queryParams.startDate = filters.startDate.toISOString();
    }
    if (filters.endDate) {
      queryParams.endDate = filters.endDate.toISOString();
    }
    if (filters.securityOfficer) {
      queryParams.securityOfficer = filters.securityOfficer;
    }
    if (filters.drillType) {
      queryParams.drillType = filters.drillType;
    }
    if (filters.entrepreneur) {
      queryParams.entrepreneur = filters.entrepreneur;
    }

    let response;
    if (filters.sites && filters.sites.length > 0) {
      // Fetch drills for all selected sites
      const drillPromises = filters.sites.map(siteId => 
        getDrillsBySite(siteId, queryParams)
      );
      const responses = await Promise.all(drillPromises);
      // Combine and deduplicate drills from all sites
      response = Array.from(new Set(responses.flat()));
    } else {
      response = await getInspections();
    }

    const filteredDrills = (response || [])
      .filter(item => {
        // First filter by type
        if (item.type !== 'drill') return false;
        
        // Then filter by drill type if specified
        if (filters.drillType && item.formData?.drill_type !== filters.drillType) {
          return false;
        }
        
        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.formData?.date);
        const dateB = new Date(b.formData?.date);
        return dateB - dateA;
      });

    setDrills(filteredDrills);
    setError(null);
  } catch (error) {
    console.error('Error fetching drills:', error);
    setError('שגיאה בטעינת תרגילים');
    setDrills([]);
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
  fetchDrills();
}, [filters, fetchDrills]);

const handleDeleteClick = (drill, event) => {
  event.stopPropagation();
  setDrillToDelete(drill);
  setDeleteDialogOpen(true);
};

const handleDeleteConfirm = async () => {
  try {
    await deleteInspection(drillToDelete.id);
    await fetchDrills();
    setDeleteDialogOpen(false);
    setDrillToDelete(null);
  } catch (error) {
    console.error('Error deleting drill:', error);
    setError('שגיאה במחיקת התרגיל');
  }
};

const renderTable = () => {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress sx={{ color: colors.primary.orange }} />
      </Box>
    );
  }

  if (drills.length === 0) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
          mt: 3
        }}
      >
        <Typography variant="h6" sx={{ color: colors.text.white }}>
          לא נמצאו תרגילים
        </Typography>
        <Typography variant="body1" sx={{ color: colors.text.grey }}>
          {`בטווח התאריכים ${formatDate(filters.startDate)} - ${formatDate(filters.endDate)}`}
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ backgroundColor: colors.background.black }}>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell 
                key={column.id} 
                sx={{ 
                  color: colors.text.white, 
                  fontWeight: 'bold',
                  backgroundColor: filters.drillType && column.id === 'drillType' 
                    ? colors.background.darkGrey 
                    : 'inherit'
                }}
              >
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {drills.map((drill) => (
            <TableRow 
              key={drill.id}
            >
              {columns.map((column) => (
                <TableCell 
                  key={`${drill.id}-${column.id}`} 
                  sx={{ 
                    color: colors.text.white,
                    backgroundColor: filters.drillType && column.id === 'drillType'
                      ? colors.background.darkGrey
                      : 'inherit'
                  }}
                >
                  {column.id === 'actions' && user.hasPermission(PERMISSIONS.ADMIN) ? (
                    <IconButton
                      onClick={(e) => handleDeleteClick(drill, e)}
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
                    formatValue(getValue(drill, column), column.id)
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
      activeSection="drills"
      userInfo={{ name: user.name }}
      onNewFault={() => navigate('/faults/new')}
    />
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom sx={{ color: colors.text.white }}>
        תרגילים
      </Typography>

      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        variant="drills"
        disableAutoFetch={true}
      />
      {error ? (
        <Typography color="error" align="center" sx={{ mt: 2 }}>
          {error}
        </Typography>
      ) : (
        renderTable()
      )}

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
            האם אתה בטוח שברצונך למחוק את התרגיל?
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

export default Drills;
