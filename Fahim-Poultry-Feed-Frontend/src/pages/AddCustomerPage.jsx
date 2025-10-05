// frontend/src/pages/AddCustomerPage.jsx

import React, { useState } from 'react';
import api from '../api/api.js';
import { useNavigate } from 'react-router-dom';

// MUI Imports
import { Box, Button, TextField, Typography, Paper } from '@mui/material';

const AddCustomerPage = () => {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '' });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/customers', formData);
      navigate('/customers');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add customer.');
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
            
            {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
            
            <Button type="submit" variant="contained" fullWidth>
                Save Customer
            </Button>
        </Paper>
    </Box>
  );
};

export default AddCustomerPage;