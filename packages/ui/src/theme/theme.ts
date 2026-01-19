import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#2563EB',
      light: '#DBEAFE',
      dark: '#1E40AF',
    },
    secondary: {
      main: '#64748B',
    },
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#3f3f3f',
      secondary: '#666',
      disabled: '#b8b8b8',
    },
    divider: '#ccc',
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontSize: 14,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});
