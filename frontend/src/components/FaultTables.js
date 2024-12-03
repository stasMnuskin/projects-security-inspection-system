import React from 'react';
import PropTypes from 'prop-types';
import { Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { dashboardStyles } from '../styles/dashboardStyles';
import { useNavigate } from 'react-router-dom';

const FaultTable = ({ title, headers, data, columns, onRowClick }) => (
  <Paper sx={dashboardStyles.faultTable}>
    <Typography variant="h6">{title}</Typography>
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
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={headers.length} align="center">
                אין נתונים להצגה
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, rowIndex) => (
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
                      row.type === 'אחר' ? row.description : row.type
                    ) : column === 'site' ? (
                      row.site?.name
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

FaultTable.propTypes = {
  title: PropTypes.string.isRequired,
  headers: PropTypes.arrayOf(PropTypes.string).isRequired,
  data: PropTypes.arrayOf(PropTypes.shape({
    type: PropTypes.string,
    description: PropTypes.string,
    site: PropTypes.shape({
      name: PropTypes.string,
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    }),
    count: PropTypes.number,
    serialNumber: PropTypes.number
  })).isRequired,
  columns: PropTypes.arrayOf(PropTypes.string).isRequired,
  onRowClick: PropTypes.func
};

const FaultTables = ({ recurringFaults = [], openFaults = [], criticalFaults = [] }) => {
  const navigate = useNavigate();

  const handleRecurringFaultClick = (row) => {
    const faultType = row.type === 'אחר' ? row.description : row.type;
    navigate('/faults', { 
      state: { 
        initialFilters: {
          faultType
        }
      }
    });
  };

  const handleOpenFaultClick = (row) => {
    navigate('/faults', {
      state: {
        initialFilters: {
          site: row.site.id,
          status: 'פתוח',
          faultType: row.type === 'אחר' ? row.description : row.type
        }
      }
    });
  };

  const handleCriticalFaultClick = (row) => {
    navigate('/faults', {
      state: {
        initialFilters: {
          site: row.site.id,
          status: 'פתוח',
          isCritical: true,
          faultType: row.type === 'אחר' ? row.description : row.type
        }
      }
    });
  };

  const tables = [
    {
      title: 'תקלות נפוצות',
      headers: ['מס"ד', 'תקלה', 'כמות'],
      columns: ['serialNumber', 'fault', 'count'],
      data: recurringFaults,
      onRowClick: handleRecurringFaultClick
    },
    {
      title: 'תקלות פתוחות',
      headers: ['מס"ד', 'תקלה', 'אתר'],
      columns: ['serialNumber', 'fault', 'site'],
      data: openFaults,
      onRowClick: handleOpenFaultClick
    },
    {
      title: 'תקלות משביתות',
      headers: ['מס"ד', 'תקלה', 'אתר'],
      columns: ['serialNumber', 'fault', 'site'],
      data: criticalFaults,
      onRowClick: handleCriticalFaultClick
    }
  ];

  return (
    <Grid container spacing={3}>
      {tables.map((table, index) => (
        <Grid item xs={12} md={4} key={index}>
          <FaultTable {...table} />
        </Grid>
      ))}
    </Grid>
  );
};

FaultTables.propTypes = {
  recurringFaults: PropTypes.arrayOf(PropTypes.shape({
    serialNumber: PropTypes.number,
    type: PropTypes.string,
    description: PropTypes.string,
    count: PropTypes.number
  })),
  openFaults: PropTypes.arrayOf(PropTypes.shape({
    serialNumber: PropTypes.number,
    type: PropTypes.string,
    description: PropTypes.string,
    site: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string
    })
  })),
  criticalFaults: PropTypes.arrayOf(PropTypes.shape({
    serialNumber: PropTypes.number,
    type: PropTypes.string,
    description: PropTypes.string,
    site: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string
    })
  }))
};

export default FaultTables;
