import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/api.js';
import { useParams } from 'react-router-dom';
import { showErrorToast, showSuccessToast } from '../utils/notifications.js';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
// MUI Imports
import { 
    Box, Stack, CircularProgress, Typography, Select, MenuItem, 
    FormControl, InputLabel, Paper, TextField, Button, Divider
} from '@mui/material';
import TimelineIcon from '@mui/icons-material/Timeline';
import AddCircleIcon from '@mui/icons-material/AddCircle';

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
    const [isCyclingBatch, setIsCyclingBatch] = useState(false);
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
    

    const refreshData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [customerRes, batchesRes] = await Promise.all([
                api.get(`/customers/${id}`),
                api.get(`/batches/customer/${id}`)
            ]);
            setCustomer(customerRes.data);
            setBatches(batchesRes.data);

            const activeBatch = batchesRes.data.find(b => b.status === 'Active');
            
            let newSelectedBatchId;

            if (activeBatch) {
                newSelectedBatchId = activeBatch._id;
            } else if (batchesRes.data.length > 0) {
                newSelectedBatchId = batchesRes.data[0]._id;
            } else {
                newSelectedBatchId = '';
            }
            
            setSelectedBatchId(newSelectedBatchId);

            if (newSelectedBatchId) {
                const currentBatch = batchesRes.data.find(b => b._id === newSelectedBatchId);
                const discountsTotal = currentBatch?.discounts.reduce((sum, d) => sum + d.amount, 0) || 0;
                setBatchDetails(prev => ({ ...prev, totalDiscounts: discountsTotal }));
            }
            setError(null);
        } catch (err) {
            setError('Failed to refresh data. Please check connection.');
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    // Initial load effect
    useEffect(() => {
        refreshData();
    }, [id]);

    // Effect for fetching transactions and details of the selected batch
    useEffect(() => {
        if (!selectedBatchId) {
            setTransactions([]);
            setTotalPages(0);
            return;
        }

        const fetchTransactionsAndDetails = async () => {
            setIsLoading(true);
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
        fetchTransactionsAndDetails();
    }, [selectedBatchId, page, batches, filterDate]);

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState({ title: '', body: '' });

    // --- Using window.confirm() instead of the MUI Dialog ---
    const handleStartNewBatch = () => {
        let title = "Start New Batch Cycle";
        let body = "Are you sure you want to start a new batch cycle? This action cannot be undone for the current ledger.";

        if (batches.length > 0) {
            title = "End Current & Start New Batch";
            body = "WARNING: This will END the current active batch (closing its ledger) and start a new one. Are you sure you want to proceed?";
        }

        setConfirmMessage({ title, body });
        setIsConfirmModalOpen(true);
    };

    // --- NEW: Executes the API call only after user confirms via the Dialog ---
    const handleConfirmBatchCycle = async () => {
        setIsConfirmModalOpen(false);
        setIsCyclingBatch(true);
        try {
            await api.post('/batches/start', { customerId: id });
            showSuccessToast('Batch cycle successful!');
            await refreshData(); 
        } catch (err) {
            showErrorToast(err, 'Failed to cycle batch.');
        } finally {
            setIsCyclingBatch(false);
        }
    };
    
    // Handler for successful sales from the IssueGoodsForm
    const handleSaleSuccess = () => {
        refreshData(); 
        setPage(1);
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
    const hasMultipleBatches = batches.length > 1;
    
    return (
        <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
            <Typography variant="h4" align="center" gutterBottom sx={{mb: 4}}>{customer.name}</Typography>

            <Stack spacing={3}>
                
                {/* 1. CUSTOMER INFO CARD (Always visible) */}
                <CustomerInfoCard customer={customer} />
                
                <Divider />

                {/* 2. START BATCH FALLBACK / BATCH INFO CARD */}
                {batches.length === 0 ? (
                    // Fallback CTA: When no batch exists
                    <Paper sx={{ p: 3, textAlign: 'center', border: '2px dashed #4CAF50', bgcolor: '#e8f5e9' }}>
                        <Typography variant="h6" color="primary.main" sx={{ mb: 1.5 }}>
                            <AddCircleIcon sx={{verticalAlign: 'middle', mr: 1}} />
                            Begin a New Feed Cycle
                        </Typography>
                        <Button 
                            onClick={handleStartNewBatch} 
                            variant="contained" 
                            color="success" 
                            size="large"
                        >
                            Start First Batch Cycle
                        </Button>
                    </Paper>
                ) : (
                    // Actual Batch Info Card: When a batch is selected
                    <BatchInfoCard
                        batch={selectedBatch}
                        batchDetails={batchDetails}
                        onStartNewBatch={handleStartNewBatch} // This now triggers the window.confirm()
                        onDataRefresh={refreshData}
                    />
                )}
                
                {/* 3. ISSUE GOODS FORM (Active Transaction Area) */}
                <IssueGoodsForm customer={customer} onSaleSuccess={handleSaleSuccess} />

                <Divider />
                
                {/* 4. TRANSACTION HISTORY SECTION */}
                <Paper sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" sx={{display: 'flex', alignItems: 'center', color: 'text.primary'}}>
                            <TimelineIcon sx={{mr: 1}} />
                            Transaction History
                        </Typography>
                        
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            {/* BATCH SELECTOR (Only show if there are previous batches) */}
                            {hasMultipleBatches && (
                                <FormControl sx={{ minWidth: 150 }} size="small">
                                    <InputLabel>View Batch</InputLabel>
                                    <Select 
                                        value={selectedBatchId} 
                                        label="View Batch" 
                                        onChange={(e) => { 
                                            setPage(1); 
                                            setFilterDate(''); 
                                            setSelectedBatchId(e.target.value); 
                                        }}
                                    >
                                        {batches.map(batch => (
                                            <MenuItem key={batch._id} value={batch._id}>
                                                Batch #{batch.batchNumber} ({new Date(batch.startDate).toLocaleDateString()})
                                                {batch.status === 'Active' && ' - ACTIVE'}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                            
                            {/* DATE FILTER */}
                            <TextField 
                                label="Filter by Date" 
                                type="date" 
                                size="small" 
                                value={filterDate} 
                                onChange={(e) => { setPage(1); setFilterDate(e.target.value); }} 
                                InputLabelProps={{ shrink: true }} 
                            />
                            <Button 
                                size="small" 
                                onClick={() => { setPage(1); setFilterDate(''); }}
                                variant="outlined"
                            >
                                Clear
                            </Button>
                        </Box>
                    </Box>

                    {selectedBatchId ? (
                        <TransactionHistory
                            transactions={transactions}
                            totalPages={totalPages}
                            page={page}
                            onPageChange={(e, value) => setPage(value)}
                            customerName={customer.name}
                        />
                    ) : (
                        <Typography variant="body1" align="center" sx={{p: 4, color: 'text.secondary'}}>
                            History is available after the first batch is started.
                        </Typography>
                    )}
                </Paper>
                
            </Stack>

            <ConfirmDialog
                isOpen={isConfirmModalOpen}
                title={confirmMessage.title}
                message={confirmMessage.body}
                onConfirm={handleConfirmBatchCycle}
                onCancel={() => setIsConfirmModalOpen(false)}
                confirmButtonText="Yes, Proceed"
                confirmColor={batches.length > 0 ? 'error' : 'success'} 
                isLoading={isCyclingBatch}
            />
            
        </Box>
    );
};

export default CustomerDetailsPage;