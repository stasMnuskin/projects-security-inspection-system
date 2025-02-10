import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Container,
  Button,
  Grid,
  List,
  ListItem,
  ListItemText,
  Snackbar,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import Select from 'react-select';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../context/AuthContext';
import { getUsers, updateUser, getOrganizations, deleteUser } from '../services/api';
import { colors } from '../styles/colors';
import { formStyles, selectStyles, dialogStyles } from '../styles/components';
import FormField from '../components/common/FormField';
import { ROLE_OPTIONS, ROLES } from '../constants/roles';

function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);
  const [editedUser, setEditedUser] = useState(null);
  const [organizations, setOrganizations] = useState({});
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
      // Fetch organizations for all roles except admin
      Object.values(ROLES)
        .filter(role => role !== 'admin')
        .forEach(role => fetchOrganizations(role));
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

  const handleSearch = (newValue) => {
    setSearchTerm(newValue?.value || '');
  };

  const handleUserSelect = (selectedUser) => {
    setSelectedUser(selectedUser);
    setEditedUser({
      ...selectedUser,
      name: selectedUser.name || '',
      email: selectedUser.email || '',
      organization: selectedUser.organization || null, 
      organizationId: selectedUser.organizationId,
      role: selectedUser.role || ''
    });
  };

  const showNotification = (message, severity = 'success') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  const validateForm = () => {
    const errors = {};
    if (!editedUser.name) errors.name = 'שדה שם לא יכול להיות ריק';
    if (!editedUser.email) errors.email = 'שדה אימייל לא יכול להיות ריק';
    else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(editedUser.email)) {
      errors.email = 'כתובת אימייל לא תקינה';
    }
    if (!editedUser.role) errors.role = 'שדה תפקיד לא יכול להיות ריק';
    if (editedUser.role && editedUser.role !== 'admin' && !editedUser.organization?.name) {
      errors.organization = 'שדה ארגון לא יכול להיות ריק';
    }

    if (Object.keys(errors).length > 0) {
      const errorMessages = Object.values(errors).join('\n');
      showNotification(errorMessages, 'error');
      return false;
    }
    return true;
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

  const getOrganizationOptions = useCallback((role) => {
    if (!role || role === 'admin') return [];
    return organizations[role]?.map(org => org.name) || [];
  }, [organizations]);

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const updatedUser = {
        id: editedUser.id,
        name: editedUser.name,
        email: editedUser.email,
        role: editedUser.role,
        organization: editedUser.organization?.name ? {
          name: editedUser.organization.name
        } : undefined
      };

      // Log the update data for debugging
      console.log('Updating user with data:', updatedUser);
      
      const result = await updateUser(updatedUser);
      console.log('Update result:', result);

      const updatedUserData = result.user;
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === updatedUserData.id ? updatedUserData : user
        )
      );
      setFilteredUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === updatedUserData.id ? updatedUserData : user
        )
      );
      setSelectedUser(updatedUserData);

      await Promise.all(
        Object.values(ROLES)
          .filter(role => role !== 'admin')
          .map(role => fetchOrganizations(role))
      );

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
    <Box>
      <Grid container spacing={3}>
        {/* Left Panel - User List */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={formStyles.paper}>
            <Box sx={formStyles.formBox}>
              <FormField label="חיפוש">
                <Select
                  value={searchTerm ? { value: searchTerm, label: searchTerm } : null}
                  onChange={handleSearch}
                  options={getSearchSuggestions().map(suggestion => ({
                    value: suggestion,
                    label: suggestion
                  }))}
                  styles={selectStyles}
                  placeholder="חיפוש לפי שם, אימייל, ארגון או תפקיד"
                  isClearable
                />
              </FormField>

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
                    <FormField label="שם" required>
                      <Select
                        inputValue={editedUser.name}
                        value={editedUser.name ? { value: editedUser.name, label: editedUser.name } : null}
                        onInputChange={(inputValue, { action }) => {
                          if (action === 'input-change') {
                            setEditedUser(prev => ({ ...prev, name: inputValue }));
                          }
                        }}
                        onChange={(newValue) => setEditedUser(prev => ({ ...prev, name: newValue?.value || '' }))}
                        options={[]}
                        styles={selectStyles}
                        placeholder=""
                        isClearable
                        components={{
                          DropdownIndicator: () => null,
                          IndicatorSeparator: () => null,
                          Menu: () => null
                        }}
                      />
                    </FormField>
                  </Grid>
                  <Grid item xs={12}>
                    <FormField label="אימייל" required>
                      <Select
                        inputValue={editedUser.email}
                        value={editedUser.email ? { value: editedUser.email, label: editedUser.email } : null}
                        onInputChange={(inputValue, { action }) => {
                          if (action === 'input-change') {
                            setEditedUser(prev => ({ ...prev, email: inputValue }));
                          }
                        }}
                        onChange={(newValue) => setEditedUser(prev => ({ ...prev, email: newValue?.value || '' }))}
                        options={[]}
                        styles={selectStyles}
                        placeholder=""
                        isClearable
                        components={{
                          DropdownIndicator: () => null,
                          IndicatorSeparator: () => null,
                          Menu: () => null
                        }}
                      />
                    </FormField>
                  </Grid>
                  <Grid item xs={12}>
                    <FormField label="תפקיד" required>
                      <Select
                        value={editedUser.role ? ROLE_OPTIONS.find(role => role.value === editedUser.role) : null}
                        onChange={(newValue) => {
                          setEditedUser(prev => ({
                            ...prev,
                            role: newValue?.value || '',
                            organization: null,
                            organizationId: null
                          }));
                        }}
                        options={ROLE_OPTIONS}
                        styles={selectStyles}
                        placeholder=""
                        isClearable
                      />
                    </FormField>
                  </Grid>

                  {/* Organization field - show for all roles except admin */}
                  {editedUser.role && editedUser.role !== 'admin' && (
                    <Grid item xs={12}>
                      <FormField label="ארגון" required>
                        <Select
                          inputValue={editedUser.organization?.name || ''}
                          value={editedUser.organization?.name ? { value: editedUser.organization.name, label: editedUser.organization.name } : null}
                          onInputChange={(inputValue, { action }) => {
                            if (action === 'input-change') {
                              setEditedUser(prev => ({
                                ...prev,
                                organization: {
                                  name: inputValue,
                                  type: prev.role
                                }
                              }));
                            }
                          }}
                          onChange={(newValue) => {
                            setEditedUser(prev => ({
                              ...prev,
                              organization: newValue ? {
                                name: newValue.value,
                                type: prev.role
                              } : null
                            }));
                          }}
                          options={getOrganizationOptions(editedUser.role).map(name => ({
                            value: name,
                            label: name
                          }))}
                          styles={selectStyles}
                          placeholder=""
                          isClearable
                        />
                      </FormField>
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
                        {loading ? 'שומר...' : 'שמירה'}
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setSelectedUser(null);
                          setEditedUser(null);
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
        sx={dialogStyles.dialog}
      >
        <DialogTitle sx={dialogStyles.dialogTitle}>
          אישור מחיקה
        </DialogTitle>
        <DialogContent sx={dialogStyles.dialogContent}>
          <Typography>
            האם אתה בטוח שברצונך למחוק את המשתמש {userToDelete?.name}?
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
    </Box>
  );
}

export default Users;
