import React, { useState, useEffect } from 'react';
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { getSites } from '../services/api';
import { AppError } from '../utils/errorHandler';

function Sites() {
  const [sites, setSites] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const response = await getSites();
        setSites(response.data);
      } catch (error) {
        if (error instanceof AppError) {
          setError(`${error.errorCode}: ${error.message}`);
        } else {
          setError('An unexpected error occurred');
        }
      }
    };

    fetchSites();
  }, []);

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Sites
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Entrepreneur</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sites.map((site) => (
              <TableRow key={site.id}>
                <TableCell>{site.id}</TableCell>
                <TableCell>{site.name}</TableCell>
                <TableCell>{site.address}</TableCell>
                <TableCell>{site.Entrepreneur?.name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}

export default Sites;