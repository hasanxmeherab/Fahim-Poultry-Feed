import React from 'react';
import { Paper, Typography, Box } from '@mui/material';

const CustomerInfoCard = ({ customer }) => {
    return (
        <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Customer Information</Typography>
            <Box>
                <Typography variant="body1"><strong>Phone:</strong> {customer.phone}</Typography>
                <Typography variant="body1"><strong>Address:</strong> {customer.address || 'N/A'}</Typography>
                <Typography variant="h5" sx={{ mt: 1, color: customer.balance < 0 ? 'error.main' : 'success.main' }}>
                    <strong>Balance:</strong> TK {customer.balance.toFixed(2)}
                </Typography>
            </Box>
        </Paper>
    );
};

export default CustomerInfoCard;