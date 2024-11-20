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
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { getUsers, updateUser } from '../services/api';
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

  useEffect(() => {
    if (user.role === 'admin') {
      fetchUsers();
    }
  }, [fetchUsers, user.role]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(user => 
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.organization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      firstName: selectedUser.firstName || '',
      lastName: selectedUser.lastName || '',
      email: selectedUser.email || '',
      organization: selectedUser.organization || '',
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
    if (!editedUser.firstName?.trim()) {
      newErrors.firstName = 'שם פרטי נדרש';
    }
    if (!editedUser.email?.trim()) {
      newErrors.email = 'אימייל נדרש';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(editedUser.email)) {
      newErrors.email = 'כתובת אימייל לא תקינה';
    }
    if (!editedUser.role) {
      newErrors.role = 'תפקיד נדרש';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await updateUser(editedUser);
      showNotification('המשתמש נשמר בהצלחה');
      fetchUsers();
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
      if (user.firstName) suggestions.add(user.firstName);
      if (user.lastName) suggestions.add(user.lastName);
      if (user.email) suggestions.add(user.email);
      if (user.organization) suggestions.add(user.organization);
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
              <Typography variant="h6" gutterBottom sx={formStyles.title}>
                רשימת משתמשים
              </Typography>

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
                  >
                    <ListItemText 
                      primary={`${userItem.firstName}`}
                      secondary={
                        <>
                          {userItem.email}
                          <br />
                          {ROLE_OPTIONS.find(role => role.value === userItem.role)?.label || ''}
                          {userItem.organization && (
                            <>
                              <br />
                              {userItem.organization}
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
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="שם פרטי"
                      value={editedUser.firstName}
                      onChange={(e) => setEditedUser(prev => ({ ...prev, firstName: e.target.value }))}
                      error={!!errors.firstName}
                      helperText={errors.firstName}
                      sx={formStyles.textField}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="שם משפחה"
                      value={editedUser.lastName || ''}
                      onChange={(e) => setEditedUser(prev => ({ ...prev, lastName: e.target.value }))}
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
                    <TextField
                      fullWidth
                      label="ארגון"
                      value={editedUser.organization || ''}
                      onChange={(e) => setEditedUser(prev => ({ ...prev, organization: e.target.value }))}
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
                        onChange={(e) => setEditedUser(prev => ({ ...prev, role: e.target.value }))}
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
