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
    MuiButton: { styleOverrides: { root: { borderRadius: 2 } } }
  }
});

export default theme;