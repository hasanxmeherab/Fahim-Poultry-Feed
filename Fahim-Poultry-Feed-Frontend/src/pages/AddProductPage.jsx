import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';
import { showErrorToast, showSuccessToast } from '../utils/notifications.js';

// MUI Imports
import { Box, Button, TextField, Typography, Paper, CircularProgress  } from '@mui/material';

const AddProductPage = () => {
    const [formData, setFormData] = useState({ name: '', sku: '', price: '', quantity: '' });
    const [submitError, setSubmitError] = useState(null);
    const [skuError, setSkuError] = useState(''); // State for real-time SKU validation
    const [isLoading, setIsLoading] = useState(false);
    const [formErrors, setFormErrors] = useState({});
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
        setIsLoading(true);
        setFormErrors({});
        try {
            await api.post('/products', formData);
            showSuccessToast('Product added successfully!');
            navigate('/inventory');
        } catch (err) {
            if (err.response && err.response.status === 400 && err.response.data.errors) {
                const errorData = err.response.data.errors.reduce((acc, current) => {
                    const fieldName = Object.keys(current)[0];
                    acc[fieldName] = current[fieldName];
                    return acc;
                }, {});
                setFormErrors(errorData);
            } else {
                showErrorToast(err, 'Failed to add product.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box sx={{ maxWidth: '600px', margin: 'auto', p: 3 }}>
                <Paper component="form" onSubmit={handleSubmit} noValidate sx={{ p: 3 }}>                   <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
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
                    error={!!formErrors.name}
                    helperText={formErrors.name || ''}
                />
                
                <TextField
                    fullWidth
                    label="SKU (Stock Keeping Unit)"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    required
                    error={!!skuError || !!formErrors.sku}
                    helperText={skuError || formErrors.sku || ''}
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
                    error={!!formErrors.price}
                    helperText={formErrors.price || ''}
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
                    error={!!formErrors.quantity}
                    helperText={formErrors.quantity || ''}
                />
                
                <Button type="submit" variant="contained" disabled={isLoading || !!skuError} fullWidth>
                    {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Save Product'}
                </Button>
            </Paper>
        </Box>
    );
};

export default AddProductPage;