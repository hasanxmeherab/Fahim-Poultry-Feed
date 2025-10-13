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
    const [isSubmitting, setIsSubmitting] = useState(false); // For button loading state
    const [formErrors, setFormErrors] = useState({}); // State for inline errors

    useEffect(() => {
        const fetchCustomer = async () => {
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
            } finally {
                setIsLoading(false);
            }
        };
        fetchCustomer();
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'phone') {
            const numericValue = value.replace(/[^0-9]/g, '');
            setFormData({ ...formData, [name]: numericValue });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormErrors({});

        try {
            await api.patch(`/customers/${id}`, formData);
            showSuccessToast('Customer updated successfully!');
            navigate('/customers');
        } catch (err) {
            if (err.response && err.response.status === 400 && err.response.data.errors) {
                const errorData = err.response.data.errors.reduce((acc, current) => {
                    const fieldName = Object.keys(current)[0];
                    acc[fieldName] = current[fieldName];
                    return acc;
                }, {});
                setFormErrors(errorData);
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
                    error={!!formErrors.name}
                    helperText={formErrors.name || ''}
                />
                
                <TextField 
                    fullWidth 
                    label="Phone" 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleChange} 
                    required 
                    sx={{ mb: 2 }}
                    inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                    error={!!formErrors.phone}
                    helperText={formErrors.phone || ''}
                />

                <TextField fullWidth label="Email (Optional)" name="email" type="email" value={formData.email} onChange={handleChange} sx={{ mb: 2 }} />
                <TextField fullWidth label="Address (Optional)" name="address" value={formData.address} onChange={handleChange} sx={{ mb: 2 }} />
                
                <Button type="submit" variant="contained" fullWidth disabled={isSubmitting}>
                    {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
                </Button>
            </Paper>
        </Box>
    );
};

export default EditCustomerPage;