import React, { useState } from 'react';
import api from '../api/api.js';
import { useNavigate } from 'react-router-dom';

// MUI Imports
import { Box, Button, TextField, Typography, Paper, CircularProgress  } from '@mui/material';

// Import our notification utility
import { showErrorToast, showSuccessToast } from '../utils/notifications.js';

const AddCustomerPage = () => {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const navigate = useNavigate();

const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'phone') {
        // This regex replaces any character that is NOT a digit with an empty string
        const numericValue = value.replace(/[^0-9]/g, '');
        setFormData({ ...formData, [name]: numericValue });
    } else {
        setFormData({ ...formData, [name]: value });
    }
};

  // In AddCustomerPage.jsx

const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setFormErrors({});

    try {
      await api.post('/customers', formData);
      showSuccessToast('Customer added successfully!');
      navigate('/customers');
    } catch (err) {
      // Check if this is a validation error from our backend
      if (err.response && err.response.status === 400 && err.response.data.errors) {
        // Transform the backend's error array into a more usable object
        const errorData = err.response.data.errors.reduce((acc, current) => {
          const fieldName = Object.keys(current)[0];
          acc[fieldName] = current[fieldName];
          return acc;
        }, {});
        setFormErrors(errorData); 
      } else {
        // For all other errors, show the generic toast
        showErrorToast(err, 'Failed to add customer.');
      }
    } finally {
      setIsLoading(false);
    }
};

  return (
    <Box sx={{ maxWidth: '600px', margin: 'auto', p: 3 }}>

        <Paper component="form" onSubmit={handleSubmit} noValidate sx={{ p: 3 }}>
            <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
                Add New Customer
            </Typography>
            
            <TextField 
                fullWidth 
                label="Name" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                required 
                sx={{ mb: 2 }}
                // Add these two props
                error={!!formErrors.name}
                helperText={formErrors.name || ''}
            />
            <TextField 
                fullWidth 
                label="Phone" 
                name="phone" 
                value={formData.phone} 
                onChange={handleChange} 
                required 
                sx={{ mb: 2 }}
                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                // Add these two props
                error={!!formErrors.phone}
                helperText={formErrors.phone || ''}
            />
            <TextField 
                fullWidth 
                label="Email (Optional)" 
                name="email" 
                type="email" 
                value={formData.email} 
                onChange={handleChange} 
                sx={{ mb: 2 }} 
            />
            <TextField 
                fullWidth 
                label="Address (Optional)" 
                name="address" 
                value={formData.address} 
                onChange={handleChange} 
                sx={{ mb: 2 }} 
            />
            
            <Button type="submit" variant="contained" fullWidth disabled={isLoading}>
                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Save Customer'}
            </Button>
        </Paper>
    </Box>
  );
};

export default AddCustomerPage;