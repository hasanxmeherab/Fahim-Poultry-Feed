import React, { useState } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';
import { showErrorToast, showSuccessToast } from '../utils/notifications.js';

// MUI Imports
import { Box, Button, TextField, Typography, Paper, CircularProgress } from '@mui/material';

const AddWholesaleProductPage = () => {
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    // --- NEW: State for client-side form errors ---
    const [formErrors, setFormErrors] = useState({});
     // --- END NEW ---
    const navigate = useNavigate();

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
            await api.post('/wholesale-products', { name });
            showSuccessToast('Wholesale product added successfully!');
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
                  // Handle potential generic backend errors like duplicates if not caught by validator
                 if (err.response.data.error.includes('already exists')) { // Example check
                       setFormErrors(prevErrors => ({ ...prevErrors, name: err.response.data.error }));
                 } else {
                     showErrorToast(err, 'Failed to add product.');
                 }
             }
             else {
                showErrorToast(err, 'Failed to add product.');
             }
        } finally {
            setIsSubmitting(false);
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
                    {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Save Product'}
                </Button>
            </Paper>
        </Box>
    );
};

export default AddWholesaleProductPage;