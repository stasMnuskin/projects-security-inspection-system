import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Paper,
  TextField,
  Typography,
  Container,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  Snackbar,
  Alert,
  IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import { useAuth } from '../context/AuthContext';
import { getSites, createSite, updateSite, deleteSite } from '../services/api';
import { colors } from '../styles/colors';
import { formStyles, dialogStyles } from '../styles/components';
import { PERMISSIONS } from '../constants/roles';
import SiteForm from '../components/SiteForm';
import InspectionTypeConfig from '../components/InspectionTypeConfig';

const SITE_TYPES = [
  { value: 'radar', label: 'מכ"מ' },
  { value: 'inductive_fence', label: 'גדר אינדוקטיבית' }
];

// Helper function to format organization names list
const formatOrganizationsList = (organizations) => {
  if (!organizations || organizations.length === 0) return '-';
  return organizations.map(org => org.name).join(', ');
};

function Sites({ mode = 'list', onModeChange }) {
  const { user } = useAuth();
  const [sites, setSites] = useState([]);
  const [filteredSites, setFilteredSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const fetchSites = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSites();
      setSites(data);
      setFilteredSites(data);
    } catch (error) {
      showNotification('שגיאה בטעינת אתרים', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch sites for all users
    fetchSites();
  }, [fetchSites]);

  useEffect(() => {
    const filtered = sites.filter(site => 
      site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (site.entrepreneur?.organization?.name || site.entrepreneur?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.serviceOrganizations?.some(org => org.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredSites(filtered);
  }, [searchTerm, sites]);

  useEffect(() => {
    if (mode === 'new') {
      setSelectedSite(null);
      setFormDialogOpen(true);
    }
  }, [mode]);

  const showNotification = (message, severity = 'success') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  const handleActionsClick = (event, site) => {
    setAnchorEl(event.currentTarget);
    setSelectedSite(site);
  };

  const handleActionsClose = () => {
    setAnchorEl(null);
  };

  const handleEditClick = () => {
    setFormDialogOpen(true);
    handleActionsClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleActionsClose();
  };

  const handleDeleteConfirm = async () => {
    try {
      setLoading(true);
      await deleteSite(selectedSite.id);
      showNotification('האתר נמחק בהצלחה');
      fetchSites();
      setDeleteDialogOpen(false);
      setSelectedSite(null);
    } catch (error) {
      showNotification('שגיאה במחיקת האתר', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (siteData) => {
    try {
      if (siteData.hasErrors) {
        const errorMessages = Object.values(siteData.errors).join('\n');
        showNotification(errorMessages, 'error');
        return;
      }

      setLoading(true);
      if (selectedSite) {
        await updateSite(selectedSite.id, siteData);
        showNotification('האתר עודכן בהצלחה');
      } else {
        await createSite(siteData);
        showNotification('האתר נוצר בהצלחה');
      }
      fetchSites();
      setFormDialogOpen(false);
      setSelectedSite(null);
      if (mode === 'new' && onModeChange) {
        onModeChange('list');
      }
    } catch (error) {
      if (error.response?.data?.message) {
        showNotification(error.response.data.message, 'error');
      } else {
        showNotification(`שגיאה ב${selectedSite ? 'עדכון' : 'יצירת'} האתר`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFormClose = () => {
    setFormDialogOpen(false);
    setSelectedSite(null);
    if (mode === 'new' && onModeChange) {
      onModeChange('list');
    }
  };

  const renderSitesList = () => (
    <>
      <Paper sx={{ 
        p: 2, 
        mb: 3,
        backgroundColor: colors.background.black
      }}>
        <TextField
          fullWidth
          placeholder="חיפוש אתר..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: colors.text.grey }} />
              </InputAdornment>
            )
          }}
          sx={{
            backgroundColor: colors.background.darkGrey,
            '& .MuiOutlinedInput-root': {
              color: colors.text.white
            }
          }}
        />
      </Paper>

      <TableContainer component={Paper} sx={{ 
        mb: 4,
        backgroundColor: colors.background.black
      }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: colors.text.white }}>שם האתר</TableCell>
              <TableCell sx={{ color: colors.text.white }}>יזם</TableCell>
              <TableCell sx={{ color: colors.text.white }}>סוג</TableCell>
              <TableCell sx={{ color: colors.text.white }}>חברות אינטגרציה</TableCell>
              <TableCell sx={{ color: colors.text.white }}>חברות אחזקה</TableCell>
              <TableCell sx={{ color: colors.text.white }}>מוקד</TableCell>
              {user.hasPermission(PERMISSIONS.ADMIN) && (
                <TableCell sx={{ color: colors.text.white }}>פעולות</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSites.map((site) => (
              <TableRow key={site.id}>
                <TableCell sx={{ color: colors.text.white }}>{site.name}</TableCell>
                <TableCell sx={{ color: colors.text.white }}>
                  {site.entrepreneur?.organization?.name || site.entrepreneur?.name || '-'}
                </TableCell>
                <TableCell sx={{ color: colors.text.white }}>
                  {SITE_TYPES.find(t => t.value === site.type)?.label}
                </TableCell>
                <TableCell sx={{ color: colors.text.white }}>
                  {formatOrganizationsList(site.serviceOrganizations?.filter(org => org.type === 'integrator'))}
                </TableCell>
                <TableCell sx={{ color: colors.text.white }}>
                  {formatOrganizationsList(site.serviceOrganizations?.filter(org => org.type === 'maintenance'))}
                </TableCell>
                <TableCell sx={{ color: colors.text.white }}>
                  {formatOrganizationsList(site.serviceOrganizations?.filter(org => org.type === 'control_center'))}
                </TableCell>
                {user.hasPermission(PERMISSIONS.ADMIN) && (
                  <TableCell>
                    <IconButton
                      onClick={(e) => handleActionsClick(e, site)}
                      sx={{ color: colors.border.orange }}
                    >
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );

  return (
    <Container maxWidth="lg" sx={formStyles.container}>
      {mode === 'inspection-config' ? (
        user.hasPermission(PERMISSIONS.ADMIN) ? (
          <InspectionTypeConfig />
        ) : (
          <Typography>אין לך הרשאה לצפות בדף זה</Typography>
        )
      ) : (
        renderSitesList()
      )}

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleActionsClose}
        PaperProps={{
          sx: {
            backgroundColor: colors.background.black,
            color: colors.text.white
          }
        }}
      >
        <MenuItem onClick={handleEditClick} sx={{ color: colors.text.white }}>
          עריכה
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: colors.text.white }}>
          מחיקה
        </MenuItem>
      </Menu>

      {/* Add/Edit Form Dialog */}
      <Dialog
        open={formDialogOpen}
        onClose={handleFormClose}
        maxWidth="md"
        fullWidth
        sx={dialogStyles.dialog}
      >
        <DialogTitle sx={dialogStyles.dialogTitle}>
          {selectedSite ? 'עריכת אתר' : 'הוספת אתר'}
          <IconButton
            onClick={handleFormClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: colors.text.grey,
              '&:hover': {
                color: colors.text.white,
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={dialogStyles.dialogContent}>
          <SiteForm
            initialData={selectedSite}
            onSubmit={handleFormSubmit}
            onCancel={handleFormClose}
            submitLabel={loading ? 'שומר...' : 'שמירה'}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        sx={dialogStyles.dialog}
      >
        <DialogTitle sx={dialogStyles.dialogTitle}>
          האם למחוק את האתר?
          <IconButton
            onClick={() => setDeleteDialogOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: colors.text.grey,
              '&:hover': {
                color: colors.text.white,
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={dialogStyles.dialogContent}>
          <Typography>
            {selectedSite && `האם אתה בטוח שברצונך למחוק את האתר "${selectedSite.name}"?`}
          </Typography>
        </DialogContent>
        <DialogActions sx={dialogStyles.dialogActions}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            sx={dialogStyles.cancelButton}
          >
            ביטול
          </Button>
          <Button 
            onClick={handleDeleteConfirm}
            disabled={loading}
            sx={dialogStyles.submitButton}
          >
            {loading ? 'מוחק...' : 'מחק'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert 
          severity={notification.severity} 
          onClose={() => setNotification({ ...notification, open: false })}
          sx={{
            whiteSpace: 'pre-line'
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

Sites.propTypes = {
  mode: PropTypes.oneOf(['list', 'new', 'inspection-config']),
  onModeChange: PropTypes.func
};

export default Sites;
