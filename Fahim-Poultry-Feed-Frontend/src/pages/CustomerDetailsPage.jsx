// frontend/src/pages/CustomerDetailsPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/api.js';
import { useParams } from 'react-router-dom';

// MUI Imports
import { Box, Stack, CircularProgress, Typography, Select, MenuItem, FormControl, InputLabel, Paper, TextField, Button } from '@mui/material';

// Child Component Imports
import CustomerInfoCard from '../components/CustomerInfoCard.jsx';
import BatchInfoCard from '../components/BatchInfoCard.jsx';
import IssueGoodsForm from '../components/IssueGoodsForm.jsx';
import TransactionHistory from '../components/TransactionHistory.jsx';

const CustomerDetailsPage = () => {
    const { id } = useParams();
    const [customer, setCustomer] = useState(null);
    const [batches, setBatches] = useState([]);
    const [selectedBatchId, setSelectedBatchId] = useState('');
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [batchDetails, setBatchDetails] = useState({
        totalSold: 0,
        totalBought: 0,
        totalChickens: 0,
        totalDiscounts: 0,
        productSummary: [],
    });
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [filterDate, setFilterDate] = useState('');

    const fetchData = useCallback(async () => {
        try {
            const [customerRes, batchesRes] = await Promise.all([
                api.get(`/customers/${id}`),
                api.get(`/batches/customer/${id}`)
            ]);
            setCustomer(customerRes.data);
            setBatches(batchesRes.data);

            if (selectedBatchId) {
                const currentBatch = batchesRes.data.find(b => b._id === selectedBatchId);
                const discountsTotal = currentBatch?.discounts.reduce((sum, d) => sum + d.amount, 0) || 0;
                setBatchDetails(prev => ({ ...prev, totalDiscounts: discountsTotal }));
            }
        } catch (err) {
            setError('Failed to refresh data.');
        } finally {
            setIsLoading(false);
        }
    }, [id, selectedBatchId]);

    useEffect(() => {
        setIsLoading(true);
        const fetchInitialData = async () => {
            try {
                const [customerRes, batchesRes] = await Promise.all([
                    api.get(`/customers/${id}`),
                    api.get(`/batches/customer/${id}`)
                ]);
                setCustomer(customerRes.data);
                setBatches(batchesRes.data);
                const activeBatch = batchesRes.data.find(b => b.status === 'Active');
                const initialBatchId = activeBatch?._id || batchesRes.data[0]?._id || '';
                setSelectedBatchId(initialBatchId);
            } catch (err) {
                setError('Failed to fetch initial customer data.');
            }
        };
        fetchInitialData();
    }, [id]);

    useEffect(() => {
        if (!selectedBatchId) {
            setIsLoading(false);
            return;
        }

        const fetchTransactionsAndDiscounts = async () => {
            try {
                let url = `/transactions/batch/${selectedBatchId}?page=${page}`;
                if (filterDate) {
                    url += `&date=${filterDate}`;
                }
                const response = await api.get(url);
                setTransactions(response.data.transactions);
                setTotalPages(response.data.totalPages);
                
                const currentBatch = batches.find(b => b._id === selectedBatchId);
                const discountsTotal = currentBatch?.discounts.reduce((sum, d) => sum + d.amount, 0) || 0;

                setBatchDetails({
                    totalSold: response.data.totalSoldInBatch,
                    totalBought: response.data.totalBoughtInBatch,
                    totalChickens: response.data.totalChickensBought,
                    totalDiscounts: discountsTotal,
                    productSummary: response.data.productSummary || [],
                });
            } catch (err) {
                console.error("Failed to fetch transactions", err);
                setTransactions([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTransactionsAndDiscounts();
    }, [selectedBatchId, page, batches, filterDate]);

    const handleStartNewBatch = async () => {
        if (!window.confirm('Are you sure? This will end the current batch and start a new one.')) return;
        try {
            await api.post('/batches/start', { customerId: id });
            fetchData();
        } catch (err) {
            alert('Failed to start new batch.');
        }
    };

    if (isLoading && !customer) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }
    if (error) {
        return <Typography color="error">{error}</Typography>;
    }
    if (!customer) {
        return <Typography>No customer found.</Typography>;
    }

    const selectedBatch = batches.find(b => b._id === selectedBatchId);

    return (
        <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
             <Typography variant="h4" align="center" gutterBottom>{customer.name}</Typography>

            <Stack spacing={3}>
                <CustomerInfoCard customer={customer} />
                {selectedBatch && (
                    <BatchInfoCard
                        batch={selectedBatch}
                        batchDetails={batchDetails}
                        onStartNewBatch={handleStartNewBatch}
                        onDataRefresh={fetchData}
                    />
                )}
                <IssueGoodsForm customer={customer} onSaleSuccess={fetchData} />
                <Paper sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                        <Typography variant="h5">Transaction History</Typography>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <TextField label="Filter by Date" type="date" size="small" value={filterDate} onChange={(e) => { setPage(1); setFilterDate(e.target.value); }} InputLabelProps={{ shrink: true }} />
                            <Button size="small" onClick={() => { setPage(1); setFilterDate(''); }}>Clear</Button>
                            {batches.length > 0 && (
                                <FormControl sx={{ minWidth: 250 }} size="small">
                                    <InputLabel>View Batch</InputLabel>
                                    <Select value={selectedBatchId} label="View Batch" onChange={(e) => { setPage(1); setFilterDate(''); setSelectedBatchId(e.target.value); }}>
                                        {batches.map(batch => (
                                            <MenuItem key={batch._id} value={batch._id}>
                                                {/* --- THIS IS THE CHANGE --- */}
                                                Batch #{batch.batchNumber} ({new Date(batch.startDate).toLocaleDateString()})
                                                {batch.status === 'Active' && ' - Active'}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                        </Box>
                    </Box>
                    <TransactionHistory
                        transactions={transactions}
                        totalPages={totalPages}
                        page={page}
                        onPageChange={(e, value) => setPage(value)}
                        customerName={customer.name}
                    />
                </Paper>
            </Stack>
        </Box>
    );
};

export default CustomerDetailsPage;