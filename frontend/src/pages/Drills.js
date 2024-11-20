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
  Tooltip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getDrillsBySite } from '../services/api';
import FilterBar from '../components/FilterBar';
import { colors } from '../styles/colors';

const Drills = () => {
  const navigate = useNavigate();
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
  const truncateText = (text, maxLength = 50) => {
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
            title={value}
            placement="top"
            arrow
            enterDelay={200}
            leaveDelay={0}
            enterNextDelay={200}
            sx={{
              '& .MuiTooltip-tooltip': {
                backgroundColor: colors.background.black,
                color: colors.text.white,
                fontSize: '0.875rem',
                padding: '8px 12px',
                maxWidth: 300,
                whiteSpace: 'pre-wrap'
              },
              '& .MuiTooltip-arrow': {
                color: colors.background.black
              }
            }}
          >
            <span style={{ 
              cursor: 'default',
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
          drillType: filters.drillType,
          securityOfficer: filters.securityOfficer
        });

        // Sort drills by date in descending order
        const sortedDrills = (response || []).sort((a, b) => {
          const dateA = new Date(a.formData?.date);
          const dateB = new Date(b.formData?.date);
          return dateB - dateA;
        });

        setDrills(sortedDrills);
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
                hover
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: `${colors.background.darkGrey}20`
                  }
                }}
                onClick={() => navigate(`/inspections/${drill.id}`)}
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
    <Box sx={{ p: 3 }}>
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
    </Box>
  );
};

export default Drills;
