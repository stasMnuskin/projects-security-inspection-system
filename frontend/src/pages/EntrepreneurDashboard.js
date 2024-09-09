import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Select, MenuItem, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Paper, Tabs, Tab,
  useTheme, useMediaQuery, Grid, Card, CardContent
} from '@mui/material';
import { getSitesByEntrepreneur, getOpenFaultsBySite, getRecurringFaultsBySite, getOpenFaultsByEntrepreneur, getRecentFaultsByEntrepreneur, getRecurringFaultsByEntrepreneur, getStatisticsBySite, getStatisticsByLocation } from '../services/api';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function EntrepreneurDashboard() {
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [openFaults, setOpenFaults] = useState([]);
  const [recentFaults, setRecentFaults] = useState([]);
  const [recurringFaults, setRecurringFaults] = useState([]);
  const [siteStatistics, setSiteStatistics] = useState([]);
  const [locationStatistics, setLocationStatistics] = useState([]);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));  

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const sitesResponse = await getSitesByEntrepreneur();
        setSites(sitesResponse.data);
      } catch (error) {
        console.error('Error fetching sites:', error);
        setError(error.message || 'Failed to fetch sites');
      }
    };

    fetchSites();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (selectedSite) {
          const [openFaultsResponse, recurringFaultsResponse, siteStatsResponse, locationStatsResponse] = await Promise.all([
            getOpenFaultsBySite(selectedSite),
            getRecurringFaultsBySite(selectedSite),
            getStatisticsBySite(selectedSite),
            getStatisticsByLocation(selectedSite)
          ]);
          setOpenFaults(openFaultsResponse.data);
          setRecurringFaults(recurringFaultsResponse.data);
          setSiteStatistics(siteStatsResponse.data);
          setLocationStatistics(locationStatsResponse.data);
          setRecentFaults([]); 
        } else {
          const [openFaultsResponse, recentFaultsResponse, recurringFaultsResponse, allSiteStatsResponse, allLocationStatsResponse] = await Promise.all([
            getOpenFaultsByEntrepreneur(),
            getRecentFaultsByEntrepreneur(),
            getRecurringFaultsByEntrepreneur(),
            getStatisticsBySite(),
            getStatisticsByLocation()
          ]);
          setOpenFaults(openFaultsResponse.data);
          setRecentFaults(recentFaultsResponse.data);
          setRecurringFaults(recurringFaultsResponse.data);
          setSiteStatistics(allSiteStatsResponse.data);
          setLocationStatistics(allLocationStatsResponse.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message || 'Failed to fetch data');
      }
    };

    fetchData();
  }, [selectedSite]);

  if (error) return <div>Error: {error}</div>;

  const handleSiteChange = (event) => {
    setSelectedSite(event.target.value);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const renderFaultTable = (faults, title) => (
    <Box mb={4}>
      <Typography variant="h6" gutterBottom sx={{ mb: 4, color: 'primary.main' }}>{title}</Typography>
      <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
        <Table dir="rtl">
          <TableHead>
            <TableRow>
              <TableCell>חומרה</TableCell>
              <TableCell>מיקום</TableCell>
              <TableCell>סטטוס</TableCell>
              <TableCell>זמן דיווח</TableCell>
              <TableCell>תיאור</TableCell>
              {!selectedSite && <TableCell>שם האתר</TableCell>}
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
                {!selectedSite && <TableCell>{fault.siteName}</TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderRecurringFaultsTable = () => (
    <Box mb={4}>
      <Typography variant="h6" gutterBottom sx={{ mb: 4, color: 'primary.main' }}>תקלות חוזרות בחודש האחרון</Typography>
      <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
        <Table dir="rtl">
          <TableHead>
            <TableRow>
              <TableCell>חומרה</TableCell>
              <TableCell>מיקום</TableCell>
              <TableCell>תיאור</TableCell>
              <TableCell>מספר הופעות</TableCell>
              {!selectedSite && <TableCell>שם האתר</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {recurringFaults.map((fault, index) => (
              <TableRow key={index}>
                <TableCell>{fault.severity}</TableCell>
                <TableCell>{fault.location}</TableCell>
                <TableCell>{fault.description}</TableCell>
                <TableCell>{fault.occurrences}</TableCell>
                {!selectedSite && <TableCell>{fault.siteName}</TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
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
      <Typography variant="h5" sx={{ mb: 4, color: 'primary.main' }}>בחר אתר</Typography>
      {error && <Typography color="error">{error}</Typography>}
      <Box mb={4}>
        <Select
          value={selectedSite}
          onChange={handleSiteChange}
          displayEmpty
          fullWidth
          sx={{ backgroundColor: 'background.paper' }}
        >
          <MenuItem value="">
            <em>כל האתרים</em>
          </MenuItem>
          {sites.map((site) => (
            <MenuItem key={site.id} value={site.id}>{site.name}</MenuItem>
          ))}
        </Select>
      </Box>
      <Tabs 
        value={tabValue} 
        onChange={handleTabChange} 
        centered
        variant={isMobile ? "scrollable" : "standard"}
        scrollButtons="auto"
        >
        <Tab label="תקלות פתוחות" />
        <Tab label="תקלות אחרונות" />
        <Tab label="תקלות חוזרות" />
        <Tab label="סטטיסטיקות" />
      </Tabs>
      <Box mt={4}>
        {tabValue === 0 && renderFaultTable(openFaults, `תקלות פתוחות ${selectedSite ? `באתר: ${sites.find(site => site.id === selectedSite)?.name}` : 'בכל האתרים'}`)}
        {tabValue === 1 && !selectedSite && renderFaultTable(recentFaults, '10 התקלות האחרונות בכל האתרים')}
        {tabValue === 2 && renderRecurringFaultsTable()}
        {tabValue === 3 && (
          <>
            <Typography variant="h6" gutterBottom sx={{ mb: 4, color: 'primary.main' }}>סטטיסטיקות לפי אתר</Typography>
            {renderStatisticsCards(siteStatistics)}
            <Box mt={4}>
              {renderStatisticsCharts(siteStatistics)}
            </Box>
            <Typography variant="h6" gutterBottom sx={{ mt: 6, mb: 4, color: 'primary.main' }}>סטטיסטיקות לפי מיקום</Typography>
            {renderStatisticsCards(locationStatistics)}
            <Box mt={4}>
              {renderStatisticsCharts(locationStatistics)}
            </Box>
          </>
        )}
      </Box>
    </Container>
  );
}

export default EntrepreneurDashboard;