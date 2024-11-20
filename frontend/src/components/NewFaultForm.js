import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormControlLabel,
  Switch,
  Autocomplete,
  CircularProgress
} from '@mui/material';
import { colors } from '../styles/colors';
import { dashboardStyles } from '../styles/dashboardStyles';
import { getUsers, getSites } from '../services/api';

const FAULT_TYPES = ['גדר', 'מצלמות', 'תקשורת', 'אחר'];

const NewFaultForm = ({ onFaultDataChange }) => {
  const [loading, setLoading] = useState(true);
  const [entrepreneurs, setEntrepreneurs] = useState([]);
  const [allSites, setAllSites] = useState([]);
  const [filteredSites, setFilteredSites] = useState([]);
  const [selectedEntrepreneur, setSelectedEntrepreneur] = useState(null);
  const [selectedSite, setSelectedSite] = useState(null);
  const [faultData, setFaultData] = useState({
    type: '',
    description: '',
    siteId: '',
    site: null, // Add site object to store full site information
    isCritical: false
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersData, sitesData] = await Promise.all([
          getUsers(),
          getSites()
        ]);

        // Filter entrepreneurs from users and add their sites
        const entrepreneursList = usersData.filter(user => user.role === 'entrepreneur');
        const sitesWithEntrepreneurs = sitesData.map(site => {
          const entrepreneur = entrepreneursList.find(e => e.id === site.entrepreneurId);
          return {
            ...site,
            entrepreneur
          };
        });

        setEntrepreneurs(entrepreneursList);
        setAllSites(sitesWithEntrepreneurs);
        setFilteredSites(sitesWithEntrepreneurs);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleEntrepreneurChange = (_, value) => {
    setSelectedEntrepreneur(value);
    setSelectedSite(null);
    if (value) {
      const entrepreneurSites = allSites.filter(site => site.entrepreneurId === value.id);
      setFilteredSites(entrepreneurSites);
    } else {
      setFilteredSites(allSites);
    }
    updateFaultData({ siteId: '', site: null });
  };

  const handleSiteChange = (_, value) => {
    setSelectedSite(value);
    if (value) {
      // Find the entrepreneur for this site
      const siteWithEntrepreneur = allSites.find(site => site.id === value.id);
      if (siteWithEntrepreneur?.entrepreneur) {
        setSelectedEntrepreneur(siteWithEntrepreneur.entrepreneur);
        // Update filtered sites to show only this entrepreneur's sites
        const entrepreneurSites = allSites.filter(
          site => site.entrepreneurId === siteWithEntrepreneur.entrepreneur.id
        );
        setFilteredSites(entrepreneurSites);
      }
      updateFaultData({ 
        siteId: value.id,
        site: value // Store the full site object
      });
    } else {
      // Clear both site and entrepreneur when site is cleared
      setSelectedEntrepreneur(null);
      setFilteredSites(allSites);
      updateFaultData({ siteId: '', site: null });
    }
  };

  const updateFaultData = (updates) => {
    const updatedData = {
      ...faultData,
      ...updates
    };
    setFaultData(updatedData);
    onFaultDataChange(updatedData);
  };

  return (
    <Box sx={{ display: 'grid', gap: 2, mt: 2 }}>
      {/* Entrepreneur Selection */}
      <Autocomplete
        loading={loading}
        options={entrepreneurs}
        getOptionLabel={(option) => option.organization || ''}
        value={selectedEntrepreneur}
        onChange={handleEntrepreneurChange}
        isOptionEqualToValue={(option, value) => option?.id === value?.id}
        renderInput={(params) => (
          <TextField
            {...params}
            label="יזם"
            sx={dashboardStyles.filterSelect}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />

      {/* Site Selection */}
      <Autocomplete
        loading={loading}
        options={filteredSites}
        getOptionLabel={(option) => option.name || ''}
        value={selectedSite}
        onChange={handleSiteChange}
        isOptionEqualToValue={(option, value) => option?.id === value?.id}
        renderInput={(params) => (
          <TextField
            {...params}
            label="אתר"
            sx={dashboardStyles.filterSelect}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />

      {/* Fault Type */}
      <FormControl fullWidth>
        <InputLabel sx={{ color: colors.text.grey }}>סוג תקלה</InputLabel>
        <Select
          value={faultData.type}
          onChange={(e) => updateFaultData({ type: e.target.value })}
          sx={dashboardStyles.filterSelect}
        >
          {FAULT_TYPES.map(type => (
            <MenuItem key={type} value={type}>{type}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Description field - appears after selecting type */}
      {faultData.type && (
        <TextField
          label={faultData.type === 'אחר' ? 'תיאור (חובה)' : 'תיאור (אופציונלי)'}
          multiline
          rows={4}
          value={faultData.description}
          onChange={(e) => updateFaultData({ description: e.target.value })}
          required={faultData.type === 'אחר'}
          sx={{
            '& .MuiOutlinedInput-root': {
              color: colors.text.white,
              backgroundColor: colors.background.darkGrey
            },
            '& .MuiInputLabel-root': {
              color: colors.text.grey
            }
          }}
        />
      )}

      {/* Critical Fault Switch */}
      <FormControlLabel
        control={
          <Switch
            checked={faultData.isCritical}
            onChange={(e) => updateFaultData({ isCritical: e.target.checked })}
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': {
                color: colors.primary.orange
              }
            }}
          />
        }
        label="תקלה משביתה"
        sx={{ color: colors.text.white }}
      />
    </Box>
  );
};

NewFaultForm.propTypes = {
  onFaultDataChange: PropTypes.func.isRequired
};

export default NewFaultForm;