import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, Button, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { getInspections, getSites, getEntrepreneurs, getUsers, createEntrepreneur, createSite } from '../services/api';
import { AppError } from '../utils/errorHandler';

function AdminDashboard() {
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    inspections: 0,
    sites: 0,
    entrepreneurs: 0,
    users: 0
  });
  const [entrepreneurs, setEntrepreneurs] = useState([]);
  const [newEntrepreneur, setNewEntrepreneur] = useState('');
  const [newSite, setNewSite] = useState({ name: '', entrepreneurId: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [inspections, sites, entrepreneurs, users] = await Promise.all([
        getInspections(),
        getSites(),
        getEntrepreneurs(),
        getUsers()
      ]);
      setStats({
        inspections: inspections.data.length,
        sites: sites.data.length,
        entrepreneurs: entrepreneurs.data.length,
        users: users.data.length
      });
      setEntrepreneurs(entrepreneurs.data);
    } catch (error) {
      if (error instanceof AppError) {
        setError(`${error.errorCode}: ${error.message}`);
      } else {
        setError('An unexpected error occurred');
      }
    }
  };

  const handleAddEntrepreneur = async () => {
    try {
      await createEntrepreneur({ name: newEntrepreneur });
      setNewEntrepreneur('');
      fetchData();
    } catch (error) {
      setError('Failed to add entrepreneur');
    }
  };

  const handleAddSite = async () => {
    try {
      await createSite(newSite);
      setNewSite({ name: '', entrepreneurId: '' });
      fetchData();
    } catch (error) {
      setError('Failed to add site');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'right' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, color: 'primary.main' }}>
        דשבורד מנהל
      </Typography>
      {error && <Typography color="error">{error}</Typography>}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center', mb: 4 }}>
        {Object.entries(stats).map(([key, value]) => (
          <Paper key={key} sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: 3, minWidth: '200px' }}>
            <Typography variant="h6" color="primary" sx={{ mb: 4, color: 'primary.main' }}>{key}</Typography>
            <Typography variant="h4" sx={{ mb: 4, color: 'primary.main' }}>{value}</Typography>
          </Paper>
        ))}
      </Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>הוסף יזם חדש</Typography>
        <TextField
          value={newEntrepreneur}
          onChange={(e) => setNewEntrepreneur(e.target.value)}
          label="שם היזם"
          variant="outlined"
          sx={{ mb: 2, width: '100%' }}
        />
        <Button onClick={handleAddEntrepreneur} variant="contained" color="primary">
          הוסף יזם
        </Button>
      </Box>
      <Box>
        <Typography variant="h5" sx={{ mb: 2 }}>הוסף אתר חדש</Typography>
        <TextField
          value={newSite.name}
          onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
          label="שם האתר"
          variant="outlined"
          sx={{ mb: 2, width: '100%' }}
        />
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>יזם</InputLabel>
          <Select
            value={newSite.entrepreneurId}
            onChange={(e) => setNewSite({ ...newSite, entrepreneurId: e.target.value })}
            label="יזם"
          >
            {entrepreneurs.map((entrepreneur) => (
              <MenuItem key={entrepreneur.id} value={entrepreneur.id}>
                {entrepreneur.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button onClick={handleAddSite} variant="contained" color="primary">
          הוסף אתר
        </Button>
      </Box>
    </Container>
  );
}

export default AdminDashboard;