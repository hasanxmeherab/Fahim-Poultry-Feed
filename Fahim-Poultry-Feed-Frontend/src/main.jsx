import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

// --- NEW Theme Options ---
let themeOptions = { // Use 'let'
  palette: {
    // Note: User provided `mode: 'dark'`, but background `#f2f4f6` (light grey) and text `#00050d` (near black) suggest a light theme.
    // Setting to 'light'. Change to 'dark' if needed, but then adjust text/background colors significantly.
    mode: 'light',
    primary: {
      main: '#00235b', // Dark Blue
      // contrastText: '#00050d', // MUI usually handles this well, uncomment to override
    },
    secondary: {
      main: '#e21818', // Red
      // contrastText: '#00050d',
    },
    // divider: '#ffdd83', // Yellowish divider (might need adjustment based on mode)
    // text: { // Text colors often differ between light/dark modes
    //   primary: '#00050d', // Very dark blue/black (good for light mode)
    //   secondary: 'rgba(0, 5, 13, 0.6)', // Adjusted rgba format
    //   disabled: 'rgba(0, 5, 13, 0.38)', // Adjusted rgba format
    //   // hint: '#ffdd83',
    // },
    background: {
      default: '#f2f4f6', // Light Grey background
      paper: '#ffffff', // Default paper for light mode
    },
    // Consider adding standard MUI colors for consistency
     error: { main: '#d32f2f' },
     warning: { main: '#ffa000' },
     info: { main: '#1976d2' },
     success: { main: '#388e3c' },
     divider: 'rgba(0, 0, 0, 0.12)', // Default light mode divider
     text: { // Standard light mode text colors often work best unless specific branding needed
         primary: 'rgba(0, 0, 0, 0.87)',
         secondary: 'rgba(0, 0, 0, 0.6)',
         disabled: 'rgba(0, 0, 0, 0.38)',
     },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 }, h2: { fontWeight: 700 }, h3: { fontWeight: 700 },
    h4: { fontWeight: 600 }, h5: { fontWeight: 600 }, h6: { fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true, },
      styleOverrides: { root: { textTransform: 'none', borderRadius: '8px', }, }
    },
    MuiPaper: {
      defaultProps: { elevation: 2, },
      styleOverrides: { root: { borderRadius: '8px', } }
    },
    MuiTextField: {
        defaultProps: { variant: 'outlined', size: 'small', }
    },
    MuiTableCell: {
        styleOverrides: { head: { fontWeight: 'bold', backgroundColor: 'rgba(0, 0, 0, 0.04)' } }
    },
    MuiLink: { styleOverrides: { root: { fontWeight: 500, } } },
  },
  shape: {
      borderRadius: 8,
  },
};
// --- End NEW Theme Options ---

// Create the theme and make fonts responsive
let theme = createTheme(themeOptions);
theme = responsiveFontSizes(theme);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AuthProvider>
            <App />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);