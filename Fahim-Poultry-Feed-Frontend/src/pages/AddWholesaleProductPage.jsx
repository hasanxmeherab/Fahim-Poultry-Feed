import React, { useState } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';
import { showErrorToast, showSuccessToast } from '../utils/notifications.js';

// MUI Imports
import { Box, Button, TextField, Typography, Paper } from '@mui/material';

const AddWholesaleProductPage = () => {
    const [name, setName] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/wholesale-products', { name });
            showSuccessToast('Wholesale product added successfully!');
            setTimeout(() => {
                navigate('/wholesale');
                }, 1000);
        } catch (err) {
            showErrorToast(err, 'Failed to add product.');
        }
    };

    return (
        <Box sx={{ maxWidth: '600px', margin: 'auto', p: 3 }}>
            <Paper component="form" onSubmit={handleSubmit} noValidate sx={{ p: 3 }}>
                <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
                    Add New Wholesale Product
                </Typography>
                
                <TextField
                    fullWidth
                    autoFocus
                    label="Product Name"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    sx={{ mb: 2 }}
                />
                
                {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
                
                <Button type="submit" variant="contained" fullWidth>
                    Save Product
                </Button>
            </Paper>
        </Box>
    );
};

export default AddWholesaleProductPage;