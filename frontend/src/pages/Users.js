import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  TextField,
  Typography,
  Container,
  FormControl,
  Button,
  Grid,
  List,
  ListItem,
  ListItemText,
  Snackbar,
  Alert,
  Autocomplete,
  Select,
  MenuItem,
  InputLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../context/AuthContext';
import { getUsers, updateUser, getOrganizations, createOrganization, deleteUser } from '../services/api';
import { colors } from '../styles/colors';
import { formStyles } from '../styles/components';
import { ROLE_OPTIONS } from '../constants/roles';

function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);
  const [editedUser, setEditedUser] = useState(null);
  const [errors, setErrors] = useState({});
  const [organizations, setOrganizations] = useState({
    maintenance: [],
    integrator: [],
    general: []
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      showNotification('שגיאה בטעינת משתמשים', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOrganizations = useCallback(async (type) => {
    try {
      const data = await getOrganizations(type);
      setOrganizations(prev => ({
        ...prev,
        [type]: data
      }));
    } catch (error) {
      console.error(`Error fetching ${type} organizations:`, error);
    }
  }, []);

  useEffect(() => {
    if (user.role === 'admin') {
      fetchUsers();
      // Fetch organizations of all types
      fetchOrganizations('maintenance');
      fetchOrganizations('integrator');
      fetchOrganizations('general');
    }
  }, [fetchUsers, fetchOrganizations, user.role]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.organization?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ROLE_OPTIONS.find(role => role.value === user.role)?.label?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const handleSearch = (event, value) => {
    setSearchTerm(value || '');
  };

  const handleUserSelect = (selectedUser) => {
    setSelectedUser(selectedUser);
    setEditedUser({
      ...selectedUser,
      name: selectedUser.name || '',
      email: selectedUser.email || '',
      organization: selectedUser.organization?.name || '',
      organizationId: selectedUser.organizationId,
      role: selectedUser.role || ''
    });
    setErrors({});
  };

  const showNotification = (message, severity = 'success') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!editedUser.name?.trim()) {
      newErrors.name = 'שם נדרש';
    }
    if (!editedUser.email?.trim()) {
      newErrors.email = 'אימייל נדרש';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(editedUser.email)) {
      newErrors.email = 'כתובת אימייל לא תקינה';
    }
    if (!editedUser.role) {
      newErrors.role = 'תפקיד נדרש';
    }
    if (['maintenance', 'integrator'].includes(editedUser.role) && !editedUser.organization) {
      newErrors.organization = 'ארגון נדרש';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDeleteClick = (userItem, event) => {
    event.stopPropagation();
    setUserToDelete(userItem);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteUser(userToDelete.id);
      showNotification('המשתמש נמחק בהצלחה');
      await fetchUsers(); 
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      if (selectedUser?.id === userToDelete.id) {
        setSelectedUser(null);
        setEditedUser(null);
      }
    } catch (error) {
      showNotification(error.message || 'שגיאה במחיקת המשתמש', 'error');
    }
  };

  const findExistingOrganization = (name) => {
    // Check in all organization types
    for (const type of ['maintenance', 'integrator', 'general']) {
      const existing = organizations[type]?.find(
        org => org.name.toLowerCase() === name.toLowerCase()
      );
      if (existing) {
        return existing;
      }
    }
    return null;
  };

  const getOrganizationOptions = useCallback(() => {
    // Get all unique organization names across all types
    const allOrgs = new Set();
    ['maintenance', 'integrator', 'general'].forEach(type => {
      organizations[type]?.forEach(org => {
        allOrgs.add(org.name);
      });
    });
    return Array.from(allOrgs);
  }, [organizations]);

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Handle organization for all roles
      let organizationId = editedUser.organizationId;
      let organizationName = editedUser.organization;
      
      if (organizationName) {
        // Check if organization already exists (case-insensitive)
        const existingOrg = findExistingOrganization(organizationName);
        
        if (existingOrg) {
          // Use existing organization
          organizationId = existingOrg.id;
          organizationName = existingOrg.name;
        } else {
          // Create new organization with appropriate type
          const orgType = ['maintenance', 'integrator'].includes(editedUser.role) 
            ? editedUser.role 
            : 'general';
          
          const newOrg = await createOrganization({
            name: organizationName,
            type: orgType
          });
          organizationId = newOrg.id;
          
          // Refresh organizations list
          await fetchOrganizations(orgType);
        }
      } else {
        organizationId = null;
        organizationName = null;
      }

      // Update user with organizationId
      const updatedUser = {
        ...editedUser,
        organizationId,
        organization: organizationName ? { name: organizationName } : null
      };
      delete updatedUser.organizationName;

      await updateUser(updatedUser);
      
      // Update the user in the list
      const updatedUsers = users.map(u => {
        if (u.id === updatedUser.id) {
          return {
            ...u,
            ...updatedUser,
            organization: organizationName ? { name: organizationName } : null
          };
        }
        return u;
      });
      
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers);
      showNotification('המשתמש נשמר בהצלחה');
      setSelectedUser(null);
      setEditedUser(null);
    } catch (error) {
      showNotification(error.message || 'שגיאה בשמירת המשתמש', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getSearchSuggestions = () => {
    const suggestions = new Set();
    users.forEach(user => {
      if (user.name) suggestions.add(user.name);
      if (user.email) suggestions.add(user.email);
      if (user.organization?.name) suggestions.add(user.organization.name);
      if (user.role) {
        const roleLabel = ROLE_OPTIONS.find(role => role.value === user.role)?.label;
        if (roleLabel) suggestions.add(roleLabel);
      }
    });
    return Array.from(suggestions);
  };

  if (user.role !== 'admin') {
    return (
      <Container>
        <Typography>אין לך הרשאה לצפות בדף זה</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={formStyles.container}>
      <Grid container spacing={3}>
        {/* Left Panel - User List */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={formStyles.paper}>
            <Box sx={formStyles.formBox}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <Autocomplete
                  freeSolo
                  options={getSearchSuggestions()}
                  onInputChange={handleSearch}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="outlined"
                      placeholder="חיפוש לפי שם, אימייל, ארגון או תפקיד"
                      sx={{
                        backgroundColor: colors.background.darkGrey,
                        '& .MuiOutlinedInput-root': {
                          color: colors.text.white
                        }
                      }}
                    />
                  )}
                />
              </FormControl>

              <List sx={{ 
                bgcolor: colors.background.darkGrey, 
                borderRadius: 1,
                maxHeight: '60vh',
                overflow: 'auto'
              }}>
                {filteredUsers.map((userItem) => (
                  <ListItem
                    key={userItem.id}
                    button
                    selected={selectedUser?.id === userItem.id}
                    onClick={() => handleUserSelect(userItem)}
                    sx={{
                      borderBottom: `1px solid ${colors.border.grey}`,
                      '&.Mui-selected': {
                        backgroundColor: colors.background.active,
                        '&:hover': {
                          backgroundColor: colors.background.activeHover
                        }
                      }
                    }}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        onClick={(e) => handleDeleteClick(userItem, e)}
                        sx={{ 
                          color: colors.primary.orange,
                          '&:hover': {
                            color: colors.primary.orangeHover
                          }
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <ListItemText 
                      primary={userItem.name}
                      secondary={
                        <>
                          {userItem.email}
                          <br />
                          {ROLE_OPTIONS.find(role => role.value === userItem.role)?.label || ''}
                          {userItem.organization?.name && (
                            <>
                              <br />
                              {userItem.organization.name}
                            </>
                          )}
                        </>
                      }
                      sx={{
                        '& .MuiListItemText-primary': {
                          color: colors.text.white
                        },
                        '& .MuiListItemText-secondary': {
                          color: colors.text.grey
                        }
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Paper>
        </Grid>

        {/* Right Panel - User Details */}
        <Grid item xs={12} md={8}>
          {editedUser && (
            <Paper elevation={3} sx={formStyles.paper}>
              <Box sx={formStyles.formBox}>
                <Typography variant="h6" gutterBottom sx={formStyles.title}>
                  פרטי משתמש
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="שם"
                      value={editedUser.name}
                      onChange={(e) => setEditedUser(prev => ({ ...prev, name: e.target.value }))}
                      error={!!errors.name}
                      helperText={errors.name}
                      sx={formStyles.textField}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="אימייל"
                      value={editedUser.email}
                      onChange={(e) => setEditedUser(prev => ({ ...prev, email: e.target.value }))}
                      error={!!errors.email}
                      helperText={errors.email}
                      sx={formStyles.textField}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth error={!!errors.role} sx={formStyles.textField}>
                      <InputLabel id="role-select-label" sx={{ color: colors.text.white }}>תפקיד</InputLabel>
                      <Select
                        labelId="role-select-label"
                        value={editedUser.role || ''}
                        label="תפקיד"
                        onChange={(e) => {
                          const newRole = e.target.value;
                          setEditedUser(prev => ({
                            ...prev,
                            role: newRole,
                            organization: prev.organization,
                            organizationId: prev.organizationId
                          }));
                        }}
                        sx={{
                          color: colors.text.white,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: colors.border.grey
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: colors.border.grey
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: colors.border.grey
                          }
                        }}
                      >
                        {ROLE_OPTIONS.map((role) => (
                          <MenuItem key={role.value} value={role.value}>
                            {role.label}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.role && (
                        <Typography variant="caption" color="error">
                          {errors.role}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>

                  {/* Organization field - show for all roles */}
                  {editedUser.role && (
                    <Grid item xs={12}>
                      <Autocomplete
                        freeSolo
                        value={editedUser.organization || ''}
                        onChange={(_, newValue) => setEditedUser(prev => ({ 
                          ...prev, 
                          organization: newValue,
                          organizationId: null 
                        }))}
                        onInputChange={(_, newValue) => setEditedUser(prev => ({ 
                          ...prev, 
                          organization: newValue,
                          organizationId: null 
                        }))}
                        options={getOrganizationOptions()}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="ארגון"
                            error={!!errors.organization}
                            helperText={
                              errors.organization || 
                              (['maintenance', 'integrator'].includes(editedUser.role)
                                ? 'שדה חובה - ניתן לבחור ארגון קיים או להזין שם חדש'
                                : 'ניתן לבחור ארגון קיים או להזין שם חדש')
                            }
                            required={['maintenance', 'integrator'].includes(editedUser.role)}
                            sx={formStyles.textField}
                          />
                        )}
                      />
                    </Grid>
                  )}

                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-start' }}>
                      <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={loading}
                        sx={formStyles.submitButton}
                      >
                        {loading ? 'שומר...' : 'שמור'}
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setSelectedUser(null);
                          setEditedUser(null);
                          setErrors({});
                        }}
                        sx={{
                          color: colors.text.white,
                          borderColor: colors.text.white,
                          '&:hover': {
                            borderColor: colors.text.grey
                          }
                        }}
                      >
                        ביטול
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>

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
        <DialogTitle>אישור מחיקה</DialogTitle>
        <DialogContent>
          <Typography>
            האם אתה בטוח שברצונך למחוק את המשתמש {userToDelete?.name}?
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
            sx={{ 
              color: colors.primary.orange,
              '&:hover': {
                color: colors.primary.orangeHover
              }
            }}
          >
            מחק
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

export default Users;
