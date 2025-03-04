import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  TextField,
  FormControlLabel,
  Switch,
  Autocomplete,
  CircularProgress,
  IconButton,
  Typography,
  MenuItem
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { colors } from '../styles/colors';
import { selectStyles } from '../styles/components';
import { getEntrepreneurs, getSites, getFaultTypes } from '../services/api';
import FormField from './common/FormField';

const NewFaultForm = ({ onFaultDataChange, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [entrepreneurs, setEntrepreneurs] = useState([]);
  const [allSites, setAllSites] = useState([]);
  const [filteredSites, setFilteredSites] = useState([]);
  const [selectedEntrepreneur, setSelectedEntrepreneur] = useState(null);
  const [selectedSite, setSelectedSite] = useState(null);
  const [faultTypes, setFaultTypes] = useState([]);
  const [faultData, setFaultData] = useState({
    type: '',
    description: '',
    siteId: '',
    site: null,
    isCritical: false
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [entrepreneursData, sitesData, faultTypesData] = await Promise.all([
          getEntrepreneurs(),
          getSites(),
          getFaultTypes()
        ]);
        const sitesWithEntrepreneurs = sitesData.map(site => {
          const entrepreneur = entrepreneursData.find(e => e.id === site.entrepreneurId);
          return {
            ...site,
            entrepreneur
          };
        });

        setEntrepreneurs(entrepreneursData);
        setAllSites(sitesWithEntrepreneurs);
        setFilteredSites(sitesWithEntrepreneurs);
        setFaultTypes(faultTypesData);
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
      const siteWithEntrepreneur = allSites.find(site => site.id === value.id);
      if (siteWithEntrepreneur?.entrepreneur) {
        setSelectedEntrepreneur(siteWithEntrepreneur.entrepreneur);
        const entrepreneurSites = allSites.filter(
          site => site.entrepreneurId === siteWithEntrepreneur.entrepreneur.id
        );
        setFilteredSites(entrepreneurSites);
      }
      updateFaultData({ 
        siteId: value.id,
        site: value
      });
    } else {
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
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      gap: 2, 
      width: '100%',
      maxWidth: '100%',
      '& .MuiFormControl-root, & .MuiAutocomplete-root, & .MuiTextField-root': {
        width: '100%'
      }
    }}>
      {onClose && (
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: -12,
            top: -12,
            color: colors.text.grey,
            '&:hover': {
              color: colors.text.white,
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      )}

      <Typography variant="h6" sx={{ color: colors.text.white, mb: 2 }}>
        פרטי התקלה
      </Typography>

      {/* Entrepreneur Selection */}
      <FormField label="יזם">
        <Autocomplete
          loading={loading}
          options={entrepreneurs}
          getOptionLabel={(option) => {
            if (!option) return '';
            return option.organization?.name || option.name;
          }}
          value={selectedEntrepreneur}
          onChange={handleEntrepreneurChange}
          isOptionEqualToValue={(option, value) => option?.id === value?.id}
          renderInput={(params) => (
            <TextField
              {...params}
              error={false}
              sx={{
                width: '100%',
                '& .MuiOutlinedInput-root': {
                  ...selectStyles.control,
                  padding: '2px 8px',
                  '& input': {
                    color: colors.text.white
                  }
                }
              }}
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
      </FormField>

      {/* Site Selection */}
      <FormField label="אתר">
        <Autocomplete
          loading={loading}
          options={filteredSites}
          getOptionLabel={(option) => option?.name || ''}
          value={selectedSite}
          onChange={handleSiteChange}
          isOptionEqualToValue={(option, value) => option?.id === value?.id}
          renderInput={(params) => (
            <TextField
              {...params}
              error={false}
              sx={{
                width: '100%',
                '& .MuiOutlinedInput-root': {
                  ...selectStyles.control,
                  padding: '2px 8px',
                  '& input': {
                    color: colors.text.white
                  }
                }
              }}
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
      </FormField>

      {/* Fault Type */}
      <FormField label="סוג תקלה">
        <TextField
          select
          fullWidth
          value={faultData.type}
          onChange={(e) => updateFaultData({ type: e.target.value })}
          sx={{
            width: '100%',
            '& .MuiOutlinedInput-root': {
              ...selectStyles.control,
              padding: '2px 8px',
              '& .MuiSelect-select': {
                color: colors.text.white
              }
            }
          }}
        >
          {faultTypes.map(type => (
            <MenuItem key={type} value={type}>{type}</MenuItem>
          ))}
        </TextField>
      </FormField>

      {/* Description field - appears after selecting type */}
      {faultData.type && (
        <FormField 
          label={faultData.type === 'אחר' ? 'תיאור התקלה' : 'תיאור התקלה'} 
          required={faultData.type === 'אחר'}
        >
          <TextField
            multiline
            rows={4}
            value={faultData.description}
            onChange={(e) => updateFaultData({ description: e.target.value })}
            sx={{
              width: '100%',
              '& .MuiOutlinedInput-root': {
                ...selectStyles.control,
                padding: '2px 8px',
                '& textarea': {
                  color: colors.text.white
                }
              }
            }}
          />
        </FormField>
      )}

      {/* Critical Fault Switch */}
      <FormControlLabel
        control={
          <Switch
            checked={faultData.isCritical}
            onChange={(e) => updateFaultData({ isCritical: e.target.checked })}
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': {
                color: colors.primary.orange,
                '& + .MuiSwitch-track': {
                  backgroundColor: colors.primary.orange
                }
              }
            }}
          />
        }
        label="תקלה משביתה"
        sx={{ 
          color: colors.text.white,
          '& .MuiFormControlLabel-label': {
            color: colors.text.white
          }
        }}
      />
    </Box>
  );
};

NewFaultForm.propTypes = {
  onFaultDataChange: PropTypes.func.isRequired,
  onClose: PropTypes.func
};

export default NewFaultForm;
