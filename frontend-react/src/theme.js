import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2563eb' },
    secondary: { main: '#64748b' },
    success: { main: '#16a34a' },
    warning: { main: '#ea580c' },
    error: { main: '#dc2626' },
    info: { main: '#0284c7' },
    background: { default: '#f8fafc', paper: '#ffffff' }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 }
  },
  components: {
    MuiCard: { defaultProps: { sx: { borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } } },
    MuiPaper: { defaultProps: { sx: { borderRadius: 2 } } },
    MuiButton: { styleOverrides: { root: { borderRadius: 2 } } },
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          boxSizing: 'border-box',
        },
        html: {
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        body: {
          overflowX: 'hidden', // Prevent horizontal scrolling
        },
        '#root': {
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          '@media (max-width: 600px)': {
            paddingLeft: '8px',
            paddingRight: '8px',
          },
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          '@media (max-width: 900px)': {
            overflowX: 'auto',
            '&::-webkit-scrollbar': {
              height: '8px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0,0,0,0.2)',
              borderRadius: '4px',
            },
          },
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          minWidth: 600, // Ensure minimum width for proper display
          '@media (max-width: 900px)': {
            minWidth: 'auto',
          },
        },
      },
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
});

export default theme;