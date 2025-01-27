import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Button,
  FormControl,
  FormGroup,
  FormControlLabel,
  Checkbox,
  TextField,
  Box,
  Typography,
  Slide,
  IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { getUsersByRole } from '../services/api';
import { ROLES, ROLE_TRANSLATIONS } from '../constants/roles';
import { notificationRecipientsStyles as styles } from '../styles/components';
import { colors } from '../styles/colors';

const rolesList = Object.entries(ROLES).map(([key, value]) => ({
  id: value,
  label: ROLE_TRANSLATIONS[value]
}));

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="right" ref={ref} {...props} />;
});

function NotificationRecipientsDialog({ open, onClose, selectedRecipients, onChange }) {
  const [selectedRole, setSelectedRole] = useState(null);
  const [usersByRole, setUsersByRole] = useState({});
  const [loading, setLoading] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  const handleRoleSelect = async (roleId) => {
    setSelectedRole(roleId);
    if (!usersByRole[roleId]) {
      setLoading(prev => ({ ...prev, [roleId]: true }));
      try {
        const users = await getUsersByRole(roleId);
        setUsersByRole(prev => ({ ...prev, [roleId]: users }));
      } catch (error) {
        console.error(`Error fetching ${roleId} users:`, error);
      } finally {
        setLoading(prev => ({ ...prev, [roleId]: false }));
      }
    }
  };

  const handleBack = () => {
    setSelectedRole(null);
    setSearchTerm('');
  };

  const handleUserToggle = (userId) => {
    const newSelectedRecipients = selectedRecipients.includes(userId)
      ? selectedRecipients.filter(id => id !== userId)
      : [...selectedRecipients, userId];
    onChange(newSelectedRecipients);
  };

  const getFilteredUsers = () => {
    const users = usersByRole[selectedRole] || [];
    return searchTerm
      ? users.filter(user => 
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          user.email?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : users;
  };

  const renderRolesList = () => (
    <List sx={styles.rolesList}>
      {rolesList.map((role) => (
        <ListItem 
          button 
          key={role.id}
          onClick={() => handleRoleSelect(role.id)}
        >
          <ListItemText primary={role.label} />
        </ListItem>
      ))}
    </List>
  );

  const renderUsersList = () => {
    const users = getFilteredUsers();
    return (
      <Box sx={{ maxWidth: '100%' }}>
        <Button
          onClick={handleBack}
          startIcon={<ArrowBackIcon />}
          sx={styles.backButton}
        >
          {rolesList.find(r => r.id === selectedRole)?.label}
        </Button>

        <TextField
          fullWidth
          size="small"
          label="חיפוש"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon />,
          }}
          sx={styles.searchField}
        />

        {loading[selectedRole] ? (
          <Typography sx={styles.noUsers}>טוען...</Typography>
        ) : users.length > 0 ? (
          <FormControl component="fieldset" fullWidth>
            <FormGroup sx={styles.usersList}>
              {users.map((user) => (
                <FormControlLabel
                  key={user.id}
                  control={
                    <Checkbox
                      checked={selectedRecipients.includes(user.id)}
                      onChange={() => handleUserToggle(user.id)}
                      sx={styles.checkbox}
                    />
                  }
                  label={user.name}
                />
              ))}
            </FormGroup>
          </FormControl>
        ) : (
          <Typography sx={styles.noUsers}>
            לא נמצאו משתמשים
          </Typography>
        )}
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      sx={styles.dialog}
    >
      <DialogTitle sx={styles.dialogTitle}>
        דיווח
        <IconButton
          aria-label="close"
          onClick={onClose}
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
      <DialogContent sx={styles.dialogContent}>
        {selectedRole ? renderUsersList() : renderRolesList()}
      </DialogContent>
      {selectedRole && (
        <DialogActions sx={styles.dialogActions}>
          <Button
            variant="contained"
            onClick={onClose}
            sx={styles.saveButton}
          >
            שמירה
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}

NotificationRecipientsDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedRecipients: PropTypes.arrayOf(PropTypes.number).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default NotificationRecipientsDialog;
