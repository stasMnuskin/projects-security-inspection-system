import { colors } from './colors';

// Base style mixins for reuse
const baseMixins = {
  // Base sizing and spacing
  tableCellSpacing: {
    padding: '10px 6px',
    '@media (max-width:1200px)': {
      padding: '8px 5px',
      fontSize: '0.875rem',
    },
    '@media (max-width:1050px)': {
      padding: '6px 4px',
      fontSize: '0.85rem',
    },
    '@media (max-width:600px)': {
      padding: '4px 2px',
      fontSize: '0.8125rem',
    },
  },
  
  // Text handling mixins
  noWrap: {
    whiteSpace: 'nowrap',
    overflow: 'visible',
  },
  
  normalWrap: {
    whiteSpace: 'normal',
    wordBreak: 'normal',
    hyphens: 'none',
  },
  
  // Size mixins - for applying consistent sizing
  cellSizes: {
    narrow: {
      minWidth: '55px',
      '@media (max-width: 1050px)': { minWidth: '50px' },
      '@media (max-width: 600px)': { minWidth: '45px' },
      '@media (max-width: 425px)': { minWidth: '35px' },
    },
    default: {
      minWidth: '65px',
      '@media (max-width: 1050px)': { minWidth: '60px' },
      '@media (max-width: 600px)': { minWidth: '50px' },
      '@media (max-width: 425px)': { minWidth: '40px' },
    },
    wider: {
      minWidth: '85px',
      '@media (max-width: 1050px)': { minWidth: '75px' },
      '@media (max-width: 600px)': { minWidth: '60px' },
      '@media (max-width: 425px)': { minWidth: '45px' },
    },
    widest: {
      minWidth: '100px',
      '@media (max-width: 1050px)': { minWidth: '90px' },
      '@media (max-width: 600px)': { minWidth: '70px' },
      '@media (max-width: 425px)': { minWidth: '50px' },
    },
  },
  
  // For date columns specifically
  dateCell: {
    fontSize: '0.8rem',
    minWidth: '60px',
    '@media (max-width: 1050px)': {
      minWidth: '55px',
      fontSize: '0.75rem',
    },
    '@media (max-width: 600px)': {
      minWidth: '50px',
      fontSize: '0.75rem',
    },
    '@media (max-width: 425px)': {
      minWidth: '42px',
      fontSize: '0.65rem',
      lineHeight: '1.2',
    },
  },

  // Body cell with overflow and ellipsis
  bodyCellEllipsis: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    wordBreak: 'break-word',
  },
};

// Main table styles
export const tableStyles = {
  // Table container - handles overflow and scrolling
  container: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: colors.background.darkGrey,
    border: `1px solid ${colors.border.grey}`,
    borderRadius: '4px',
    maxWidth: '100%',
  },
  
  // Scrollable container
  scrollContainer: {
    maxWidth: '100%',
    overflowX: 'auto',
    // Ensure horizontal scrolling works properly
    width: '100%',
    // Scrollbar styling
    '&::-webkit-scrollbar': {
      height: '6px',
    },
    '&::-webkit-scrollbar-track': {
      background: colors.background.darkGrey,
    },
    '&::-webkit-scrollbar-thumb': {
      background: colors.border.grey,
      borderRadius: '3px',
      '&:hover': {
        background: colors.border.orange,
      },
    },
  },
  
  // Table element
  table: {
    width: '100%',
    '@media (min-width: 1051px)': {
      // Use valid CSS values to prevent horizontal scrollbar
      minWidth: 'initial',
      tableLayout: 'fixed',
    },
    '@media (max-width: 1050px)': {
      // Set fixed minWidth below 1050px to ensure scrolling works
      minWidth: '880px',
    },
    '@media (max-width: 600px)': {
      fontSize: '0.7rem',
      minWidth: '780px',
    },
    '@media (max-width: 425px)': {
      fontSize: '0.65rem',
      minWidth: '680px',
    },
  },
  
  // Header cells - consistently styled, no ellipsis truncation
  headCell: {
    ...baseMixins.tableCellSpacing,
    fontWeight: 'bold',
    // Allow text to wrap between words but never break words
    whiteSpace: 'normal',
    wordBreak: 'normal',
    wordWrap: 'break-word',
    overflow: 'visible', // Never hide content in headers
    hyphens: 'none',
    '@media (max-width:1200px)': {
      fontSize: '0.9rem',
      padding: '7px 4px',
    },
    '@media (max-width:1050px)': {
      fontSize: '0.85rem',
      padding: '6px 3px',
    },
    '@media (max-width:600px)': {
      fontSize: '0.8rem',
      padding: '5px 3px',
    },
    '@media (max-width:425px)': {
      fontSize: '0.7rem',
      padding: '4px 2px',
    },
  },
  
  // Body cells - base styling
  bodyCell: {
    ...baseMixins.tableCellSpacing,
    ...baseMixins.normalWrap,
    ...baseMixins.bodyCellEllipsis,
    position: 'relative',
    '@media (max-width: 1050px)': {
      padding: '6px 4px',
      fontSize: '0.8rem',
    },
    '@media (max-width: 768px)': {
      padding: '5px 3px',
      fontSize: '0.75rem',
    },
    '@media (max-width: 425px)': {
      padding: '4px 2px',
      fontSize: '0.65rem',
      lineHeight: '1.2',
    },
  },
  
  // Cell size variants
  narrowCell: {
    ...baseMixins.cellSizes.narrow,
  },
  
  defaultCell: {
    ...baseMixins.cellSizes.default,
  },
  
  widerCell: {
    ...baseMixins.cellSizes.wider,
  },
  
  widestCell: {
    ...baseMixins.cellSizes.widest,
  },
  
  dateCell: {
    ...baseMixins.dateCell,
    wordBreak: 'keep-all',
    hyphens: 'manual',
    overflow: 'visible', // Dates should always be fully visible
    whiteSpace: 'nowrap', // Prevent dates from wrapping
    textOverflow: 'clip', // Don't show ellipsis for dates
  },
  
  // Interactive elements
  editableCell: {
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
  },
  
  nonEditableCell: {
    cursor: 'default',
  },
  
  // Special cell types
  actionsCell: {
    whiteSpace: 'nowrap',
  },
  
  linkCell: {
    color: colors.text.white,
    textDecoration: 'underline',
    cursor: 'pointer',
  },
  
  statusBadge: {
    display: 'inline-block',
    padding: '4px 6px',
    borderRadius: '4px',
    fontSize: '0.875rem',
    backgroundColor: colors.background.darkGrey,
    border: `1px solid ${colors.border.orange}`,
    color: colors.text.white,
    '@media (max-width: 600px)': {
      padding: '3px 5px',
      fontSize: '0.8rem',
    },
  },
  
  // Form elements within cells
  cellFormField: {
    multiline: true,
    size: 'small',
    autoFocus: true,
    fullWidth: true,
    minWidth: '120px',
    '@media (max-width: 600px)': {
      minWidth: '100px',
    },
  },
  
  cellIcon: {
    fontSize: 16,
    color: colors.border.orange,
    '@media (max-width: 600px)': {
      fontSize: 14,
    },
  },
  
  // Cell content helpers
  textContent: {
    color: colors.text.white,
  },
  
  helpCursor: {
    cursor: 'help',
  },
  
  contentBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
  },
  
  // Tooltip styling
  tooltipProps: {
    sx: {
      '& .MuiTooltip-tooltip': {
        backgroundColor: colors.background.black,
        border: `1px solid ${colors.border.grey}`,
        borderRadius: '4px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        maxWidth: 400,
        p: 1,
      },
      '& .MuiTooltip-arrow': {
        color: colors.background.black,
        '&::before': {
          border: `1px solid ${colors.border.grey}`,
          backgroundColor: colors.background.black,
        },
      },
    },
  },
  
  tooltipTypography: {
    whiteSpace: 'pre-wrap',
  },

  truncatedText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    display: 'inline-block',
    maxWidth: '100%',
    unicodeBidi: 'plaintext',
  },
};

// Helper function to compose cell styles
export const composeStyles = (...styles) => {
  return styles.reduce((acc, style) => ({ ...acc, ...style }), {});
};

// Utility functions for common cell types
export const getCellStyle = (size = 'default', isEditable = false) => {
  const sizeMap = {
    narrow: tableStyles.narrowCell,
    default: tableStyles.defaultCell,
    wider: tableStyles.widerCell,
    widest: tableStyles.widestCell,
    date: tableStyles.dateCell,
  };
  
  const baseStyle = tableStyles.bodyCell;
  const sizeStyle = sizeMap[size] || sizeMap.default;
  const interactionStyle = isEditable ? tableStyles.editableCell : tableStyles.nonEditableCell;
  
  return composeStyles(baseStyle, sizeStyle, interactionStyle);
};

export const getHeadCellStyle = (size = 'default') => {
  const sizeMap = {
    narrow: tableStyles.narrowCell,
    default: tableStyles.defaultCell,
    wider: tableStyles.widerCell,
    widest: tableStyles.widestCell,
    date: tableStyles.dateCell,
  };
  
  return composeStyles(tableStyles.headCell, sizeMap[size] || sizeMap.default);
};

// Utility function to format dates based on screen size
export const formatDate = (dateString, screenWidth = window.innerWidth) => {
  if (!dateString) return '-';
  
  const dateObj = new Date(dateString);
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear();
  
  // For screens below 1050px, use short format
  if (screenWidth <= 1050) {
    // Short year (last 2 digits)
    const shortYear = year.toString().slice(-2);
    return `${day}.${month}.${shortYear}`;
  }
  
  // Full format for larger screens
  return `${day}.${month}.${year}`;
};
