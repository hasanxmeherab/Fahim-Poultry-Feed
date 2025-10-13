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
    const [formErrors, setFormErrors] = useState({});
    const navigate = useNavigate();
    const { id } = useParams();

    useEffect(() => {
        const fetchBuyer = async () => {
            try {
                const { data } = await api.get(`/wholesale-buyers/${id}`);
                setFormData(data);
            } catch (err) {
                showErrorToast(err, 'Failed to fetch buyer data.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchBuyer();
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
            await api.patch(`/wholesale-buyers/${id}`, formData);
            showSuccessToast('Wholesale buyer updated successfully!');
            navigate('/wholesale');
        } catch (err) {
            if (err.response && err.response.status === 400 && err.response.data.errors) {
                const errorData = err.response.data.errors.reduce((acc, current) => {
                    const fieldName = Object.keys(current)[0];
                    acc[fieldName] = current[fieldName];
                    return acc;
                }, {});
                setFormErrors(errorData);
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
                    error={!!formErrors.name}
                    helperText={formErrors.name || ''}
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
                    error={!!formErrors.phone}
                    helperText={formErrors.phone || ''}
                    inputProps={{
                        inputMode: 'numeric',
                        pattern: '[0-9]*'
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