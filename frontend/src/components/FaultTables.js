import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  Grid, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import { 
  KeyboardArrowLeft as NextIcon,
  KeyboardArrowRight as PrevIcon
} from '@mui/icons-material';
import { dashboardStyles } from '../styles/dashboardStyles';
import { useNavigate } from 'react-router-dom';
import { colors } from '../styles/colors';

const truncateText = (text, maxLength = 15) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const ROWS_PER_PAGE = 15;

const FaultTable = ({ title, headers, data, columns, onRowClick }) => {
  const [currentPage, setCurrentPage] = useState(0);

  const startIndex = currentPage * ROWS_PER_PAGE;
  const endIndex = startIndex + ROWS_PER_PAGE;
  const currentData = data.slice(startIndex, endIndex);
  
  const hasNextPage = endIndex < data.length;
  const hasPrevPage = currentPage > 0;

  const handleNextPage = (event) => {
    event.stopPropagation();
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = (event) => {
    event.stopPropagation();
    if (hasPrevPage) {
      setCurrentPage(prev => prev - 1);
    }
  };

  return (
    <Paper sx={dashboardStyles.faultTable}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6">{title}</Typography>
        <Box>
          {hasPrevPage && (
            <IconButton 
              onClick={handlePrevPage}
              size="small"
              sx={{ 
                color: colors.border.orange,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              <PrevIcon />
            </IconButton>
          )}
          {hasNextPage && (
            <IconButton 
              onClick={handleNextPage}
              size="small"
              sx={{ 
                color: colors.border.orange,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              <NextIcon />
            </IconButton>
          )}
        </Box>
      </Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {headers.map((header, index) => (
                <TableCell key={index}>{header}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {currentData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={headers.length} align="center">
                  אין נתונים להצגה
                </TableCell>
              </TableRow>
            ) : (
              currentData.map((row, rowIndex) => (
                <TableRow 
                  key={rowIndex}
                  onClick={() => onRowClick && onRowClick(row)}
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  {columns.map((column, index) => (
                    <TableCell key={index}>
                      {column === 'fault' ? (
                        title === 'תקלות נפוצות' ? (
                          <Box 
                            sx={{ 
                              color: colors.text.white
                            }}
                          >
                            {truncateText(row.fault)}
                          </Box>
                        ) : (
                          <Box 
                            sx={{ 
                              color: colors.text.white
                            }}
                          >
                            {truncateText(row.type === 'אחר' ? row.description : row.type)}
                          </Box>
                        )
                      ) : column === 'site' ? (
                        row.site?.name || ''
                      ) : column === 'serialNumber' ? (
                        startIndex + rowIndex + 1
                      ) : (
                        row[column]
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

const RowShape = PropTypes.shape({
  type: PropTypes.string,
  description: PropTypes.string,
  site: PropTypes.shape({
    name: PropTypes.string,
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }),
  count: PropTypes.number,
  serialNumber: PropTypes.number
});

FaultTable.propTypes = {
  title: PropTypes.string.isRequired,
  headers: PropTypes.arrayOf(PropTypes.string).isRequired,
  data: PropTypes.arrayOf(RowShape).isRequired,
  columns: PropTypes.arrayOf(PropTypes.string).isRequired,
  onRowClick: PropTypes.func
};

const FaultTables = ({ openFaults = [], criticalFaults = [] }) => {
  const navigate = useNavigate();

  const handleOpenFaultClick = (row) => {
    navigate('/faults', {
      state: {
        initialFilters: {
          id: row.id
        }
      }
    });
  };

  const handleCriticalFaultClick = (row) => {
    navigate('/faults', {
      state: {
        initialFilters: {
          id: row.id
        }
      }
    });
  };

  const tables = [
    {
      title: 'תקלות פתוחות',
      headers: ['מס"ד', 'אתר', 'תקלה'],
      columns: ['serialNumber', 'site', 'fault'],
      data: openFaults,
      onRowClick: handleOpenFaultClick
    },
    {
      title: 'תקלות משביתות',
      headers: ['מס"ד', 'אתר', 'תקלה'],
      columns: ['serialNumber', 'site', 'fault'],
      data: criticalFaults,
      onRowClick: handleCriticalFaultClick
    }
  ];

  return (
    <Grid container spacing={3}>
      {tables.map((table, index) => (
        <Grid item xs={12} md={6} key={index}>
          <FaultTable {...table} />
        </Grid>
      ))}
    </Grid>
  );
};

const FaultShape = PropTypes.shape({
  id: PropTypes.number.isRequired,
  type: PropTypes.string.isRequired,
  description: PropTypes.string,
  isCritical: PropTypes.bool,
  site: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired
  }).isRequired,
  serialNumber: PropTypes.number
});

FaultTables.propTypes = {
  openFaults: PropTypes.arrayOf(FaultShape),
  criticalFaults: PropTypes.arrayOf(FaultShape)
};

export default FaultTables;
