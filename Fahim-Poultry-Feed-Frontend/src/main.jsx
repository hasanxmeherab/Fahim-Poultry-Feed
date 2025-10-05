import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'; // Import BrowserRouter
import './index.css'
import Modal from 'react-modal';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// This creates a default theme
const theme = createTheme();
Modal.setAppElement('#root');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      
      <ThemeProvider theme={theme}>
        <CssBaseline /> {/* This resets CSS for consistency */}
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);