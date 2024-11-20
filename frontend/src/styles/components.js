import { colors } from './colors';
import { createTheme } from '@mui/material/styles';

// Create and export the theme
export const theme = createTheme({
  direction: 'rtl',
  palette: {
    mode: 'dark',
    primary: {
      main: colors.primary.orange,
    },
    background: {
      default: colors.background.black,
      paper: colors.background.darkGrey,
    },
    text: {
      primary: colors.text.white,
      secondary: colors.text.grey,
    },
  },
  typography: {
    fontFamily: 'Assistant, sans-serif',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: colors.background.black,
          color: colors.text.white,
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          backgroundColor: colors.background.darkGrey,
          '&:hover': {
            backgroundColor: colors.background.darkGrey,
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.border.grey,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.primary.orange,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.primary.orange,
          },
        },
      },
    },
  },
});

export const layoutStyles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: colors.background.black
  },
  logo: {
    height: '50px',
    margin: '1rem'
  },
  pageContainer: {
    display: 'flex',
    flex: 1,
    gap: 2
  }
};

export const pageStyles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: colors.background.black,
    padding: '2rem'
  },
  logo: {
    height: '60px',
    marginBottom: '2rem',
    filter: 'brightness(0) invert(1)'
  }
};

export const sidebarStyles = {
  sidebar: {
    width: '240px',
    backgroundColor: colors.background.darkGrey,
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '8px',
    margin: '0 1rem',
    height: 'fit-content'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    borderBottom: `1px solid ${colors.border.main}`,
    marginBottom: '1rem'
  },
  userName: {
    color: colors.text.white,
    fontSize: '1rem',
    fontWeight: 500
  },
  userDate: {
    color: colors.text.lightGrey,
    fontSize: '0.875rem'
  },
  menuContainer: {
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  sidebarItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    padding: '0.75rem 1rem',
    cursor: 'pointer',
    borderRadius: '4px',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: colors.background.hover
    },
    '&.active': {
      backgroundColor: colors.background.active,
      '&:hover': {
        backgroundColor: colors.background.activeHover
      }
    }
  },
  sidebarIcon: {
    color: colors.primary.orange,
    fontSize: '1.5rem'
  },
  sidebarText: {
    color: colors.text.white,
    fontSize: '1rem'
  },
  subItemsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'absolute',
      right: '1.5rem',
      top: 0,
      width: '1px',
      height: '100%',
      backgroundColor: colors.primary.orange,
      opacity: 0.3
    }
  }
};

export const formStyles = {
  container: {
    width: '100%',
    maxWidth: '400px',
    margin: '0 auto'
  },
  paper: {
    backgroundColor: colors.background.darkGrey,
    borderRadius: '8px',
    border: `1px solid ${colors.border.orangeLight}`
  },
  formBox: {
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  title: {
    color: colors.text.white,
    textAlign: 'center',
    fontSize: '1.75rem',
    fontWeight: 500
  },
  textField: {
    backgroundColor: colors.background.darkGrey,
    '& .MuiOutlinedInput-root': {
      color: colors.text.white,
      '& fieldset': {
        borderColor: colors.border.grey
      },
      '&:hover fieldset': {
        borderColor: colors.border.orange
      },
      '&.Mui-focused fieldset': {
        borderColor: colors.primary.orange
      }
    },
    '& .MuiInputLabel-root': {
      color: colors.text.grey
    }
  },
  submitButton: {
    backgroundColor: colors.primary.orange,
    color: colors.text.white,
    padding: '0.75rem',
    fontSize: '1rem',
    fontWeight: 500,
    '&:hover': {
      backgroundColor: colors.primary.orangeHover
    }
  },
  link: {
    color: colors.text.grey,
    textAlign: 'center',
    textDecoration: 'none',
    '&:hover': {
      color: colors.text.white
    }
  }
};

export const contentStyles = {
  mainContent: {
    flex: 1,
    padding: '1rem'
  },
  pageTitle: {
    color: colors.text.white,
    marginBottom: '2rem'
  },
  searchField: {
    backgroundColor: colors.background.darkGrey,
    '& .MuiOutlinedInput-root': {
      color: colors.text.white,
      '& .MuiInputAdornment-root': {
        color: colors.text.grey
      }
    }
  },
  listItem: {
    borderBottom: `1px solid ${colors.border.grey}`,
    '&:last-child': {
      borderBottom: 'none'
    },
    '&:hover': {
      backgroundColor: colors.background.hover
    },
    '&.active': {
      backgroundColor: colors.background.active
    }
  },
  listItemText: {
    '& .MuiListItemText-primary': {
      color: colors.text.white
    },
    '& .MuiListItemText-secondary': {
      color: colors.text.grey
    }
  }
};
