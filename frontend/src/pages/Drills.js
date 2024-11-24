import React, { useState, useEffect } from 'react';
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
  Container
} from '@mui/material';
import { getDrillsBySite } from '../services/api';
import FilterBar from '../components/FilterBar';
import Sidebar from '../components/Sidebar';
import { colors } from '../styles/colors';
import { useAuth } from '../context/AuthContext';

const Drills = () => {
  const { user } = useAuth();
  const [drills, setDrills] = useState([]);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    site: '',
    startDate: (() => {
      const date = new Date();
      date.setMonth(date.getMonth() - 6); // 6 months ago
      date.setHours(0, 0, 0, 0);
      return date;
    })(),
    endDate: (() => {
      const date = new Date();
      date.setHours(23, 59, 59, 999);
      return date;
    })(),
    drillType: '',
    securityOfficer: ''
  });

  // Columns configuration - Removed time column
  const columns = [
    { id: 'site', label: 'אתר', getValue: drill => drill.Site?.name },
    { id: 'securityOfficer', label: 'קב"ט', getValue: drill => drill.formData?.securityOfficer },
    { id: 'date', label: 'תאריך', getValue: drill => drill.formData?.date },
    { id: 'drill_type', label: 'סוג תרגיל', getValue: drill => drill.formData?.drill_type },
    { id: 'status', label: 'סטטוס', getValue: drill => drill.formData?.status },
    { id: 'notes', label: 'הערות', getValue: drill => drill.formData?.notes }
  ];

  // Format date for display
  const formatDate = (date) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Truncate text for display
  const truncateText = (text, maxLength = 15) => {  // Reduced from 30 to 20
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Format value for display
  const formatValue = (value, columnId) => {
    if (value === undefined || value === null) return '-';
    
    switch (columnId) {
      case 'date':
        return formatDate(value);
      case 'status':
        return value === 'תקין' 
          ? <span style={{ color: colors.text.success }}>תקין</span>
          : <span style={{ color: colors.text.error }}>לא תקין</span>;
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

  // Get value from drill object
  const getValue = (drill, column) => {
    return column.getValue(drill);
  };

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Fetch drills when filters change
  useEffect(() => {
    const fetchDrills = async () => {
      if (!filters.site) return;

      try {
        const response = await getDrillsBySite(filters.site, {
          startDate: filters.startDate.toISOString(),
          endDate: filters.endDate.toISOString(),
          type: 'drill',
          securityOfficer: filters.securityOfficer
        });

        // Sort drills by date in descending order
        const sortedDrills = (response || []).sort((a, b) => {
          const dateA = new Date(a.formData?.date);
          const dateB = new Date(b.formData?.date);
          return dateB - dateA;
        });

        // Filter by drill type on the frontend
        const filteredDrills = filters.drillType
          ? sortedDrills.filter(drill => drill.formData?.drill_type === filters.drillType)
          : sortedDrills;

        setDrills(filteredDrills);
        setError(null);
      } catch (error) {
        console.error('Error fetching drills:', error);
        setError('שגיאה בטעינת תרגילים');
        setDrills([]);
      }
    };

    fetchDrills();
  }, [filters]);

  // Render table
  const renderTable = () => {
    if (!filters.site) {
      return (
        <Typography variant="h6" align="center" sx={{ color: colors.text.white }}>
          בחרו אתר כדי לצפות בתרגילים
        </Typography>
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
          {filters.site && (
            <Typography variant="body1" sx={{ color: colors.text.grey }}>
              {`באתר ${filters.site}`}
            </Typography>
          )}
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
                    {formatValue(getValue(drill, column), column.id)}
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
          תרגילים
        </Typography>

        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          variant="drills"
        />
        {error ? (
          <Typography color="error" align="center" sx={{ mt: 2 }}>
            {error}
          </Typography>
        ) : (
          renderTable()
        )}
      </Container>
    </Box>
  );
};

export default Drills;
