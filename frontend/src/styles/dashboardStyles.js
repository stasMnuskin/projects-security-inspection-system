import { colors } from './colors';

export const dashboardStyles = {
  filterBar: {
    display: 'flex',
    alignItems: 'center',
    gap: { xs: '8px', sm: '12px' },
    padding: { xs: '8px', sm: '12px 16px' },
    backgroundColor: colors.background.darkGrey,
    borderRadius: '8px',
    border: `2px solid ${colors.primary.orange}`,
    marginBottom: { xs: '12px', sm: '20px' },
    flexDirection: { xs: 'column', sm: 'row-reverse' },
    justifyContent: 'flex-start',
    width: '100%',
    '& > *:first-of-type': {
      order: 1
    }
  },
  filterIcon: {
    color: colors.text.white,
    marginLeft: { xs: '0', sm: '8px' },
    fontSize: '24px'
  },
  filterText: {
    color: colors.text.white,
    fontSize: { xs: '0.875rem', sm: '1rem' },
    fontWeight: 'normal'
  },
  filterSelect: {
    backgroundColor: colors.background.darkGrey,
    color: colors.text.white,
    minWidth: { xs: '100%', sm: '200px' },
    '& .MuiOutlinedInput-root': {
      color: colors.text.white,
      backgroundColor: colors.background.darkGrey,
      minHeight: { xs: '48px', md: '40px' },
      display: 'flex',
      alignItems: 'center',
      '& fieldset': {
        borderColor: colors.border.grey,
        borderRadius: '4px'
      },
      '&:hover fieldset': {
        borderColor: colors.border.orange
      },
      '&.Mui-focused fieldset': {
        borderColor: colors.primary.orange
      }
    },
    '& .MuiSelect-select, & .MuiInputBase-input': {
      padding: { xs: '8px 14px', md: '6px 14px' }
    },
    '& .MuiSvgIcon-root': {
      color: colors.text.grey,
      fontSize: '24px'
    },
    '& .MuiAutocomplete-endAdornment': {
      top: 'calc(50% - 16px)'
    }
  },
  datePicker: {
    backgroundColor: colors.background.darkGrey,
    minWidth: { xs: '100%', sm: '200px' },
    '& .MuiOutlinedInput-root': {
      color: colors.text.white,
      backgroundColor: colors.background.darkGrey,
      minHeight: { xs: '48px', md: '40px' },
      display: 'flex',
      alignItems: 'center',
      '& fieldset': {
        borderColor: colors.border.grey,
        borderRadius: '4px'
      },
      '&:hover fieldset': {
        borderColor: colors.border.orange
      },
      '&.Mui-focused fieldset': {
        borderColor: colors.primary.orange
      }
    },
    '& .MuiInputBase-input': {
      color: colors.text.white,
      padding: { xs: '8px 14px', md: '6px 14px' }
    },
    '& .MuiSvgIcon-root': {
      color: colors.text.grey,
      fontSize: '24px'
    }
  },
  overviewContainer: {
    display: 'flex',
    flexDirection: { xs: 'column', sm: 'row' },
    gap: { xs: '12px', sm: '20px' },
    marginBottom: { xs: '12px', sm: '20px' },
    backgroundColor: colors.background.darkGrey,
    padding: { xs: '12px', sm: '16px' },
    borderRadius: '8px',
    border: `2px solid ${colors.primary.orange}`
  },
  overviewBox: {
    flex: 1,
    backgroundColor: colors.background.black,
    padding: { xs: '12px', sm: '16px' },
    borderRadius: '4px',
    '& h6': {
      color: colors.text.grey,
      marginBottom: { xs: '4px', sm: '8px' },
      fontSize: { xs: '0.875rem', sm: '1rem' },
      fontWeight: 'normal'
    },
    '& h3': {
      color: colors.text.white,
      fontSize: { xs: '2rem', sm: '2.5rem' },
      fontWeight: 'bold'
    }
  },
  faultTablesContainer: {
    display: 'grid',
    gridTemplateColumns: {
      xs: '1fr',
      sm: 'repeat(2, 1fr)',
      md: 'repeat(3, 1fr)'
    },
    gap: { xs: '12px', sm: '20px' }
  },
  faultTable: {
    backgroundColor: colors.background.darkGrey,
    padding: { xs: '12px', sm: '16px' },
    borderRadius: '8px',
    border: `2px solid ${colors.primary.orange}`,
    '& h6': {
      color: colors.text.white,
      marginBottom: { xs: '8px', sm: '12px' },
      fontSize: { xs: '0.875rem', sm: '1rem' },
      fontWeight: 'normal'
    },
    '& table': {
      width: '100%',
      borderCollapse: 'collapse',
      '& th': {
        color: colors.text.grey,
        textAlign: 'right',
        padding: { xs: '6px', sm: '8px' },
        borderBottom: `1px solid ${colors.border.grey}`,
        fontWeight: 'normal',
        fontSize: { xs: '0.8rem', sm: '0.9rem' }
      },
      '& td': {
        color: colors.text.white,
        textAlign: 'right',
        padding: { xs: '6px', sm: '8px' },
        borderBottom: `1px solid ${colors.border.grey}`,
        fontSize: { xs: '0.8rem', sm: '0.9rem' }
      },
      '& tr:last-child td': {
        borderBottom: 'none'
      }
    }
  }
};
