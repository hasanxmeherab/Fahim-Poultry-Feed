import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';
import { showErrorToast, showSuccessToast } from '../utils/notifications.js';
import { debounce } from '@mui/material/utils'; // Import debounce utility

// MUI Imports
import { Box, Button, TextField, Typography, Paper, CircularProgress } from '@mui/material';

const AddProductPage = () => {
    const [formData, setFormData] = useState({ name: '', sku: '', price: '', quantity: '' });
    // --- NEW: State for client-side form errors ---
    const [formErrors, setFormErrors] = useState({});
    // --- END NEW ---
    const [isCheckingSku, setIsCheckingSku] = useState(false); // State for SKU check loading
    const [isLoading, setIsLoading] = useState(false); // State for form submission loading
    const navigate = useNavigate();

    // Debounced SKU check function
    const checkSkuUniqueness = useCallback(
        debounce(async (skuValue) => {
            if (!skuValue) {
                setFormErrors(prev => ({ ...prev, sku: '' })); // Clear error if empty
                setIsCheckingSku(false);
                return;
            }
            setIsCheckingSku(true);
            try {
                const response = await api.get(`/products/check-sku?sku=${skuValue}`);
                if (response.data.exists) {
                    setFormErrors(prev => ({ ...prev, sku: 'This SKU is already in use.' }));
                } else {
                    setFormErrors(prev => ({ ...prev, sku: '' })); // Clear error if unique
                }
            } catch (err) {
                console.error("SKU check failed:", err);
                setFormErrors(prev => ({ ...prev, sku: 'Could not verify SKU.' })); // Indicate check failed
            } finally {
                setIsCheckingSku(false);
            }
        }, 500), // 500ms delay
        [] // Empty dependency array means this function is created once
    );

    const handleChange = (e) => {
        const { name, value } = e.target;
        let processedValue = value;

        // Basic type constraints (more robust validation happens in validateForm)
        if (name === 'price' || name === 'quantity') {
            processedValue = value.replace(/[^0-9.]/g, ''); // Allow numbers and decimal for price
            if (name === 'quantity') {
               processedValue = value.replace(/[^0-9]/g, ''); // Allow only digits for quantity
            }
        }

        setFormData({ ...formData, [name]: processedValue });

        // --- NEW: Clear specific error on change ---
        if (formErrors[name] && name !== 'sku') { // Don't clear SKU error immediately on change
            setFormErrors({ ...formErrors, [name]: '' });
        }
         // --- END NEW ---

        // Trigger debounced SKU check only for the SKU field
        if (name === 'sku') {
            setIsCheckingSku(true); // Show spinner immediately
            checkSkuUniqueness(processedValue.trim());
        }
    };

    // --- NEW: Validation Function ---
     const validateForm = () => {
        const errors = { ...formErrors }; // Keep existing SKU check result
        if (!formData.name.trim()) errors.name = 'Product name is required.';
        if (!formData.sku.trim()) errors.sku = 'SKU is required.';
        // Price validation
        if (!formData.price) errors.price = 'Price is required.';
        else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) errors.price = 'Price must be a positive number.';
        // Quantity validation
        if (formData.quantity === '') errors.quantity = 'Initial quantity is required.'; // Check for empty string
        else if (isNaN(parseInt(formData.quantity)) || parseInt(formData.quantity) < 0 || !Number.isInteger(Number(formData.quantity))) errors.quantity = 'Quantity must be a non-negative whole number.';

        setFormErrors(errors);
        return Object.values(errors).every(error => !error); // Return true if all error messages are empty/falsy
    };
    // --- END NEW ---


    const handleSubmit = async (e) => {
        e.preventDefault();
        // --- NEW: Validate before submitting ---
        if (!validateForm() || isCheckingSku || formErrors.sku) { // Also check if SKU check is running or resulted in error
             if (isCheckingSku) showErrorToast({ message: 'Please wait for SKU check to complete.' });
             if (formErrors.sku) showErrorToast({ message: 'Please fix the SKU error.' });
             return; // Stop submission
        }
        // --- END NEW ---

        setIsLoading(true);
        // setFormErrors({}); // Handled by validate/handleChange

        // Ensure numeric types are sent correctly
        const payload = {
            ...formData,
            price: parseFloat(formData.price),
            quantity: parseInt(formData.quantity)
        };

        try {
            await api.post('/products', payload);
            showSuccessToast('Product added successfully!');
            navigate('/inventory');
        } catch (err) {
             // Handle backend validation errors (though client-side should catch most)
            if (err.response && err.response.status === 400 && err.response.data.errors) {
                const backendErrors = err.response.data.errors.reduce((acc, current) => {
                    const fieldName = Object.keys(current)[0];
                    acc[fieldName] = current[fieldName];
                    return acc;
                }, {});
                setFormErrors(prevErrors => ({ ...prevErrors, ...backendErrors }));
             } else if (err.response && err.response.status === 400 && err.response.data.error) {
                 // Handle specific backend message like duplicate SKU
                 if (err.response.data.error.includes('SKU already exists')) {
                      setFormErrors(prevErrors => ({ ...prevErrors, sku: err.response.data.error }));
                 } else {
                     showErrorToast(err, 'Failed to add product.');
                 }
             } else {
                showErrorToast(err, 'Failed to add product.');
             }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box sx={{ maxWidth: '600px', margin: 'auto', p: 3 }}>
            <Paper component="form" onSubmit={handleSubmit} noValidate sx={{ p: 3 }}>
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
                     // --- UPDATED: Show error ---
                    error={!!formErrors.name}
                    helperText={formErrors.name || ''}
                     // --- END UPDATE ---
                />

                <TextField
                    fullWidth
                    label="SKU (Stock Keeping Unit)"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    required
                     // --- UPDATED: Show error and loading indicator ---
                    error={!!formErrors.sku}
                    helperText={formErrors.sku || ''}
                    sx={{ mb: 2 }}
                    InputProps={{
                        endAdornment: isCheckingSku ? <CircularProgress size={20} /> : null,
                    }}
                     // --- END UPDATE ---
                />

                <TextField
                    fullWidth
                    label="Price (TK)"
                    name="price"
                    type="number" // Use text with inputMode numeric for better mobile experience & validation control
                    inputProps={{ inputMode: 'decimal', step: '0.01' }}
                    value={formData.price}
                    onChange={handleChange}
                    required
                    sx={{ mb: 2 }}
                     // --- UPDATED: Show error ---
                    error={!!formErrors.price}
                    helperText={formErrors.price || ''}
                     // --- END UPDATE ---
                />

                <TextField
                    fullWidth
                    label="Initial Quantity in Stock"
                    name="quantity"
                    type="number" // Use text with inputMode numeric
                    inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                    sx={{ mb: 2 }}
                    // --- UPDATED: Show error ---
                    error={!!formErrors.quantity}
                    helperText={formErrors.quantity || ''}
                    // --- END UPDATE ---
                />

                <Button
                    type="submit"
                    variant="contained"
                    disabled={isLoading || isCheckingSku || !!formErrors.sku} // Disable during loading or if SKU is invalid/checking
                    fullWidth
                >
                    {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Save Product'}
                </Button>
            </Paper>
        </Box>
    );
};

export default AddProductPage;