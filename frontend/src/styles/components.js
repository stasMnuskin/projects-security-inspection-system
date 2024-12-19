import { colors } from './colors';
import { createTheme, responsiveFontSizes } from '@mui/material/styles';

// Create base theme
let theme = createTheme({
  direction: 'rtl',
  palette: {
    mode: 'dark',
    primary: {
      main: colors.primary.orange,
    },
    background: {
      default: colors.background.black,
      paper: colors.background.darkGreyOpaque,
    },
    text: {
      primary: colors.text.white,
      secondary: colors.text.grey,
    },
  },
  typography: {
    fontFamily: 'Assistant, sans-serif',
    h4: {
      fontSize: '1.5rem',
      '@media (min-width:600px)': {
        fontSize: '1.75rem',
      },
      '@media (min-width:960px)': {
        fontSize: '2rem',
      },
    },
    h6: {
      fontSize: '1rem',
      '@media (min-width:600px)': {
        fontSize: '1.15rem',
      },
      '@media (min-width:960px)': {
        fontSize: '1.25rem',
      },
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: colors.background.black,
          color: colors.text.white,
          '@media (max-width:600px)': {
            fontSize: '14px',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: colors.background.darkGreyOpaque,
          borderRadius: '8px',
          border: `1px solid ${colors.border.orangeLight}`,
          maxWidth: '600px',
          width: '100%',
          margin: '16px',
          position: 'relative',
          '@media (max-width:600px)': {
            margin: '8px',
            width: 'calc(100% - 16px)',
          },
          '& .MuiDialogTitle-root': {
            padding: '20px 24px',
            '@media (max-width:600px)': {
              padding: '16px',
            },
            borderBottom: `1px solid ${colors.border.grey}`,
            marginBottom: '0',
            '& .MuiTypography-root': {
              fontSize: '1.25rem',
              fontWeight: 500,
              color: colors.text.white,
            },
            '& .MuiIconButton-root': {
              position: 'absolute',
              right: '8px',
              top: '8px',
              color: colors.text.grey,
              '&:hover': {
                color: colors.text.white,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            },
          },
          '& .MuiDialogContent-root': {
            padding: '24px',
            '@media (max-width:600px)': {
              padding: '16px',
            },
            backgroundColor: colors.background.darkGreyOpaque,
          },
          '& .MuiDialogActions-root': {
            padding: '16px 24px',
            '@media (max-width:600px)': {
              padding: '12px 16px',
            },
            borderTop: `1px solid ${colors.border.grey}`,
            backgroundColor: colors.background.darkGreyOpaque,
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          backgroundColor: colors.background.darkGreyOpaque,
          color: colors.text.white,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.border.grey,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.border.orange,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.primary.orange,
          },
          '& .MuiSelect-icon': {
            color: colors.text.grey,
          },
          '@media (max-width:600px)': {
            minHeight: '48px !important',
          },
          '@media (min-width:960px)': {
            minHeight: '40px !important',
          }
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          color: colors.text.white,
          '&:hover': {
            backgroundColor: colors.background.hover,
          },
          '&.Mui-selected': {
            backgroundColor: colors.background.active,
            '&:hover': {
              backgroundColor: colors.background.activeHover,
            },
          },
          '@media (max-width:600px)': {
            minHeight: '48px !important',
          },
          '@media (min-width:960px)': {
            minHeight: '40px !important',
          }
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: {
          backgroundColor: colors.background.darkGreyOpaque,
          border: `1px solid ${colors.border.grey}`,
          '& .MuiAutocomplete-option': {
            color: colors.text.white,
            '&[aria-selected="true"]': {
              backgroundColor: colors.background.active,
            },
            '&:hover': {
              backgroundColor: colors.background.hover,
            },
          },
        },
        popupIndicator: {
          color: colors.text.grey,
        },
        clearIndicator: {
          color: colors.text.grey,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          color: colors.text.white,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.border.grey,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.border.orange,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.primary.orange,
          },
          '& .MuiInputAdornment-root': {
            color: colors.text.grey,
          },
          '@media (max-width:600px)': {
            minHeight: '48px !important',
          },
          '@media (min-width:960px)': {
            minHeight: '40px !important',
          }
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          padding: '8px 16px',
          borderRadius: '4px',
          '@media (max-width:600px)': {
            minHeight: '48px !important',
            fontSize: '1rem',
          },
          '@media (min-width:960px)': {
            minHeight: '40px !important',
          }
        },
        contained: {
          backgroundColor: colors.primary.orange,
          color: colors.text.white,
          '&:hover': {
            backgroundColor: colors.primary.orangeHover,
          },
        },
        outlined: {
          borderColor: colors.border.grey,
          color: colors.text.white,
          '&:hover': {
            borderColor: colors.text.white,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          '@media (max-width:600px)': {
            '& .MuiTableCell-root': {
              padding: '8px',
            },
          },
        },
      },
    },
  },
});

theme = responsiveFontSizes(theme);

export { theme };

export const dialogStyles = {
  dialog: {
    '& .MuiDialog-paper': {
      backgroundColor: colors.background.darkGreyOpaque,
      borderRadius: '8px',
      border: `1px solid ${colors.border.orangeLight}`,
      maxWidth: '600px',
      width: '100%',
      margin: '16px',
      '@media (max-width:600px)': {
        margin: '8px',
        width: 'calc(100% - 16px)',
      },
    }
  },
  dialogTitle: {
    backgroundColor: colors.background.darkGreyOpaque,
    color: colors.text.white,
    borderBottom: `1px solid ${colors.border.grey}`,
    padding: '20px 24px',
    '@media (max-width:600px)': {
      padding: '16px',
    },
    position: 'relative',
    '& .MuiTypography-root': {
      fontSize: '1.25rem',
      fontWeight: 500
    },
    '& .MuiIconButton-root': {
      position: 'absolute',
      right: '8px',
      top: '8px',
      color: colors.text.grey,
      '&:hover': {
        color: colors.text.white,
        backgroundColor: 'rgba(255, 255, 255, 0.1)'
      }
    }
  },
  dialogContent: {
    backgroundColor: colors.background.darkGreyOpaque,
    padding: '24px',
    '@media (max-width:600px)': {
      padding: '16px',
    },
    '& .MuiFormControl-root': {
      marginBottom: '16px',
      width: '100%'
    },
    '& .MuiInputBase-root': {
      color: colors.text.white,
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: colors.border.grey
      },
      '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: colors.border.orange
      },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: colors.primary.orange
      }
    },
    '& .MuiInputLabel-root': {
      color: colors.text.grey,
      backgroundColor: colors.background.darkGrey,
      padding: '0 8px',
      marginLeft: '-4px',
      marginRight: '-4px',
      transform: 'translate(14px, 16px) scale(1)',
      '&.Mui-focused, &.MuiFormLabel-filled': {
        transform: 'translate(14px, -9px) scale(0.75)'
      },
      '&.Mui-focused': {
        color: colors.primary.orange
      }
    },
    '& .MuiSelect-icon': {
      color: colors.text.grey
    },
    '& .MuiMenuItem-root': {
      color: colors.text.white,
      '&:hover': {
        backgroundColor: colors.background.hover
      },
      '&.Mui-selected': {
        backgroundColor: colors.background.active,
        '&:hover': {
          backgroundColor: colors.background.activeHover
        }
      }
    }
  },
  dialogActions: {
    backgroundColor: colors.background.darkGreyOpaque,
    borderTop: `1px solid ${colors.border.grey}`,
    padding: '16px 24px',
    '@media (max-width:600px)': {
      padding: '12px 16px',
    },
    '& .MuiButton-root': {
      minWidth: '100px',
      margin: '0 8px',
      '&:last-child': {
        marginRight: 0
      }
    }
  },
  submitButton: {
    backgroundColor: colors.primary.orange,
    color: colors.text.white,
    '&:hover': {
      backgroundColor: colors.primary.orangeHover
    }
  },
  cancelButton: {
    color: colors.text.grey,
    borderColor: colors.border.grey,
    '&:hover': {
      borderColor: colors.text.white,
      color: colors.text.white,
      backgroundColor: 'rgba(255, 255, 255, 0.1)'
    }
  }
};

export const layoutStyles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: colors.background.black,
  },
  logo: {
    height: '40px',
    '@media (min-width:600px)': {
      height: '50px',
    },
    margin: '1rem'
  },
  pageContainer: {
    display: 'flex',
    flex: 1,
    gap: 2,
    flexDirection: 'column',
    '@media (min-width:960px)': {
      flexDirection: 'row',
    },
  }
};

export const pageStyles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: colors.background.black,
    padding: '1rem',
    '@media (min-width:600px)': {
      padding: '2rem',
    },
  },
  logo: {
    height: '50px',
    '@media (min-width:600px)': {
      height: '60px',
    },
    marginBottom: '2rem',
    filter: 'brightness(0) invert(1)'
  }
};

export const sidebarStyles = {
  sidebar: {
    width: '100%',
    '@media (min-width:960px)': {
      width: '240px',
    },
    backgroundColor: colors.background.darkGrey,
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '8px',
    margin: '0.5rem',
    '@media (min-width:600px)': {
      margin: '1rem',
    },
    height: 'fit-content'
  },
  headerContainer: {
    padding: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: `1px solid ${colors.border.grey}`
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    '@media (min-width:600px)': {
      gap: '1rem',
    },
    padding: '1rem',
    borderBottom: `1px solid ${colors.border.grey}`,
    marginBottom: '1rem'
  },
  userName: {
    color: colors.text.white,
    fontSize: '0.875rem',
    '@media (min-width:600px)': {
      fontSize: '1rem',
    },
    fontWeight: 500
  },
  userDate: {
    color: colors.text.lightGrey,
    fontSize: '0.75rem',
    '@media (min-width:600px)': {
      fontSize: '0.875rem',
    },
  },
  menuContainer: {
    padding: '0.5rem',
    '@media (min-width:600px)': {
      padding: '1rem',
    },
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
    fontSize: '1.25rem',
    '@media (min-width:600px)': {
      fontSize: '1.5rem',
    },
  },
  sidebarText: {
    color: colors.text.white,
    fontSize: '0.875rem',
    '@media (min-width:600px)': {
      fontSize: '1rem',
    },
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
    margin: '0 auto',
    padding: '1rem',
    '@media (min-width:600px)': {
      padding: 0,
    },
  },
  paper: {
    backgroundColor: colors.background.darkGrey,
    borderRadius: '8px',
    border: `1px solid ${colors.border.orangeLight}`
  },
  formBox: {
    padding: '1rem',
    '@media (min-width:600px)': {
      padding: '2rem',
    },
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  title: {
    color: colors.text.white,
    textAlign: 'center',
    fontSize: '1.5rem',
    '@media (min-width:600px)': {
      fontSize: '1.75rem',
    },
    fontWeight: 500
  },

  textField: {
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
      },
      '& input': {
        backgroundColor: `${colors.background.darkGrey} !important`,
        color: `${colors.text.white} !important`
      },
      '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus': {
        WebkitBoxShadow: `0 0 0 1000px ${colors.background.darkGrey} inset !important`,
        WebkitTextFillColor: `${colors.text.white} !important`,
        caretColor: `${colors.text.white} !important`,
        backgroundColor: `${colors.background.darkGrey} !important`
      }
    },
    '& .MuiInputLabel-root': {
      color: colors.text.grey,
      backgroundColor: colors.background.darkGrey,
      padding: '0 8px',
      marginLeft: '-4px',
      marginRight: '-4px',
      transform: 'translate(14px, 16px) scale(1)',
      '&.Mui-focused, &.MuiFormLabel-filled': {
        transform: 'translate(14px, -9px) scale(0.75)'
      },
      '&.Mui-focused': {
        color: colors.primary.orange
      }
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
    padding: '0.5rem',
    '@media (min-width:600px)': {
      padding: '1rem',
    },
  },
  pageTitle: {
    color: colors.text.white,
    marginBottom: '1rem',
    '@media (min-width:600px)': {
      marginBottom: '2rem',
    },
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
      color: colors.text.white,
      fontSize: '0.875rem',
      '@media (min-width:600px)': {
        fontSize: '1rem',
      },
    },
    '& .MuiListItemText-secondary': {
      color: colors.text.grey,
      fontSize: '0.75rem',
      '@media (min-width:600px)': {
        fontSize: '0.875rem',
      },
    }
  }
};
