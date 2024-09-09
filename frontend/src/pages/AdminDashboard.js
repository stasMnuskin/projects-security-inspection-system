import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Paper, Button, TextField, Select, MenuItem, FormControl, InputLabel,
  Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Grid, Card, CardContent
} from '@mui/material';
import { getInspections, getSites, getEntrepreneurs, getUsers, createEntrepreneur, createSite, getAllFaults, getStatisticsBySite, getStatisticsByLocation } from '../services/api';
import { AppError } from '../utils/errorHandler';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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
  const [tabValue, setTabValue] = useState(0);
  const [faults, setFaults] = useState([]);
  const [siteStatistics, setSiteStatistics] = useState([]);
  const [locationStatistics, setLocationStatistics] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [inspections, sites, entrepreneurs, users, allFaults, siteStats, locationStats] = await Promise.all([
        getInspections(),
        getSites(),
        getEntrepreneurs(),
        getUsers(),
        getAllFaults(),
        getStatisticsBySite(),
        getStatisticsByLocation()
      ]);
      setStats({
        inspections: inspections.data.length,
        sites: sites.data.length,
        entrepreneurs: entrepreneurs.data.length,
        users: users.data.length
      });
      setEntrepreneurs(entrepreneurs.data);
      setFaults(allFaults.data);
      setSiteStatistics(siteStats.data);
      setLocationStatistics(locationStats.data);
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

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const renderFaultTable = () => (
    <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
      <Table dir="rtl">
        <TableHead>
          <TableRow>
            <TableCell>חומרה</TableCell>
            <TableCell>מיקום</TableCell>
            <TableCell>סטטוס</TableCell>
            <TableCell>זמן דיווח</TableCell>
            <TableCell>תיאור</TableCell>
            <TableCell>שם האתר</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {faults.map((fault) => (
            <TableRow key={fault.id}>
              <TableCell>{fault.severity}</TableCell>
              <TableCell>{fault.location}</TableCell>
              <TableCell>{fault.status}</TableCell>
              <TableCell>{new Date(fault.reportedTime).toLocaleString()}</TableCell>
              <TableCell>{fault.description}</TableCell>
              <TableCell>{fault.siteName}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderStatisticsCards = (stats) => (
    <Grid container spacing={3}>
      {stats.map((stat, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div">
                {stat.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                מספר תקלות: {stat.faultCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                תקלות פתוחות: {stat.openFaultCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                זמן תיקון ממוצע: {stat.averageRepairTime.toFixed(2)} שעות
              </Typography>
              <Typography variant="body2" color="text.secondary">
                חומרה ממוצעת: {stat.averageSeverity.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                תקלות חוזרות: {stat.recurringFaultCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                זמן תגובה ממוצע: {stat.averageResponseTime.toFixed(2)} שעות
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderStatisticsCharts = (stats) => {
    const chartData = {
      labels: stats.map(stat => stat.name),
      datasets: [
        {
          label: 'מספר תקלות',
          data: stats.map(stat => stat.faultCount),
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
        },
        {
          label: 'תקלות פתוחות',
          data: stats.map(stat => stat.openFaultCount),
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
        },
        {
          label: 'תקלות חוזרות',
          data: stats.map(stat => stat.recurringFaultCount),
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
        },
      ],
    };

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'סטטיסטיקות תקלות',
        },
      },
    };

    return <Bar data={chartData} options={options} />;
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
      <Tabs 
        value={tabValue} 
        onChange={handleTabChange} 
        centered
        sx={{ mb: 4 }}
      >
        <Tab label="תקלות" />
        <Tab label="סטטיסטיקות" />
        <Tab label="ניהול" />
      </Tabs>
      {tabValue === 0 && (
        <Box>
          <Typography variant="h5" sx={{ mb: 2 }}>כל התקלות</Typography>
          {renderFaultTable()}
        </Box>
      )}
      {tabValue === 1 && (
        <Box>
          <Typography variant="h5" sx={{ mb: 2 }}>סטטיסטיקות לפי אתר</Typography>
          {renderStatisticsCards(siteStatistics)}
          <Box mt={4}>
            {renderStatisticsCharts(siteStatistics)}
          </Box>
          <Typography variant="h5" sx={{ mt: 6, mb: 2 }}>סטטיסטיקות לפי מיקום</Typography>
          {renderStatisticsCards(locationStatistics)}
          <Box mt={4}>
            {renderStatisticsCharts(locationStatistics)}
          </Box>
        </Box>
      )}
      {tabValue === 2 && (
        <>
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
        </>
      )}
    </Container>
  );
}

export default AdminDashboard;