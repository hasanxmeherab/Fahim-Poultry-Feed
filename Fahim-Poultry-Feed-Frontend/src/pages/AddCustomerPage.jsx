import React, { useState } from 'react';
import api from '../api/api.js';
import { useNavigate } from 'react-router-dom';

// MUI Imports
import { Box, Button, TextField, Typography, Paper, CircularProgress } from '@mui/material';

// Import our notification utility
import { showErrorToast, showSuccessToast } from '../utils/notifications.js';

const AddCustomerPage = () => {
    const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '' });
    const [isLoading, setIsLoading] = useState(false);
    // --- NEW: State for client-side form errors ---
    const [formErrors, setFormErrors] = useState({});
    // --- END NEW ---
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        let processedValue = value;

        if (name === 'phone') {
            // Allow only digits for phone
            processedValue = value.replace(/[^0-9]/g, '');
        }

        setFormData({ ...formData, [name]: processedValue });

        // --- NEW: Clear specific error on change ---
        if (formErrors[name]) {
            setFormErrors({ ...formErrors, [name]: '' });
        }
        // --- END NEW ---
    };

    // --- NEW: Validation Function ---
    const validateForm = () => {
        const errors = {};
        if (!formData.name.trim()) {
            errors.name = 'Customer name is required.';
        }
        if (!formData.phone.trim()) {
            errors.phone = 'Phone number is required.';
        } else if (!/^(?:\+?88)?01[3-9]\d{8}$/.test(formData.phone)) {
             // Example: Basic Bangladesh phone number format check
             errors.phone = 'Please enter a valid Bangladesh mobile number (e.g., 017...).';
        }
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Please enter a valid email address.';
        }
        setFormErrors(errors);
        // Return true if no errors, false otherwise
        return Object.keys(errors).length === 0;
    };
    // --- END NEW ---

    const handleSubmit = async (e) => {
        e.preventDefault();
        // --- NEW: Validate before submitting ---
        if (!validateForm()) {
            return; // Stop submission if validation fails
        }
        // --- END NEW ---

        setIsLoading(true);
        // setFormErrors({}); // Now handled by validateForm/handleChange

        try {
            await api.post('/customers', formData);
            showSuccessToast('Customer added successfully!');
            navigate('/customers');
        } catch (err) {
            // Handle potential backend errors (like duplicate phone if not caught client-side)
            if (err.response && err.response.status === 400 && err.response.data.errors) {
                const backendErrors = err.response.data.errors.reduce((acc, current) => {
                    const fieldName = Object.keys(current)[0];
                    acc[fieldName] = current[fieldName];
                    return acc;
                }, {});
                setFormErrors(prevErrors => ({ ...prevErrors, ...backendErrors })); // Merge backend errors
            } else if (err.response && err.response.status === 400 && err.response.data.error) {
                 // Handle generic 400 errors from backend if validation middleware wasn't hit
                 // Example: Duplicate phone number if express-validator wasn't used for the route
                 if (err.response.data.error.includes('phone number already exists')) {
                     setFormErrors(prevErrors => ({ ...prevErrors, phone: err.response.data.error }));
                 } else {
                      showErrorToast(err, 'Failed to add customer.'); // Fallback toast
                 }
            }
             else {
                showErrorToast(err, 'Failed to add customer.'); // Fallback toast for other errors
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box sx={{ maxWidth: '600px', margin: 'auto', p: 3 }}>
            <Paper component="form" onSubmit={handleSubmit} noValidate sx={{ p: 3 }}>
                <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
                    Add New Customer
                </Typography>

                <TextField
                    fullWidth
                    label="Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    sx={{ mb: 2 }}
                    // --- UPDATED: Show client-side error ---
                    error={!!formErrors.name}
                    helperText={formErrors.name || ''}
                    // --- END UPDATE ---
                />
                <TextField
                    fullWidth
                    label="Phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    sx={{ mb: 2 }}
                    inputProps={{ inputMode: 'numeric' }} // Keep pattern out, handled by validation
                    // --- UPDATED: Show client-side error ---
                    error={!!formErrors.phone}
                    helperText={formErrors.phone || ''}
                    // --- END UPDATE ---
                />
                <TextField
                    fullWidth
                    label="Email (Optional)"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                     // --- UPDATED: Show client-side error ---
                    error={!!formErrors.email}
                    helperText={formErrors.email || ''}
                    // --- END UPDATE ---
                />
                <TextField
                    fullWidth
                    label="Address (Optional)"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                    // No validation needed for optional field unless specific rules apply
                />

                <Button type="submit" variant="contained" fullWidth disabled={isLoading}>
                    {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Save Customer'}
                </Button>
            </Paper>
        </Box>
    );
};

export default AddCustomerPage;
