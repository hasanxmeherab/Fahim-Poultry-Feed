import React, { useState, useEffect } from 'react';
import api from '../api/api.js';
import { useParams, useNavigate } from 'react-router-dom';
import { showErrorToast, showSuccessToast } from '../utils/notifications.js';

// MUI Imports
import { Box, Button, TextField, Typography, Paper, CircularProgress } from '@mui/material';

const EditCustomerPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '' });
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // --- NEW: State for client-side form errors ---
    const [formErrors, setFormErrors] = useState({});
    // --- END NEW ---

    useEffect(() => {
        const fetchCustomer = async () => {
            setIsLoading(true); // Ensure loading is true when fetching
            try {
                const response = await api.get(`/customers/${id}`);
                setFormData({
                    name: response.data.name || '',
                    phone: response.data.phone || '',
                    email: response.data.email || '',
                    address: response.data.address || ''
                });
            } catch (err) {
                showErrorToast(err, 'Failed to fetch customer data.');
                // Navigate back or show persistent error if fetch fails
                navigate('/customers');
            } finally {
                setIsLoading(false);
            }
        };
        fetchCustomer();
    }, [id, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        let processedValue = value;

        if (name === 'phone') {
            processedValue = value.replace(/[^0-9]/g, ''); // Allow only digits
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
        // setFormErrors({}); // Now handled by validate/handleChange

        try {
            await api.patch(`/customers/${id}`, formData);
            showSuccessToast('Customer updated successfully!');
            navigate('/customers'); // Redirect back to list or details page
        } catch (err) {
            // Handle backend errors (e.g., duplicate phone if somehow missed client-side)
            if (err.response && err.response.status === 400 && err.response.data.errors) {
                const backendErrors = err.response.data.errors.reduce((acc, current) => {
                    const fieldName = Object.keys(current)[0];
                    acc[fieldName] = current[fieldName];
                    return acc;
                }, {});
                setFormErrors(prevErrors => ({ ...prevErrors, ...backendErrors }));
            } else if (err.response && err.response.status === 400 && err.response.data.error) {
                if (err.response.data.error.includes('phone number already exists')) {
                    setFormErrors(prevErrors => ({ ...prevErrors, phone: err.response.data.error }));
                } else {
                    showErrorToast(err, 'Failed to update customer.');
                }
            } else {
                showErrorToast(err, 'Failed to update customer.');
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
                    Edit Customer
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
                    inputProps={{ inputMode: 'numeric' }}
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
                />

                <Button type="submit" variant="contained" fullWidth disabled={isSubmitting}>
                    {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
                </Button>
            </Paper>
        </Box>
    );
};

export default EditCustomerPage;