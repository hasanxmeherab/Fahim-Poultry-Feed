import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';
import { showErrorToast, showSuccessToast } from '../utils/notifications.js';

// MUI Imports
import { Box, Button, TextField, Typography, Paper } from '@mui/material';

const AddProductPage = () => {
    const [formData, setFormData] = useState({ name: '', sku: '', price: '', quantity: '' });
    const [submitError, setSubmitError] = useState(null);
    const [skuError, setSkuError] = useState(''); // State for real-time SKU validation
    const navigate = useNavigate();

    // This 'useEffect' hook watches for changes to the SKU input field
    useEffect(() => {
        // Don't run the check if the SKU field is empty
        if (!formData.sku) {
            setSkuError('');
            return;
        }

        // This function will be called after the user stops typing
        const checkSku = async () => {
            try {
                const response = await api.get(`/products/check-sku?sku=${formData.sku}`);
                if (response.data.exists) {
                    setSkuError('This SKU is already in use.');
                } else {
                    setSkuError('');
                }
            } catch (err) {
                console.error("SKU check failed:", err);
            }
        };

        // This creates a delay (500ms). If the user types again, the timer is reset.
        const timerId = setTimeout(() => {
            checkSku();
        }, 500);
        
        // This is a cleanup function to cancel the timer if the component unmounts or if the user types again
        return () => clearTimeout(timerId);

    }, [formData.sku]); // The effect re-runs only when formData.sku changes

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (skuError) { // Prevent submission if there's a known error
            showErrorToast({ message: 'Please fix the SKU error before submitting.' });
            return;
        }
        //setSubmitError(null);
        try {
            await api.post('/products', formData);
            showSuccessToast('Product added successfully!');
           setTimeout(() => {
            navigate('/inventory');
        }, 1000);
        } catch (err) {
            showErrorToast(err, 'Failed to add product.');
        }
    };

    return (
        <Box sx={{ maxWidth: '600px', margin: 'auto', p: 3 }}>
            <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
                <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
                    Add New Product
                </Typography>
                
                <TextField
                    fullWidth
                    label="Product Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    sx={{ mb: 2 }}
                />
                
                <TextField
                    fullWidth
                    label="SKU (Stock Keeping Unit)"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    required
                    error={!!skuError} // The input field will turn red if there's a skuError
                    helperText={skuError} // This displays the error message below the input
                    sx={{ mb: 2 }}
                />

                <TextField
                    fullWidth
                    label="Price (TK)"
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    sx={{ mb: 2 }}
                />

                <TextField
                    fullWidth
                    label="Initial Quantity in Stock"
                    name="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                    sx={{ mb: 2 }}
                />
                
                {submitError && <Typography color="error" sx={{ mb: 2 }}>{submitError}</Typography>}
                
                <Button type="submit" variant="contained" disabled={!!skuError} fullWidth>
                    Save Product
                </Button>
            </Paper>
        </Box>
    );
};

export default AddProductPage;