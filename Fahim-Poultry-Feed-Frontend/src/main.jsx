import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom';
import './index.css'
// import Modal from 'react-modal'; // No longer needed if using MUI Dialog/Modal
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/AuthContext';

// --- NEW: Import React Query ---
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Optional: React Query DevTools for debugging
//import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
// --- END NEW ---

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Configure default caching behavior (e.g., 5 minutes)
      staleTime: 1000 * 60 * 5, 
      // Optional: Disable excessive refetching on window focus if not desired
      refetchOnWindowFocus: false, 
    },
  },
});

// This creates a default theme
const theme = createTheme();
// Modal.setAppElement('#root'); // Not needed for MUI Modals/Dialogs

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* --- NEW: Wrap with QueryClientProvider --- */}
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline /> {/* This resets CSS for consistency */}
          <AuthProvider>
            <App />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
      {/* Optional: Add DevTools for debugging query cache */}
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
    {/* --- END NEW --- */}
  </React.StrictMode>,
);
