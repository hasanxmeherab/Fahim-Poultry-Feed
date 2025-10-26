import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/api.js';
import { useParams } from 'react-router-dom';
import { showErrorToast, showSuccessToast } from '../utils/notifications.js';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

// --- NEW: Import React Query Hooks ---
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// --- END NEW ---

// MUI Imports
import {
    Box, Stack, CircularProgress, Typography, Select, MenuItem,
    FormControl, InputLabel, Paper, TextField, Button, Divider, FormHelperText
} from '@mui/material';
import TimelineIcon from '@mui/icons-material/Timeline';
import AddCircleIcon from '@mui/icons-material/AddCircle';

// Child Component Imports
import CustomerInfoCard from '../components/CustomerInfoCard.jsx';
import BatchInfoCard from '../components/BatchInfoCard.jsx';
import IssueGoodsForm from '../components/IssueGoodsForm.jsx';
import TransactionHistory from '../components/TransactionHistory.jsx';

// --- NEW: Define API fetching functions (outside component) ---
const fetchCustomer = async (customerId) => {
    if (!customerId) throw new Error("Customer ID is required.");
    console.log(`Fetching customer: ${customerId}`); // Debug log
    const { data } = await api.get(`/customers/${customerId}`);
    if (!data) throw new Error("Customer not found."); // Add check
    return data;
};

const fetchBatches = async (customerId) => {
    if (!customerId) return [];
    console.log(`Fetching batches for customer: ${customerId}`); // Debug log
    const { data } = await api.get(`/batches/customer/${customerId}`);
    return data || []; // Ensure it returns an array
};

// Fetches transactions AND summary details for a batch
const fetchTransactions = async (batchId, page, filterDate) => {
    if (!batchId) {
        console.log("Skipping transaction fetch: No Batch ID"); // Debug log
        // Return a default structure if no batch ID is provided
        return {
            transactions: [], totalPages: 0,
            totalSoldInBatch: 0, totalBoughtInBatch: 0,
            totalChickensBought: 0, productSummary: []
        };
    }
    let url = `/transactions/batch/${batchId}?page=${page}&limit=15`; // Use a reasonable limit
    if (filterDate) {
        url += `&date=${filterDate}`;
    }
    console.log(`Fetching transactions from: ${url}`); // Debug log
    const { data } = await api.get(url);
    // Return a consistent structure with defaults
    return {
        transactions: data.transactions || [],
        totalPages: data.totalPages || 0,
        totalSoldInBatch: data.totalSoldInBatch || 0,
        totalBoughtInBatch: data.totalBoughtInBatch || 0,
        totalChickensBought: data.totalChickensBought || 0,
        productSummary: data.productSummary || []
    };
};

// --- NEW: Define API mutation functions (FIXED: Added .then(res => res.data)) ---
const startNewBatchApi = (customerId) => api.post('/batches/start', { customerId }).then(res => res.data);
const addDiscountApi = ({ batchId, discountData }) => api.post(`/batches/${batchId}/discount`, discountData).then(res => res.data);
const removeDiscountApi = ({ batchId, discountId }) => api.delete(`/batches/${batchId}/discount/${discountId}`).then(res => res.data);
const buyFromCustomerApi = (payload) => api.post('/customers/buyback', payload).then(res => res.data);
const issueGoodsApi = (saleData) => api.post('/sales', saleData).then(res => res.data);
// --- END NEW ---


const CustomerDetailsPage = () => {
    const { id: customerId } = useParams();
    const queryClient = useQueryClient(); // Get QueryClient instance

    // --- Local UI State ---
    const [selectedBatchId, setSelectedBatchId] = useState('');
    const [page, setPage] = useState(1); // For transaction pagination
    const [filterDate, setFilterDate] = useState(''); // For transaction filtering
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false); // For start batch confirm
    const [confirmMessage, setConfirmMessage] = useState({ title: '', body: '' }); // For start batch confirm

    // --- Data Fetching with React Query ---

    // 1. Fetch Customer Data
    const { data: customer, isLoading: isLoadingCustomer, error: customerError, isError: isCustomerError } = useQuery({
        queryKey: ['customer', customerId], // Unique key for this customer
        queryFn: () => fetchCustomer(customerId),
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
        retry: (failureCount, error) => { // Don't retry on 404
             return error.response?.status !== 404 && failureCount < 2;
        },
        enabled: !!customerId, // Ensure customerId is available
    });

    // 2. Fetch Batches Data
    const { data: batches = [], isLoading: isLoadingBatches } = useQuery({ // Default batches to empty array
        queryKey: ['batches', customerId], // Unique key for this customer's batches
        queryFn: () => fetchBatches(customerId),
        staleTime: 1000 * 60 * 5,
        enabled: !!customerId, // Only fetch if customerId exists
    });

    // 3. Effect to auto-select the active (or latest) batch ID
    useEffect(() => {
        // Only run if batches have loaded
        if (!isLoadingBatches && customerId && batches) {
            let newSelectedBatchId = '';
            if (batches.length > 0) {
                const activeBatch = batches.find(b => b.status === 'Active');
                newSelectedBatchId = activeBatch ? activeBatch._id : batches[0]._id; // Default to newest if no active
            }
            // Update state only if the derived ID is different
            if (selectedBatchId !== newSelectedBatchId) {
                setSelectedBatchId(newSelectedBatchId);
                setPage(1); // Reset page when batch changes
                setFilterDate(''); // Reset date filter
            }
        }
    }, [batches, isLoadingBatches, customerId, selectedBatchId]); // Rerun when batches data finishes loading

    // 4. Fetch Transactions for the selected batch
    const {
        data: transactionData,
        isLoading: isLoadingTransactions,
        isFetching: isFetchingTransactions, // Indicates background refetching
        error: transactionError,
        isError: isTransactionError
    } = useQuery({
        queryKey: ['transactions', selectedBatchId, page, filterDate], // Key includes dependencies
        queryFn: () => fetchTransactions(selectedBatchId, page, filterDate),
        enabled: !!selectedBatchId, // Only run query if selectedBatchId has a value
        placeholderData: (prevData) => prevData, // Keep previous data visible while fetching new page/filter
        staleTime: 1000 * 15, // Keep transaction data fresh (refetch after 15s)
        retry: 1, // Retry once on failure
    });

    // --- Derived State (Calculated from query results) ---
    const transactions = transactionData?.transactions || [];
    const totalPages = transactionData?.totalPages || 0;
    const selectedBatch = batches.find(b => b._id === selectedBatchId);
    const hasMultipleBatches = batches.length > 1;

    // Combine batch details
    const batchDetails = {
        totalSold: transactionData?.totalSoldInBatch || 0,
        totalBought: transactionData?.totalBoughtInBatch || 0,
        totalChickens: transactionData?.totalChickensBought || 0,
        totalDiscounts: selectedBatch?.discounts?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0, // Calculate from batch object
        productSummary: transactionData?.productSummary || [],
    };

    // --- Mutations ---

    // Helper to invalidate queries after actions
    const invalidateCommonQueries = useCallback(() => {
        console.log("Invalidating queries for:", { customerId, selectedBatchId }); // Debug log
        queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
        queryClient.invalidateQueries({ queryKey: ['batches', customerId] });
        // Invalidate all pages for the current batch's transactions
        queryClient.invalidateQueries({ queryKey: ['transactions', selectedBatchId] });
    }, [queryClient, customerId, selectedBatchId]);

    // 1. Start/Cycle Batch Mutation
    const startBatchMutation = useMutation({
        mutationFn: () => startNewBatchApi(customerId),
        onSuccess: () => {
            showSuccessToast('Batch cycle successful!');
            setIsConfirmModalOpen(false);
            // Invalidate batches; the useEffect will handle selecting the new active batch
            queryClient.invalidateQueries({ queryKey: ['batches', customerId] });
            queryClient.invalidateQueries({ queryKey: ['customer', customerId] }); // Customer balance might change
        },
        onError: (err) => {
            showErrorToast(err, 'Failed to cycle batch.');
            setIsConfirmModalOpen(false);
        },
    });

    // 2. Add Discount Mutation
    const addDiscountMutation = useMutation({
        mutationFn: addDiscountApi, // Expects { batchId, discountData }
        onSuccess: () => {
            showSuccessToast('Discount added successfully!');
            invalidateCommonQueries(); // Refresh relevant data
        },
        onError: (err) => {
            showErrorToast(err, 'Failed to add discount.');
            throw err; // Re-throw for modal to handle its error state
        }
    });

    // 3. Remove Discount Mutation
    const removeDiscountMutation = useMutation({
        mutationFn: removeDiscountApi, // Expects { batchId, discountId }
        onSuccess: () => {
            showSuccessToast('Discount removed successfully!');
            invalidateCommonQueries(); // Refresh relevant data
        },
        onError: (err) => {
            showErrorToast(err, 'Failed to remove discount.');
            throw err; // Re-throw for dialog loading state
        }
    });

    // 4. Buy Back Mutation
    const buyFromCustomerMutation = useMutation({
         mutationFn: buyFromCustomerApi, // Expects buy back payload
         onSuccess: (newTransaction) => { // newTransaction is now the JSON data { _id: '...' }
            showSuccessToast('Buy Back transaction complete!');
            try {
                console.log("Buy Back Mutation onSuccess - Received data:", newTransaction); // DEBUG
                const transactionId = newTransaction?._id; // Should work now
                console.log("Buy Back Mutation extracted transactionId:", transactionId); // DEBUG
                if (!transactionId) throw new Error("Created transaction missing ID.");
                window.open(`/receipt/${transactionId}`, '_blank');
            } catch (receiptError) {
                console.error("Error opening receipt:", receiptError);
                showErrorToast({ message: "Transaction saved, but failed to open receipt tab." });
            }
            invalidateCommonQueries();
         },
         onError: (err) => {
             showErrorToast(err, 'Buy Back Failed');
             throw err; // Re-throw for modal error handling
         }
     });

      // 5. Issue Goods (Sale) Mutation
     const issueGoodsMutation = useMutation({
         mutationFn: (mutationData) => issueGoodsApi(mutationData.saleData), // Expects { saleData, originalItems }
         onSuccess: (createdTransaction, variables) => { // createdTransaction is now the JSON data
            showSuccessToast('Items issued successfully!');
            try {
                console.log("Issue Goods Mutation onSuccess - Received data:", createdTransaction); // DEBUG
                const transactionId = createdTransaction?._id; // Should work now
                console.log("Issue Goods Mutation extracted transactionId:", transactionId); // DEBUG
                if (!transactionId) throw new Error("Created transaction missing ID.");
                window.open(`/receipt/${transactionId}`, '_blank');
            } catch (receiptError) {
                console.error("Error opening receipt:", receiptError);
                showErrorToast({ message: "Sale saved, but failed to open receipt tab." });
            }
            invalidateCommonQueries();
            setPage(1);
         },
         onError: (err) => {
             showErrorToast(err, 'Failed to issue items.');
             throw err; // Re-throw for form error handling
         }
     });


    // --- Event Handlers ---

    const handleStartNewBatchTrigger = () => {
        let title = "Start First Batch";
        let body = "Create the first batch cycle for this customer?";
        const activeBatch = batches.find(b => b.status === 'Active');
        if (activeBatch) {
            title = "End Current & Start New Batch";
            body = `This will END active batch (#${activeBatch.batchNumber}) and start Batch #${(activeBatch.batchNumber || 0) + 1}. Proceed?`;
        } else if (batches.length > 0) {
            const latestBatchNum = batches[0]?.batchNumber || 0; // Assuming sorted descending
            title = "Start New Batch Cycle";
            body = `Start Batch #${latestBatchNum + 1}?`;
        }
        setConfirmMessage({ title, body });
        setIsConfirmModalOpen(true);
    };

    const handleConfirmBatchCycleAction = () => { startBatchMutation.mutate(); };
    const handlePageChange = (event, value) => setPage(value);
    const handleDateFilterChange = (event) => { setPage(1); setFilterDate(event.target.value); };
    const clearDateFilter = () => { setPage(1); setFilterDate(''); };

    // Function to pass down for opening receipt URL
    const handleViewReceipt = (transaction) => {
        if (transaction?._id) {
            window.open(`/receipt/${transaction._id}`, '_blank');
        } else {
            showErrorToast({ message: "Cannot generate receipt: Transaction ID missing." });
        }
    };

    // --- Loading & Error Display ---
    const isPageLoading = isLoadingCustomer || (isLoadingBatches && !customer); // Page is loading if customer or initial batches are loading

    if (isPageLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /></Box>;
    }
    if (isCustomerError) {
        return <Typography color="error" sx={{ p: 3, textAlign: 'center' }}>Error loading customer: {customerError?.response?.data?.error || customerError?.message || 'Please check connection.'}</Typography>;
    }
    if (!customer) { // If not loading and no customer data
        return <Typography sx={{ p: 3, textAlign: 'center' }}>Customer not found.</Typography>;
    }


    // --- Render Page ---
    return (
        // --- MODIFICATION: Removed maxWidth and mx ---
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        {/* --- END MODIFICATION --- */}
            <Typography variant="h4" align="center" gutterBottom sx={{ mb: 4 }}>{customer?.name || 'Loading...'}</Typography>

            <Stack spacing={3}>

                {/* 1. Customer Info */}
                {customer && <CustomerInfoCard customer={customer} />}
                <Divider />

                {/* 2. Batch Info / Start Batch CTA */}
                {isLoadingBatches ? (
                     <Paper sx={{ p: 2, textAlign: 'center' }}><CircularProgress size={24} /></Paper>
                ) : batches.length === 0 ? (
                    // No batches exist yet CTA
                    <Paper sx={{ p: 3, textAlign: 'center', border: '2px dashed #4CAF50', bgcolor: '#e8f5e9' }}>
                         <Typography variant="h6" color="primary.main" sx={{ mb: 1.5 }}> <AddCircleIcon sx={{ verticalAlign: 'middle', mr: 1 }} /> No Batches Found </Typography>
                         <Button onClick={handleStartNewBatchTrigger} variant="contained" color="success" size="large" disabled={startBatchMutation.isPending}>
                             {startBatchMutation.isPending ? <CircularProgress size={24} color="inherit" /> : 'Start First Batch Cycle'}
                         </Button>
                     </Paper>
                ) : selectedBatch ? (
                    // Display selected batch info
                    <BatchInfoCard
                        key={selectedBatch._id} // Key forces re-mount if batch object changes
                        batch={selectedBatch} // Pass the specific batch object
                        batchDetails={batchDetails} // Pass calculated details
                        onStartNewBatch={handleStartNewBatchTrigger} // Trigger confirm dialog
                        // Pass mutations for child component actions
                        addDiscountMutation={addDiscountMutation}
                        removeDiscountMutation={removeDiscountMutation}
                        buyFromCustomerMutation={buyFromCustomerMutation}
                    />
                ) : (
                     // If batches exist but none is selected (should be brief)
                     <Paper sx={{ p: 2, textAlign: 'center' }}><Typography>Loading batch details...</Typography></Paper>
                )}

                {/* 3. Issue Goods Form */}
                {/* Show only if an ACTIVE batch exists and customer data is loaded */}
                {batches.some(b => b.status === 'Active') && customer ? (
                    <IssueGoodsForm
                        customer={customer} // Pass customer data
                        // Pass a callback function that triggers the mutation
                        onIssueGoodsSubmit={(saleData, originalItems) => {
                            issueGoodsMutation.mutate({ saleData, originalItems });
                        }}
                        isSubmitting={issueGoodsMutation.isPending} // Pass loading state
                    />
                ) : !isLoadingBatches && batches.length > 0 && !batches.some(b => b.status === 'Active') ? (
                     // Message if batches exist, but none are active
                     <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light' }}>
                         <Typography color="text.secondary">No active batch. Start a new batch cycle to issue goods.</Typography>
                     </Paper>
                ) : null /* Don't show if batches are still loading or none exist */ }


                <Divider />

                {/* 4. Transaction History */}
                <Paper sx={{ p: { xs: 1, sm: 2, md: 3 }, overflow: 'hidden' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', color: 'text.primary' }}> <TimelineIcon sx={{ mr: 1 }} /> Transaction History </Typography>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                             {/* Batch Selector */}
                             {hasMultipleBatches && (
                                <FormControl sx={{ minWidth: 180 }} size="small">
                                    <InputLabel id="batch-select-label">View Batch</InputLabel>
                                    <Select
                                        labelId="batch-select-label" value={selectedBatchId} label="View Batch"
                                        onChange={(e) => setSelectedBatchId(e.target.value)} // Let useEffect handle page/filter reset
                                        disabled={isLoadingTransactions || isFetchingTransactions} // Disable while loading
                                    >
                                        {batches.map(batch => (
                                            <MenuItem key={batch._id} value={batch._id}> Batch #{batch.batchNumber} ({new Date(batch.startDate).toLocaleDateString()}) {batch.status === 'Active' && ' - ACTIVE'} </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                            {/* Date Filter */}
                            <TextField label="Filter by Date" type="date" size="small" value={filterDate} onChange={handleDateFilterChange} InputLabelProps={{ shrink: true }} sx={{ minWidth: '160px' }} disabled={!selectedBatchId || isLoadingTransactions || isFetchingTransactions} />
                            <Button size="small" variant="outlined" onClick={clearDateFilter} disabled={!filterDate || !selectedBatchId || isLoadingTransactions || isFetchingTransactions}> Clear </Button>
                        </Box>
                    </Box>

                    {/* Transaction Table Area */}
                    {!selectedBatchId ? ( // Show message if no batch is selected
                         <Typography variant="body1" align="center" sx={{ p: 4, color: 'text.secondary' }}> {batches.length > 0 ? 'Select a batch to view history.' : 'Start the first batch to record transactions.'} </Typography>
                    ) : ( // Show loading/error/table only if a batch IS selected
                        <TransactionHistory
                            transactions={transactions}
                            totalPages={totalPages}
                            page={page}
                            onPageChange={handlePageChange}
                            customerName={customer?.name || ''} // Pass customer name safely
                            isLoading={isLoadingTransactions || isFetchingTransactions} // Show loading skeleton
                            handleViewReceipt={handleViewReceipt} // Pass function to open receipt URL
                            isError={isTransactionError}
                            errorMessage={transactionError?.response?.data?.error || transactionError?.message || 'Failed to load transactions.'}
                        />
                    )}
                </Paper>
            </Stack>

            {/* Batch Cycle Confirmation Dialog */}
            <ConfirmDialog
                isOpen={isConfirmModalOpen}
                title={confirmMessage.title}
                message={confirmMessage.body}
                onConfirm={handleConfirmBatchCycleAction}
                onCancel={() => setIsConfirmModalOpen(false)}
                confirmButtonText="Yes, Proceed"
                confirmColor={batches.some(b => b.status === 'Active') ? 'warning' : 'success'}
                isLoading={startBatchMutation.isPending}
            />
        </Box>
    );
};

export default CustomerDetailsPage;

