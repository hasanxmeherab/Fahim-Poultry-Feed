// frontend/src/pages/AddWholesaleBuyerPage.jsx

import React, { useState } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';

// MUI Imports
import { Box, Button, TextField, Typography, Paper } from '@mui/material';

const AddWholesaleBuyerPage = () => {
  // All state and logic functions are preserved
  const [formData, setFormData] = useState({ name: '', businessName: '', phone: '', address: '' });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/wholesale-buyers', formData);
      navigate('/wholesale'); // Navigate back to the main wholesale page
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add buyer.');
    }
  };
  // End of preserved logic

  return (
    <Box sx={{ maxWidth: '600px', margin: 'auto', p: 3 }}>
        <Paper component="form" onSubmit={handleSubmit} noValidate sx={{ p: 3 }}>
            <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
                Add New Wholesale Buyer
            </Typography>
            
            <TextField
                fullWidth
                label="Contact Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                sx={{ mb: 2 }}
            />
            
            <TextField
                fullWidth
                label="Business Name (Optional)"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                sx={{ mb: 2 }}
            />

            <TextField
                fullWidth
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
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
            
            {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
            
            <Button type="submit" variant="contained" fullWidth>
                Save Buyer
            </Button>
        </Paper>
    </Box>
  );
};

export default AddWholesaleBuyerPage;