import React, { useState } from 'react';
import api from '../api/api.js';
import { useNavigate } from 'react-router-dom';

// MUI Imports
import { Box, Button, TextField, Typography, Paper } from '@mui/material';

// Import our notification utility
import { showErrorToast, showSuccessToast } from '../utils/notifications.js';

const AddCustomerPage = () => {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/customers', formData);
      
      // 1. Show the success message
      showSuccessToast('Customer added successfully!');
      
      // 2. Wait 1 second before navigating to allow the toast to be seen
      setTimeout(() => {
        navigate('/customers');
      }, 1000); 

    } catch (err) {
      showErrorToast(err, 'Failed to add customer.');
    }
  };

  return (
    <Box sx={{ maxWidth: '600px', margin: 'auto', p: 3 }}>
        <Paper component="form" onSubmit={handleSubmit} noValidate sx={{ p: 3 }}>
            <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
                Add New Customer
            </Typography>
            
            <TextField fullWidth label="Name" name="name" value={formData.name} onChange={handleChange} required sx={{ mb: 2 }} />
            <TextField fullWidth label="Phone" name="phone" value={formData.phone} onChange={handleChange} required sx={{ mb: 2 }} />
            <TextField fullWidth label="Email (Optional)" name="email" type="email" value={formData.email} onChange={handleChange} sx={{ mb: 2 }} />
            <TextField fullWidth label="Address (Optional)" name="address" value={formData.address} onChange={handleChange} sx={{ mb: 2 }} />
            
            <Button type="submit" variant="contained" fullWidth>
                Save Customer
            </Button>
        </Paper>
    </Box>
  );
};

export default AddCustomerPage;