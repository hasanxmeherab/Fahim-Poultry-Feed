import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { useNavigate, useParams } from 'react-router-dom';
import { showErrorToast, showSuccessToast } from '../utils/notifications.js';

// MUI Imports
import { Box, Button, TextField, Typography, Paper, CircularProgress } from '@mui/material';

const EditWholesaleBuyerPage = () => {
    const [formData, setFormData] = useState({ name: '', businessName: '', phone: '', address: '' });
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // --- NEW: State for client-side form errors ---
    const [formErrors, setFormErrors] = useState({});
    // --- END NEW ---
    const navigate = useNavigate();
    const { id } = useParams();

    useEffect(() => {
        const fetchBuyer = async () => {
            setIsLoading(true);
            try {
                const { data } = await api.get(`/wholesale-buyers/${id}`);
                // Ensure all fields exist, even if null/undefined from backend
                setFormData({
                    name: data.name || '',
                    businessName: data.businessName || '',
                    phone: data.phone || '',
                    address: data.address || ''
                });
            } catch (err) {
                showErrorToast(err, 'Failed to fetch buyer data.');
                navigate('/wholesale');
            } finally {
                setIsLoading(false);
            }
        };
        fetchBuyer();
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
        if (!formData.name.trim()) errors.name = 'Contact name is required.';
        if (!formData.phone.trim()) {
            errors.phone = 'Phone number is required.';
        } else if (!/^(?:\+?88)?01[3-9]\d{8}$/.test(formData.phone)) {
             errors.phone = 'Please enter a valid Bangladesh mobile number.';
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
        // setFormErrors({}); // Handled

        try {
            await api.patch(`/wholesale-buyers/${id}`, formData);
            showSuccessToast('Wholesale buyer updated successfully!');
            navigate('/wholesale');
        } catch (err) {
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
                     showErrorToast(err, 'Failed to update buyer.');
                 }
            } else {
                showErrorToast(err, 'Failed to update buyer.');
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
                    Edit Wholesale Buyer
                </Typography>

                <TextField
                    fullWidth
                    label="Contact Name"
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
                    label="Business Name (Optional)"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                />

                <TextField
                    fullWidth
                    label="Phone Number"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    sx={{ mb: 2 }}
                    // --- UPDATED: Show error ---
                    error={!!formErrors.phone}
                    helperText={formErrors.phone || ''}
                    // --- END UPDATE ---
                    inputProps={{
                        inputMode: 'numeric',
                    }}
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

export default EditWholesaleBuyerPage;