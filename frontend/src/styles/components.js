import { colors } from './colors';
import { createTheme, responsiveFontSizes } from '@mui/material/styles';
import { heIL } from '@mui/material/locale';

// Create base theme
let theme = createTheme({
  direction: 'rtl',
  palette: {
    mode: 'dark',
    primary: {
      main: colors.primary.orange,
    },
    background: {
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
          }
        },
        select: {
          color: colors.text.white,
          textAlign: 'center',
          padding: '6px 8px',
          height: '24px',
          lineHeight: '24px',
          fontSize: '0.875rem',
          verticalAlign: 'middle',
          '&.MuiSelect-select': {
            color: `${colors.text.white} !important`,
            textAlign: 'center'
          },
          '&.Mui-focused': {
            color: `${colors.text.white} !important`,
            backgroundColor: 'transparent'
          }
        }
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
              padding: '6px',
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '12px 8px',
          '@media (max-width:1200px)': {
            padding: '8px 6px',
            fontSize: '0.875rem',
          },
          '@media (max-width:600px)': {
            padding: '4px',
            fontSize: '0.8125rem',
          },
        },
        head: {
          fontWeight: 'bold',
          whiteSpace: 'normal',
          wordBreak: 'keep-all',
          overflowWrap: 'normal',
          hyphens: 'none',
          wordSpacing: 'normal',
          minWidth: '70px',
          position: 'relative',
          '&.MuiTableCell-head': {
            wordBreak: 'keep-all',
            overflowWrap: 'normal'
          },
          '@media (max-width:1050px)': {
            fontSize: '0.9rem'
          },
          '@media (max-width:600px)': {
            fontSize: '0.8rem',
            padding: '5px 3px',
            minWidth: '50px'
          },
          '@media (max-width:425px)': {
            fontSize: '0.7rem',
            padding: '4px 2px',
            minWidth: '40px'
          }
        },
      },
    },
  },
}, heIL); 

theme = responsiveFontSizes(theme);

export { theme };

export const notificationRecipientsStyles = {
  button: {
    color: colors.text.white,
    borderColor: colors.border.grey,
    '&:hover': {
      borderColor: colors.border.orange,
      backgroundColor: 'rgba(255, 255, 255, 0.05)'
    }
  },
  dialog: {
    '& .MuiDialog-paper': {
      backgroundColor: colors.background.darkGrey,
      color: colors.text.white,
      minWidth: { xs: '90%', sm: 400 },
      maxWidth: { xs: '90%', sm: 500 },
      overflowX: 'hidden'
    }
  },
  dialogTitle: {
    borderBottom: `1px solid ${colors.border.grey}`,
    '& .MuiTypography-root': {
      fontSize: { xs: '1.1rem', sm: '1.25rem' }
    }
  },
  dialogContent: {
    padding: '0 !important',
    overflowX: 'hidden'
  },
  rolesList: {
    padding: 0,
    width: '100%',
    '& .MuiListItem-root': {
      borderBottom: `1px solid ${colors.border.grey}`,
      '&:hover': {
        backgroundColor: colors.background.hover
      }
    },
    '& .MuiListItemText-primary': {
      fontSize: { xs: '0.9rem', sm: '1rem' },
      color: colors.text.white
    }
  },
  usersList: {
    padding: 0,
    width: '100%',
    '& .MuiFormControlLabel-root': {
      margin: 0,
      width: '100%',
      padding: '8px 16px',
      boxSizing: 'border-box'
    },
    '& .MuiFormControlLabel-label': {
      fontSize: { xs: '0.85rem', sm: '0.95rem' },
      color: colors.text.white
    }
  },
  searchField: {
    margin: '16px',
    width: 'calc(100% - 32px)',
    '& .MuiOutlinedInput-root': {
      color: colors.text.white,
      '& fieldset': {
        borderColor: colors.border.grey,
      },
      '&:hover fieldset': {
        borderColor: colors.border.orange,
      },
      '&.Mui-focused fieldset': {
        borderColor: colors.primary.orange,
      }
    },
    '& .MuiInputLabel-root': {
      color: colors.text.grey,
      '&.Mui-focused': {
        color: colors.primary.orange,
      }
    },
    '& .MuiInputAdornment-root': {
      color: colors.text.grey
    }
  },
  checkbox: {
    color: colors.text.orange,
    '&.Mui-checked': {
      color: colors.text.orange
    }
  },
  noUsers: {
    padding: '16px',
    color: colors.text.grey,
    fontSize: { xs: '0.85rem', sm: '0.95rem' }
  },
  backButton: {
    color: colors.text.white,
    borderBottom: `1px solid ${colors.border.grey}`,
    borderRadius: 0,
    padding: '12px 16px',
    justifyContent: 'flex-start',
    width: '100%',
    '&:hover': {
      backgroundColor: colors.background.hover
    },
    '& .MuiSvgIcon-root': {
      marginLeft: '8px'
    }
  },
  dialogActions: {
    padding: '16px 24px',
    backgroundColor: colors.background.darkGrey,
    borderTop: `1px solid ${colors.border.grey}`,
    '@media (max-width:600px)': {
      padding: '12px 16px',
    }
  },
  saveButton: {
    backgroundColor: colors.primary.orange,
    color: colors.text.white,
    '&:hover': {
      backgroundColor: colors.primary.orangeHover
    }
  }
};

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
    height: '120px',
    '@media (min-width:600px)': {
      height: '140px',
    },
    margin: '0.5rem'
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
    padding: '0.5rem',
    '@media (min-width:600px)': {
      padding: '1rem',
    },
  },
  logo: {
    height: '140px',
    '@media (min-width:600px)': {
      height: '160px',
    },
    // marginBottom: '2rem',
    filter: 'invert(1)'
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
    padding: '0.5rem',
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
        backgroundColor: `${colors.background.darkGreyOpaque} !important`,
        color: `${colors.text.white} !important`
      },
      '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus': {
        WebkitBoxShadow: `0 0 0 1000px ${colors.background.darkGreyOpaque} inset !important`,
        WebkitTextFillColor: `${colors.text.white} !important`,
        caretColor: `${colors.text.white} !important`,
        backgroundColor: `${colors.background.darkGreyOpaque} !important`
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

export const selectStyles = {
  control: (base, state) => ({
    ...base,
    backgroundColor: colors.background.darkGreyOpaque,
    borderColor: state.isFocused ? colors.primary.orange : colors.border.grey,
    borderRadius: '4px',
    padding: '2px',
    '&:hover': {
      borderColor: colors.border.orange
    },
    boxShadow: 'none',
    minHeight: '40px',
    fontFamily: 'Assistant, sans-serif',
    fontSize: '0.9rem',
    flexDirection: 'row-reverse'
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: colors.background.darkGreyOpaque,
    border: `1px solid ${colors.border.grey}`,
    zIndex: 2,
    direction: 'ltr'
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected 
      ? colors.background.active 
      : state.isFocused 
        ? colors.background.hover 
        : 'transparent',
    color: colors.text.white,
    padding: '8px 12px',
    '&:hover': {
      backgroundColor: colors.background.hover
    },
    fontFamily: 'Assistant, sans-serif',
    fontSize: '0.9rem',
    direction: 'ltr',
    textAlign: 'left'
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: colors.background.darkGrey,
    margin: '2px',
    direction: 'ltr'
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: colors.text.white,
    padding: '2px 6px',
    fontFamily: 'Assistant, sans-serif',
    fontSize: '0.9rem',
    direction: 'ltr',
    textAlign: 'left'
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: colors.text.grey,
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      color: colors.text.white
    }
  }),
  input: (base) => ({
    ...base,
    color: colors.text.white,
    margin: '0 2px',
    fontFamily: 'Assistant, sans-serif',
    direction: 'ltr'
  }),
  placeholder: (base) => ({
    ...base,
    color: colors.text.grey,
    fontFamily: 'Assistant, sans-serif',
    fontSize: '0.9rem',
    direction: 'ltr'
  }),
  singleValue: (base) => ({
    ...base,
    color: colors.text.white,
    fontFamily: 'Assistant, sans-serif',
    fontSize: '0.9rem',
    direction: 'ltr',
    textAlign: 'left'
  }),
  valueContainer: (base) => ({
    ...base,
    padding: '2px 8px',
    gap: '2px',
    direction: 'ltr',
    textAlign: 'left'
  }),
  dropdownIndicator: (base) => ({
    ...base,
    color: colors.text.grey,
    padding: '4px',
    '&:hover': {
      color: colors.text.white
    }
  }),
  clearIndicator: (base) => ({
    ...base,
    color: colors.text.grey,
    padding: '4px',
    '&:hover': {
      color: colors.text.white
    }
  }),
  indicatorSeparator: (base) => ({
    ...base,
    backgroundColor: colors.border.grey
  })
};

export const fieldStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    color: colors.text.grey,
    fontSize: '0.9rem',
    '&.required::after': {
      content: '" *"',
      color: colors.primary.orange,
      marginRight: '4px'
    }
  }
};

export const formFieldStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    position: 'relative',
    '@media (max-width: 599px)': {
      '& .MuiAutocomplete-root': {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: colors.background.darkGrey,
        borderRadius: '4px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
        zIndex: 1000,
        marginTop: '4px',
        display: 'none',
        '& .MuiOutlinedInput-root': {
          backgroundColor: colors.background.darkGrey,
          borderRadius: '4px'
        }
      }
    }
  },
  label: {
    color: colors.text.grey,
    fontSize: '0.9rem',
    '@media (max-width: 599px)': {
      margin: 0,
      padding: '8px 12px',
      borderRadius: '4px',
      backgroundColor: colors.background.darkGrey,
      border: `1px solid ${colors.border.grey}`,
      cursor: 'pointer',
      textAlign: 'center',
      transition: 'all 0.2s ease',
      '&:hover': {
        borderColor: colors.border.orange
      }
    }
  },
  required: {
    color: colors.primary.orange
  }
};

export const datePickerStyles = {
  textField: {
    width: '100%',
    '& .MuiOutlinedInput-root': {
      ...selectStyles.control,
      padding: '2px 10px 2px 4px', 
      position: 'relative',
      minHeight: '40px !important',
      height: '40px',
      '& input': {
        height: '24px',
        padding: '6px 4px',
        fontSize: '0.875rem',
        color: colors.text.white,
        width: '100%',
        minWidth: '80px',
        textAlign: 'center'
      },
      '& .MuiInputAdornment-root': {
        margin: 0,
        position: 'absolute',
        right: '8px',
        top: '50%',
        transform: 'translateY(-50%)',
        height: 'auto',
        zIndex: 1,
        '& .MuiSvgIcon-root': {
          fontSize: '20px',
          color: colors.text.grey
        }
      },
      '@media (max-width: 599px)': {
        display: 'none'
      }
    },
    '@media (max-width: 599px)': {
      '& .MuiPickersPopper-root': {
        position: 'fixed !important',
        top: '50% !important',
        left: '50% !important',
        transform: 'translate(-50%, -50%) !important',
        maxWidth: '90vw',
        maxHeight: '90vh',
        '& .MuiPaper-root': {
          maxWidth: '100%',
          maxHeight: '100%'
        }
      }
    }
  }
};

export const statusMessageStyles = {
  loadingContainer: {
    display: 'flex', 
    justifyContent: 'center', 
    p: 3
  },
  noDataMessage: {
    color: colors.text.white,
    textAlign: 'center',
    variant: 'h6'
  },
  errorMessage: {
    color: 'error',
    textAlign: 'center',
    mt: 2
  }
};

export const pageContainerStyles = {
  container: {
    display: 'flex', 
    minHeight: '100vh',
    maxWidth: '100vw',
    overflow: 'hidden'
  },
  content: {
    flexGrow: 1, 
    py: { xs: 2, sm: 3 },
    px: 0,
    maxWidth: '100%',
    overflow: 'hidden'
  },
  title: {
    color: colors.text.white,
    mb: { xs: 2, sm: 3 },
    fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' }
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    bgcolor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1
  },
  noPermission: {
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh'
  }
};

export const dialogIconStyles = {
  closeButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    color: colors.text.grey,
    '&:hover': {
      color: colors.text.white,
      backgroundColor: 'rgba(255, 255, 255, 0.1)'
    }
  }
};

export const faultListStyles = {
  container: {
    width: '100%', 
    overflow: 'hidden',
    backgroundColor: colors.background.darkGrey,
    border: `1px solid ${colors.border.grey}`,
    borderRadius: '4px',
    maxWidth: '100%'
  },
  dateCell: {
    whiteSpace: 'normal',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontSize: '0.8rem',
    minWidth: '60px',
    wordBreak: 'keep-all',
    hyphens: 'manual',
    '@media (max-width: 600px)': {
      minWidth: '50px',
      fontSize: '0.75rem'
    },
    '@media (max-width: 425px)': {
      minWidth: '42px',
      fontSize: '0.65rem',
      lineHeight: '1.2'
    }
  },
  tableContainer: {
    maxWidth: '100%',
    overflowX: 'auto',
    '&::-webkit-scrollbar': {
      height: '6px'
    },
    '&::-webkit-scrollbar-track': {
      background: colors.background.darkGrey
    },
    '&::-webkit-scrollbar-thumb': {
      background: colors.border.grey,
      borderRadius: '3px',
      '&:hover': {
        background: colors.border.orange
      }
    }
  },
  table: {
    width: '100%',
    tableLayout: 'fixed',
    '@media (max-width: 600px)': {
      tableLayout: 'fixed',
      fontSize: '0.7rem'
    },
    '@media (max-width: 425px)': {
      fontSize: '0.65rem'
    }
  },
  tableCell: {
    whiteSpace: 'normal',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '200px',
    wordBreak: 'normal',
    wordWrap: 'normal',
    overflowWrap: 'normal',
    hyphens: 'none',
    padding: '8px 6px',
    minWidth: '70px',
    position: 'relative',
    '@media (max-width: 768px)': {
      padding: '6px 4px',
      fontSize: '0.75rem',
      minWidth: '60px'
    },
    '@media (max-width: 600px)': {
      minWidth: '50px'
    },
    '@media (max-width: 425px)': {
      padding: '4px 2px',
      fontSize: '0.65rem',
      lineHeight: '1.2',
      minWidth: '40px'
    }
  },
  cellWithMinWidth: {
    whiteSpace: 'normal',
    minWidth: '70px',
    wordBreak: 'break-word',
    '@media (max-width: 600px)': {
      minWidth: '50px',
      fontSize: '0.75rem'
    },
    '@media (max-width: 425px)': {
      minWidth: '40px',
      fontSize: '0.65rem'
    },
    '@media (min-width: 1200px)': {
      minWidth: '80px'
    },
    '@media (min-width: 1600px)': {
      minWidth: '100px'
    }
  },
  widerCell: {
    whiteSpace: 'normal',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    minWidth: '90px',
    wordBreak: 'break-word',
    '@media (max-width: 600px)': {
      minWidth: '60px',
      fontSize: '0.75rem'
    },
    '@media (max-width: 425px)': {
      minWidth: '45px',
      fontSize: '0.65rem'
    },
    '@media (min-width: 1200px)': {
      minWidth: '100px'
    },
    '@media (min-width: 1600px)': {
      minWidth: '120px'
    }
  },
  widestCell: {
    whiteSpace: 'normal',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    minWidth: '110px',
    wordBreak: 'break-word',
    '@media (max-width: 600px)': {
      minWidth: '70px',
      fontSize: '0.75rem'
    },
    '@media (max-width: 425px)': {
      minWidth: '50px',
      fontSize: '0.65rem'
    },
    '@media (min-width: 1200px)': {
      minWidth: '120px'
    },
    '@media (min-width: 1600px)': {
      minWidth: '150px'
    }
  },
  narrowCell: {
    whiteSpace: 'normal',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    minWidth: '60px',
    wordBreak: 'break-word',
    '@media (max-width: 600px)': {
      minWidth: '45px',
      fontSize: '0.75rem'
    },
    '@media (max-width: 425px)': {
      minWidth: '35px',
      fontSize: '0.65rem'
    },
    '@media (min-width: 1200px)': {
      minWidth: '70px'
    },
    '@media (min-width: 1600px)': {
      minWidth: '80px'
    }
  },
  editableCell: {
    cursor: 'pointer',
    whiteSpace: 'normal',
    wordBreak: 'break-word',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.05)'
    }
  },
  nonEditableCell: {
    cursor: 'default',
    whiteSpace: 'normal',
    wordBreak: 'break-word',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  siteLink: {
    color: colors.text.white,
    textDecoration: 'underline',
    cursor: 'pointer'
  },
  statusStyle: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '0.875rem',
    backgroundColor: colors.background.darkGrey,
    border: `1px solid ${colors.border.orange}`,
    color: colors.text.white
  },
  editField: {
    multiline: true,
    size: 'small',
    autoFocus: true,
    fullWidth: true,
    minWidth: '150px'
  },
  technicianEditField: {
    size: 'small',
    autoFocus: true,
    fullWidth: true,
    minWidth: '120px'
  },
  editIcon: {
    fontSize: 16,
    color: colors.border.orange
  },
  descriptionText: {
    color: colors.text.white
  },
  descriptionTextHelp: {
    color: colors.text.white,
    cursor: 'help'
  },
  descriptionBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 1
  },
  tooltipProps: {
    sx: {
      '& .MuiTooltip-tooltip': {
        backgroundColor: colors.background.black,
        border: `1px solid ${colors.border.grey}`,
        borderRadius: '4px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        maxWidth: 400,
        p: 1
      },
      '& .MuiTooltip-arrow': {
        color: colors.background.black,
        '&::before': {
          border: `1px solid ${colors.border.grey}`,
          backgroundColor: colors.background.black
        }
      }
    }
  },
  tooltipTypography: {
    whiteSpace: 'pre-wrap'
  },
  statusSelect: {
    minWidth: '100px'
  },
  dialogContentText: {
    color: colors.text.white
  },
  actionsCell: {
    whiteSpace: 'nowrap'
  },
  deleteIcon: {
    color: colors.text.white
  }
};

export const filterStyles = {
  filterBar: {
    display: 'flex',
    gap: '8px',
    padding: '12px',
    backgroundColor: colors.background.darkGrey,
    borderRadius: '8px',
    border: `2px solid ${colors.primary.orange}`,
    marginBottom: { xs: '12px', sm: '20px' },
    width: '100%',
    boxSizing: 'border-box',
    alignItems: 'center',
    '@media (min-width: 1600px)': {
      flexWrap: 'nowrap',
      gap: '8px'
    },
    '@media (min-width: 1020px) and (max-width: 1599px)': {
      flexWrap: 'nowrap',
      gap: '4px',
      '& > div': {
        flex: '0 1 auto',
        minWidth: 'auto'
      }
    },
    '@media (min-width: 600px) and (max-width: 1020px)': {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '8px'
    },
    '@media (max-width: 599px)': {
      flexWrap: 'wrap'
    },
    '& > div': {
      flex: 1,
      '& .MuiOutlinedInput-root': {
        ...selectStyles.control,
        padding: '2px 8px',
        width: '100%',
        '& input, & textarea, & select': {
          color: colors.text.white,
          textAlign: 'center',
          fontSize: '0.875rem'
        }
      },
      '@media (max-width: 599px)': {
        '& .MuiAutocomplete-root': {
          display: 'none'
        },
        '& .MuiFormLabel-root': {
          width: '100%',
          padding: '8px 12px',
          borderRadius: '4px',
          backgroundColor: colors.background.darkGrey,
          border: `1px solid ${colors.border.grey}`,
          cursor: 'pointer',
          textAlign: 'center',
          '&:hover': {
            borderColor: colors.border.orange
          }
        }
      }
    },
    '& > div:first-of-type': {
      display: 'none'
    },
    '& > div:nth-of-type(2)': {
      flex: 2,
      '@media (min-width: 600px) and (max-width: 1020px)': {
        gridColumn: 'span 2'
      }
    }
  },
  filterIcon: {
    color: colors.text.white,
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%'
  },
  entrepreneurFilter: {
    width: '100%',
    height: '100%',
    '& .MuiOutlinedInput-root': {
      ...selectStyles.control,
      padding: '2px 8px',
      height: '100%',
      '& input': {
        color: colors.text.white
      }
    }
  },
  filterSelect: {
    width: '100%',
    height: '100%',
    '& .MuiOutlinedInput-root': {
      ...selectStyles.control,
      padding: '2px 8px',
      height: '100%',
      '& input, & textarea, & select': {
        color: colors.text.white
      }
    }
  },
  datePicker: {
    width: '100%',
    height: '100%',
    '& .MuiOutlinedInput-root': {
      ...selectStyles.control,
      padding: '2px 8px',
      height: '40px',
      '& input': {
        height: '24px',
        padding: '6px 8px',
        fontSize: '0.875rem',
        color: colors.text.white,
        textAlign: 'center'
      }
    }
  },
  dateRangeContainer: {
    display: 'flex',
    flexDirection: 'row-reverse',
    gap: '8px',
    width: '100%',
    '& > div': {
      flex: 1,
      '& .MuiFormControl-root': {
        width: '100%'
      }
    },
    '& .MuiOutlinedInput-root': {
      '& input': {
        textAlign: 'center',
        direction: 'rtl'
      }
    }
  }
};
