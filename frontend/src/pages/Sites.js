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
  Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useAuth } from '../context/AuthContext';
import { getSites, createSite, updateSite, deleteSite } from '../services/api';
import { colors } from '../styles/colors';
import { formStyles } from '../styles/components';
import { PERMISSIONS } from '../constants/roles';
import SiteForm from '../components/SiteForm';
import InspectionTypeConfig from '../components/InspectionTypeConfig';

const SITE_TYPES = [
  { value: 'radar', label: 'מכ"מ' },
  { value: 'inductive_fence', label: 'גדר אינדוקטיבית' }
];

// Helper function to format user names list
const formatUsersList = (users) => {
  if (!users || users.length === 0) return '-';
  return users.map(user => `${user.firstName} ${user.lastName}`).join(', ');
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
    if (user.hasPermission(PERMISSIONS.ADMIN)) {
      fetchSites();
    }
  }, [fetchSites, user]);

  useEffect(() => {
    const filtered = sites.filter(site => 
      site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.entrepreneur?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.entrepreneur?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSites(filtered);
  }, [searchTerm, sites]);

  // Open form dialog when mode changes to 'new'
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
      showNotification(`שגיאה ב${selectedSite ? 'עדכון' : 'יצירת'} האתר`, 'error');
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
              <TableCell sx={{ color: colors.text.white }}>אינטגרטור</TableCell>
              <TableCell sx={{ color: colors.text.white }}>אחזקה</TableCell>
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
                  {`${site.entrepreneur?.firstName}`}
                </TableCell>
                <TableCell sx={{ color: colors.text.white }}>
                  {SITE_TYPES.find(t => t.value === site.type)?.label}
                </TableCell>
                <TableCell sx={{ color: colors.text.white }}>
                  {formatUsersList(site.integrators)}
                </TableCell>
                <TableCell sx={{ color: colors.text.white }}>
                  {formatUsersList(site.maintenanceStaff)}
                </TableCell>
                <TableCell sx={{ color: colors.text.white }}>
                  {site.controlCenter ? `${site.controlCenter.firstName} ${site.controlCenter.lastName}` : '-'}
                </TableCell>
                {user.hasPermission(PERMISSIONS.ADMIN) && (
                  <TableCell>
                    <Button
                      onClick={(e) => handleActionsClick(e, site)}
                      sx={{ color: colors.text.white }}
                    >
                      פעולות
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );

  if (!user.hasPermission(PERMISSIONS.ADMIN)) {
    return (
      <Container>
        <Typography>אין לך הרשאה לצפות בדף זה</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={formStyles.container}>
      {mode === 'inspection-config' ? (
        <InspectionTypeConfig />
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
        PaperProps={{
          sx: {
            backgroundColor: colors.background.black,
            color: colors.text.white
          }
        }}
      >
        <DialogTitle>
          {selectedSite ? 'עריכת אתר' : 'הוספת אתר'}
        </DialogTitle>
        <DialogContent>
          <SiteForm
            initialData={selectedSite}
            onSubmit={handleFormSubmit}
            onCancel={handleFormClose}
            submitLabel={loading ? 'שומר...' : selectedSite ? 'עדכן' : 'שמור'}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: colors.background.black,
            color: colors.text.white
          }
        }}
      >
        <DialogTitle>האם למחוק את האתר?</DialogTitle>
        <DialogContent>
          <Typography>
            {selectedSite && `האם אתה בטוח שברצונך למחוק את האתר "${selectedSite.name}"?`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ color: colors.text.white }}
          >
            ביטול
          </Button>
          <Button 
            onClick={handleDeleteConfirm}
            color="error"
            disabled={loading}
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
        <Alert severity={notification.severity} onClose={() => setNotification({ ...notification, open: false })}>
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
