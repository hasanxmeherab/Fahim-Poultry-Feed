import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/api.js';
import { useParams, useNavigate } from 'react-router-dom';
import { showErrorToast, showSuccessToast } from '../utils/notifications.js';
import { debounce } from '@mui/material/utils';

// MUI Imports
import { Box, Button, TextField, Typography, Paper, CircularProgress } from '@mui/material';

const EditProductPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', sku: '', price: '', quantity: '' }); // Include quantity for display
    const [originalSku, setOriginalSku] = useState(''); // Store the initial SKU
    const [isLoading, setIsLoading] = useState(true); // Loading initial data
    const [isSubmitting, setIsSubmitting] = useState(false); // Submitting form
    // --- NEW: State for client-side form errors ---
    const [formErrors, setFormErrors] = useState({});
    // --- END NEW ---
    const [isCheckingSku, setIsCheckingSku] = useState(false); // SKU uniqueness check loading

    useEffect(() => {
        const fetchProduct = async () => {
            setIsLoading(true);
            try {
                const response = await api.get(`/products/${id}`);
                setFormData(response.data);
                setOriginalSku(response.data.sku); // Store the original SKU
            } catch (err) {
                showErrorToast(err, 'Failed to fetch product data.');
                navigate('/inventory'); // Navigate back if product not found
            } finally {
                setIsLoading(false);
            }
        };
        fetchProduct();
    }, [id, navigate]);

     // Debounced SKU check function (only check if SKU changed)
    const checkSkuUniqueness = useCallback(
        debounce(async (skuValue) => {
            const trimmedSku = skuValue.trim();
            if (!trimmedSku || trimmedSku === originalSku) { // Don't check if empty or unchanged
                setFormErrors(prev => ({ ...prev, sku: '' }));
                setIsCheckingSku(false);
                return;
            }
            setIsCheckingSku(true);
            try {
                const response = await api.get(`/products/check-sku?sku=${trimmedSku}`);
                if (response.data.exists) {
                    setFormErrors(prev => ({ ...prev, sku: 'This SKU is already in use by another product.' }));
                } else {
                    setFormErrors(prev => ({ ...prev, sku: '' }));
                }
            } catch (err) {
                console.error("SKU check failed:", err);
                setFormErrors(prev => ({ ...prev, sku: 'Could not verify SKU uniqueness.' }));
            } finally {
                setIsCheckingSku(false);
            }
        }, 500),
    [originalSku] // Recreate check function if originalSku changes (shouldn't happen often)
    );


    const handleChange = (e) => {
        const { name, value } = e.target;
         let processedValue = value;

        // Basic type constraints
        if (name === 'price') {
            processedValue = value.replace(/[^0-9.]/g, ''); // Allow numbers and decimal for price
        }

        setFormData({ ...formData, [name]: processedValue });

         // --- NEW: Clear specific error on change ---
         if (formErrors[name] && name !== 'sku') {
             setFormErrors({ ...formErrors, [name]: '' });
         }
         // --- END NEW ---

         // Trigger SKU check if SKU field changes
         if (name === 'sku') {
             setIsCheckingSku(true);
             checkSkuUniqueness(processedValue);
         }
    };

    // --- NEW: Validation Function ---
    const validateForm = () => {
        const errors = { ...formErrors }; // Keep SKU check result
        if (!formData.name.trim()) errors.name = 'Product name is required.';
        if (!formData.sku.trim()) errors.sku = 'SKU is required.';
        if (!formData.price) errors.price = 'Price is required.';
        else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) errors.price = 'Price must be a positive number.';
        // Quantity is usually not editable here, but if it were:
        // if (formData.quantity === '' || isNaN(parseInt(formData.quantity)) || parseInt(formData.quantity) < 0 || !Number.isInteger(Number(formData.quantity))) errors.quantity = 'Quantity must be a non-negative whole number.';

        setFormErrors(errors);
         return Object.values(errors).every(error => !error); // Check if all error messages are empty
    };
    // --- END NEW ---

    const handleSubmit = async (e) => {
        e.preventDefault();
        // --- NEW: Validate before submitting ---
        if (!validateForm() || isCheckingSku || formErrors.sku) {
             if (isCheckingSku) showErrorToast({ message: 'Please wait for SKU check.' });
             if (formErrors.sku) showErrorToast({ message: 'Please fix the SKU error.' });
             return;
        }
        // --- END NEW ---

        setIsSubmitting(true);
        // setFormErrors({}); // Handled now

        // Prepare payload - exclude quantity if it shouldn't be updated here
        const { quantity, ...updatePayload } = formData;
        updatePayload.price = parseFloat(updatePayload.price); // Ensure price is number

        try {
            await api.patch(`/products/${id}`, updatePayload);
            showSuccessToast('Product updated successfully!');
            navigate('/inventory');
        } catch (err) {
             // Handle backend validation errors
             if (err.response && err.response.status === 400 && err.response.data.errors) {
                const backendErrors = err.response.data.errors.reduce((acc, current) => {
                    const fieldName = Object.keys(current)[0];
                    acc[fieldName] = current[fieldName];
                    return acc;
                }, {});
                setFormErrors(prevErrors => ({ ...prevErrors, ...backendErrors }));
             } else if (err.response && err.response.status === 400 && err.response.data.error) {
                  if (err.response.data.error.includes('SKU may already exist')) {
                       setFormErrors(prevErrors => ({ ...prevErrors, sku: err.response.data.error }));
                  } else {
                     showErrorToast(err, 'Failed to update product.');
                  }
             }
             else {
                showErrorToast(err, 'Failed to update product.');
             }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    return (
        <Box sx={{ maxWidth: '600px', margin: 'auto', p: 3 }}>
            <Paper component="form" onSubmit={handleSubmit} noValidate sx={{ p: 3 }}>
                <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
                    Edit Product
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
                    sx={{ mb: 2 }}
                    // --- UPDATED: Show error and loading ---
                    error={!!formErrors.sku}
                    helperText={formErrors.sku || ''}
                     InputProps={{
                        endAdornment: isCheckingSku ? <CircularProgress size={20} /> : null,
                    }}
                     // --- END UPDATE ---
                />

                <TextField
                    fullWidth
                    label="Price (TK)"
                    name="price"
                    type="number"
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
                    label="Current Quantity (Read-only)"
                    name="quantity"
                    type="number"
                    value={formData.quantity}
                    // onChange={handleChange} // Keep it read-only
                    disabled // Make it visually disabled
                    sx={{ mb: 2 }}
                     // --- UPDATED: Show error (though unlikely for read-only) ---
                    error={!!formErrors.quantity}
                    helperText={formErrors.quantity || ''}
                     // --- END UPDATE ---
                />

                <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={isSubmitting || isLoading || isCheckingSku || !!formErrors.sku}
                >
                    {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
                </Button>
            </Paper>
        </Box>
    );
};

export default EditProductPage;