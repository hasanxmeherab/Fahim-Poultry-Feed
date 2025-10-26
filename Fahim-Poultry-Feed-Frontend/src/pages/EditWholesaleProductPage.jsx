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
    const [isSubmitting, setIsSubmitting] = useState(false);
    // --- NEW: State for client-side form errors ---
    const [formErrors, setFormErrors] = useState({});
     // --- END NEW ---

    useEffect(() => {
        const fetchProduct = async () => {
            setIsLoading(true);
            try {
                const response = await api.get(`/wholesale-products/${id}`);
                setName(response.data.name || '');
            } catch (err) {
                showErrorToast(err, 'Failed to fetch product data.');
                 navigate('/wholesale'); // Redirect if fetch fails
            } finally {
                setIsLoading(false);
            }
        };
        fetchProduct();
    }, [id, navigate]);

    // --- NEW: Validation Function ---
    const validateForm = () => {
        const errors = {};
        if (!name.trim()) errors.name = 'Product name is required.';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };
    // --- END NEW ---


    const handleSubmit = async (e) => {
        e.preventDefault();
         // --- NEW: Validate before submitting ---
         if (!validateForm()) {
             return;
         }
         // --- END NEW ---

        setIsSubmitting(true);
        // setFormErrors({}); // Handled

        try {
            await api.patch(`/wholesale-products/${id}`, { name });
            showSuccessToast('Wholesale product updated successfully!');
            navigate('/wholesale');
        } catch (err) {
             // Handle backend validation errors (e.g., unique name constraint)
             if (err.response && err.response.status === 400 && err.response.data.errors) {
                const backendErrors = err.response.data.errors.reduce((acc, current) => {
                    const fieldName = Object.keys(current)[0];
                    acc[fieldName] = current[fieldName];
                    return acc;
                }, {});
                setFormErrors(prevErrors => ({ ...prevErrors, ...backendErrors }));
             } else if (err.response && err.response.status === 400 && err.response.data.error) {
                  if (err.response.data.error.includes('already exists')) { // Example check
                       setFormErrors(prevErrors => ({ ...prevErrors, name: err.response.data.error }));
                  } else {
                     showErrorToast(err, 'Failed to update product.');
                  }
             } else {
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
                    Edit Wholesale Product
                </Typography>

                <TextField
                    fullWidth
                    autoFocus
                    label="Product Name"
                    name="name"
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                        // --- NEW: Clear error on change ---
                        if (formErrors.name) setFormErrors({});
                        // --- END NEW ---
                    }}
                    required
                    sx={{ mb: 2 }}
                     // --- UPDATED: Show error ---
                    error={!!formErrors.name}
                    helperText={formErrors.name || ''}
                     // --- END UPDATE ---
                />

                <Button type="submit" variant="contained" fullWidth disabled={isSubmitting}>
                    {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
                </Button>
            </Paper>
        </Box>
    );
};

export default EditWholesaleProductPage;