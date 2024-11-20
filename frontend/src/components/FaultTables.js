import React from 'react';
import PropTypes from 'prop-types';
import { Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { dashboardStyles } from '../styles/dashboardStyles';

const FaultTable = ({ title, headers, data, columns }) => (
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
              <TableRow key={rowIndex}>
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
      name: PropTypes.string
    }),
    count: PropTypes.number,
    serialNumber: PropTypes.number
  })).isRequired,
  columns: PropTypes.arrayOf(PropTypes.string).isRequired
};

const FaultTables = ({ recurringFaults = [], openFaults = [], criticalFaults = [] }) => {
  const tables = [
    {
      title: 'תקלות נפוצות',
      headers: ['כמות', 'תקלה', 'מס"ד'],
      columns: ['count', 'fault', 'serialNumber'],
      data: recurringFaults
    },
    {
      title: 'תקלות פתוחות',
      headers: ['אתר', 'תקלה', 'מס"ד'],
      columns: ['site', 'fault', 'serialNumber'],
      data: openFaults
    },
    {
      title: 'תקלות משביתות',
      headers: ['אתר', 'תקלה', 'מס"ד'],
      columns: ['site', 'fault', 'serialNumber'],
      data: criticalFaults
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
      name: PropTypes.string
    })
  })),
  criticalFaults: PropTypes.arrayOf(PropTypes.shape({
    serialNumber: PropTypes.number,
    type: PropTypes.string,
    description: PropTypes.string,
    site: PropTypes.shape({
      name: PropTypes.string
    })
  }))
};

export default FaultTables;
