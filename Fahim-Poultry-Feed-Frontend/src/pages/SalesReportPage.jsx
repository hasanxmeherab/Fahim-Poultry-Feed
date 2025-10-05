// frontend/src/pages/SalesReportPage.jsx

import React, { useState } from 'react';
import api from '../api/api';

// MUI Imports
import {
    Box, Button, Typography, TextField, Table,
    TableBody, TableCell, TableContainer, TableHead,
    TableRow, Paper, CircularProgress
} from '@mui/material';

const SalesReportPage = () => {
    const [reportData, setReportData] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleGenerateReport = async () => {
        if (!startDate || !endDate) {
            setError('Please select both a start and end date.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setReportData(null);

        try {
            const response = await api.get(`/reports/sales?startDate=${startDate}&endDate=${endDate}`);
            setReportData(response.data);
        } catch (err) {
            setError('Failed to generate report. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Sales Report
            </Typography>
            
            <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <TextField name="startDate" label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} size="small" />
                <TextField name="endDate" label="End Date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} size="small" />
                <Button variant="contained" onClick={handleGenerateReport} disabled={isLoading}>
                    {isLoading ? 'Generating...' : 'Generate Report'}
                </Button>
            </Paper>

            {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
            
            {reportData && (
                <Paper sx={{ mt: 3 }}>
                    <Box sx={{ p: 2 }}>
                        <Typography variant="h6">
                            Report from {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
                        </Typography>
                        <Typography variant="h5" component="p" sx={{ fontWeight: 'bold', mt: 1 }}>
                            Total Revenue: TK {reportData.totalRevenue.toFixed(2)}
                        </Typography>
                    </Box>

                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ '& th': { backgroundColor: '#f4f6fobia8', fontWeight: 'bold' } }}>
                                    <TableCell>Date & Time</TableCell>
                                    <TableCell>Customer</TableCell>
                                    <TableCell align="right">Amount (TK)</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {reportData.sales.map((sale) => (
                                    <TableRow key={sale._id} hover>
                                        <TableCell>{new Date(sale.createdAt).toLocaleString()}</TableCell>
                                        <TableCell>{sale.customer?.name || sale.randomCustomerName || 'Random Customer'}</TableCell>
                                        <TableCell align="right">{sale.amount.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}
        </Box>
    );
};

export default SalesReportPage;