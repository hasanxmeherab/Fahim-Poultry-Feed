import React, { useState, useEffect } from 'react';
import api from '../api/api.js';
import { useParams, useNavigate } from 'react-router-dom';
import { showErrorToast, showSuccessToast } from '../utils/notifications.js';

// MUI Imports
import { Box, Button, TextField, Typography, Paper, CircularProgress } from '@mui/material';

const EditWholesaleProductPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await api.get(`/wholesale-products/${id}`);
                setName(response.data.name);
            } catch (err) {
                setError('Failed to fetch product data.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.patch(`/wholesale-products/${id}`, { name });
            showSuccessToast('Wholesale product updated successfully!');
            setTimeout(() => {
                navigate('/wholesale');
                }, 1000);
        } catch (err) {
            showErrorToast(err, 'Failed to update product.');
        }
    };

    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    return (
        <Box sx={{ maxWidth: '600px', margin: 'auto', p: 3 }}>
            <Paper component="form" onSubmit={handleSubmit} noValidate sx={{ p: 3 }}>
                <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
                    Edit Wholesale Product
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
                    Save Changes
                </Button>
            </Paper>
        </Box>
    );
};

export default EditWholesaleProductPage;