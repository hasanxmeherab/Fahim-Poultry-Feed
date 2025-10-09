// frontend/src/pages/EditCustomerPage.jsx

import React, { useState, useEffect } from 'react';
import api from '../api/api.js';
import { useParams, useNavigate } from 'react-router-dom';
import { showErrorToast, showSuccessToast } from '../utils/notifications.js';

// MUI Imports
import { Box, Button, TextField, Typography, Paper, CircularProgress } from '@mui/material';

const EditCustomerPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    // Updated initial state to include all fields
    const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '' });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCustomer = async () => {
            try {
                const response = await api.get(`/customers/${id}`);
                // Ensure all fields are populated, even if they are null in the DB
                setFormData({
                    name: response.data.name || '',
                    phone: response.data.phone || '',
                    email: response.data.email || '',
                    address: response.data.address || ''
                });
            } catch (err) {
                setError('Failed to fetch customer data.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchCustomer();
    }, [id]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.patch(`/customers/${id}`, formData);
            showSuccessToast('Customer updated successfully!');

            setTimeout(() => {
            navigate('/customers');
        }, 1000);

        } catch (err) {
             showErrorToast(err, 'Failed to update customer.');
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
                
                <TextField fullWidth label="Name" name="name" value={formData.name} onChange={handleChange} required sx={{ mb: 2 }} />
                <TextField fullWidth label="Phone" name="phone" value={formData.phone} onChange={handleChange} required sx={{ mb: 2 }} />

                {/* --- ADDED THESE TWO FIELDS --- */}
                <TextField fullWidth label="Email (Optional)" name="email" type="email" value={formData.email} onChange={handleChange} sx={{ mb: 2 }} />
                <TextField fullWidth label="Address (Optional)" name="address" value={formData.address} onChange={handleChange} sx={{ mb: 2 }} />
                
                {error && <Typography color="error" sx={{ my: 2 }}>{error}</Typography>}
                
                <Button type="submit" variant="contained" fullWidth>
                    Save Changes
                </Button>
            </Paper>
        </Box>
    );
};

export default EditCustomerPage;