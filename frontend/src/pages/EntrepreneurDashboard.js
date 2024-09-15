import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Select, MenuItem, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Paper, Tabs, Tab,
  useTheme, useMediaQuery, Card, CardContent
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
        console.log('Sites fetched:', sitesResponse.data);
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
          console.log('Open faults for selected site:', openFaultsResponse.data);
          console.log('Recurring faults for selected site:', recurringFaultsResponse.data);
          console.log('Site statistics for selected site:', siteStatsResponse.data);
          console.log('Location statistics for selected site:', locationStatsResponse.data);
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
          console.log('Open faults for all sites:', openFaultsResponse.data);
          console.log('Recent faults for all sites:', recentFaultsResponse.data);
          console.log('Recurring faults for all sites:', recurringFaultsResponse.data);
          console.log('Site statistics for all sites:', allSiteStatsResponse.data);
          console.log('Location statistics for all sites:', allLocationStatsResponse.data);
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

  const renderFaultTable = (faults, title) => {
    console.log('Rendering fault table:', title, faults);
    return (
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
  };

  const renderRecurringFaultsTable = () => {
    console.log('Rendering recurring faults table:', recurringFaults);
    return (
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
  };

  const renderStatisticsCards = (stats) => {
    console.log('Rendering statistics cards:', stats);
    if (!stats || stats.length === 0) {
      console.log('No statistics data available');
      return <Typography>No statistics data available</Typography>;
    }
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {stats.map((stat, index) => (
          <Card key={index} sx={{ minWidth: 275, flexGrow: 1 }}>
            <CardContent>
              <Typography variant="h6" component="div">
                {stat.name || 'Unknown'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                מספר תקלות: {stat.faultCount || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                תקלות פתוחות: {stat.openFaultCount || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                זמן תיקון ממוצע: {(stat.averageRepairTime || 0).toFixed(2)} שעות
              </Typography>
              <Typography variant="body2" color="text.secondary">
                חומרה ממוצעת: {(stat.averageSeverity || 0).toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                תקלות חוזרות: {stat.recurringFaultCount || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                זמן תגובה ממוצע: {(stat.averageResponseTime || 0).toFixed(2)} שעות
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  };

  const renderStatisticsCharts = (stats) => {
    console.log('Rendering statistics charts:', stats);
    if (!stats || stats.length === 0) {
      console.log('No statistics data available for charts');
      return null;
    }
    const chartData = {
      labels: stats.map(stat => stat.name || 'Unknown'),
      datasets: [
        {
          label: 'מספר תקלות',
          data: stats.map(stat => stat.faultCount || 0),
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
        },
        {
          label: 'תקלות פתוחות',
          data: stats.map(stat => stat.openFaultCount || 0),
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
        },
        {
          label: 'תקלות חוזרות',
          data: stats.map(stat => stat.recurringFaultCount || 0),
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

  console.log('Rendering EntrepreneurDashboard', { sites, selectedSite, openFaults, recentFaults, recurringFaults, siteStatistics, locationStatistics, tabValue });

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