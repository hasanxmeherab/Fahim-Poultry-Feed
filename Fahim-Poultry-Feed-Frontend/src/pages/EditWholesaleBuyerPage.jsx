import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { useNavigate, useParams } from 'react-router-dom';
import { showErrorToast, showSuccessToast } from '../utils/notifications.js';

// MUI Imports
import { Box, Button, TextField, Typography, Paper, CircularProgress } from '@mui/material';

const EditWholesaleBuyerPage = () => {
    // --- All existing state and logic is preserved ---
    const [formData, setFormData] = useState({ name: '', businessName: '', phone: '', address: '' });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { id } = useParams();

    useEffect(() => {
        const fetchBuyer = async () => {
            try {
                const { data } = await api.get(`/wholesale-buyers/${id}`);
                setFormData(data);
                setIsLoading(false);
            } catch (err) {
                setError('Failed to fetch buyer data.');
                setIsLoading(false);
            }
        };
        fetchBuyer();
    }, [id]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.patch(`/wholesale-buyers/${id}`, formData);
            showSuccessToast('Wholesale buyer updated successfully!');
            setTimeout(() => {
                navigate('/wholesale');
                }, 1000);
        } catch (err) {
            showErrorToast(err, 'Failed to update buyer.');
        }
    };
    // --- End of preserved logic ---

    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    if (error) {
        return <Typography color="error" sx={{ mt: 4 }}>{error}</Typography>;
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
                />

                <TextField
                    fullWidth
                    label="Address (Optional)"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                />
                
                {error && <Typography color="error" sx={{ my: 2 }}>{error}</Typography>}
                
                <Button type="submit" variant="contained" fullWidth>
                    Save Changes
                </Button>
            </Paper>
        </Box>
    );
};

export default EditWholesaleBuyerPage;