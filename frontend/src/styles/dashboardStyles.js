import { colors } from './colors';

const dashboardStyles = {
  // Main container styles
  mainContainer: {
    flexGrow: 1, 
    p: 3,
    overflowX: 'hidden'
  },
  pageTitle: {
    color: colors.text.white,
    marginBottom: 3
  },
  // Overview section styles
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
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
      backgroundColor: colors.background.darkGrey
    },
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
  // Loading overlay styles
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
  // Fault tables styles
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
  },
  // Chart paper styles
  chartPaper: {
    backgroundColor: colors.background.darkGrey,
    padding: { xs: '8px', sm: '12px', lg: '16px' }, 
    borderRadius: '8px',
    border: `2px solid ${colors.primary.orange}`,
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '@media (min-width: 600px) and (max-width: 769px)': {
      minHeight: '350px', 
      padding: '16px', 
      '& > div': {
        width: '100%',
        maxWidth: '550px'  
      }
    },
    '@media (min-width: 770px) and (max-width: 899px)': {
      minHeight: '350px', 
      padding: '16px', 
      '& > div': {
        width: '100%',
        maxWidth: '500px' 
      }
    },
    '@media (min-width: 900px) and (max-width: 1199px)': {
      minHeight: '350px', 
      padding: '12px', 
      '& > div': {
        width: '100%',
        maxWidth: '450px' 
      }
    },
    '@media (min-width: 1200px)': {
      minHeight: '400px', 
      padding: '12px', 
      '& > div': {
        width: '100%',
        maxWidth: '600px' 
      }
    },
    '& h6': {
      color: colors.text.white,
      marginBottom: { xs: '8px', sm: '12px', lg: '16px' },
      fontSize: { xs: '0.875rem', sm: '1rem' },
      fontWeight: 'normal',
      textAlign: 'center'
    }
  }
};

export { dashboardStyles };
