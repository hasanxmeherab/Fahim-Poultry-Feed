import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/api.js';
import { useParams } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { showErrorToast, showSuccessToast } from '../utils/notifications.js';

// React Query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// MUI Imports
import {
    Box, Button, Typography, TextField, Table,
    TableBody, TableCell, TableContainer, TableHead,
    TableRow, Paper, CircularProgress, Select, MenuItem,
    FormControl, InputLabel, Checkbox, FormControlLabel,
    Pagination, Divider, IconButton, FormHelperText
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TableSkeleton from '../components/TableSkeleton.jsx'; // Import Skeleton

// --- API Fetching Functions ---
const fetchBuyerDetails = async (buyerId) => {
    if (!buyerId) throw new Error("Buyer ID is required");
    console.log(`Fetching buyer details: ${buyerId}`);
    const { data } = await api.get(`/wholesale-buyers/${buyerId}`);
    if (!data) throw new Error("Buyer not found.");
    return data;
};

const fetchBuyerTransactions = async (buyerId, page, filterDate) => {
    if (!buyerId) return { transactions: [], totalPages: 0 };
    let url = `/transactions/wholesale-buyer/${buyerId}?page=${page}&limit=15`;
    if (filterDate) {
        url += `&date=${filterDate}`;
    }
    console.log(`Fetching buyer transactions: ${url}`);
    const { data } = await api.get(url);
    return {
        transactions: data.transactions || [],
        totalPages: data.totalPages || 0
    };
};

const fetchWholesaleProducts = async () => {
    console.log("Fetching wholesale products");
    const { data } = await api.get('/wholesale-products');
    return data || [];
};

// --- API Mutation Functions ---
// --- FIX: Added .then(res => res.data) ---
// This ensures onSuccess receives the JSON data, not the full Axios response
const submitWholesaleSaleApi = (payload) => api.post('/sales/wholesale', payload).then(res => res.data);
// --- END FIX ---


const WholesaleBuyerDetailsPage = () => {
    const { id: buyerId } = useParams();
    const queryClient = useQueryClient();

    // Local UI State
    const [page, setPage] = useState(1);
    const [filterDate, setFilterDate] = useState('');
    const [saleItems, setSaleItems] = useState([]); // Items currently being added to the sale
    const [newItem, setNewItem] = useState({ name: '', quantity: '1', weight: '', pricePerKg: '' }); // Form state for adding one item
    const [isCashPayment, setIsCashPayment] = useState(false);
    const [itemFormErrors, setItemFormErrors] = useState({}); // Errors for the 'add item' row
    const [saleSubmitError, setSaleSubmitError] = useState(''); // General error for sale submission

    // --- React Query Data Fetching ---
    const { data: buyer, isLoading: isLoadingBuyer, error: buyerError, isError: isBuyerError } = useQuery({
        queryKey: ['wholesaleBuyer', buyerId],
        queryFn: () => fetchBuyerDetails(buyerId),
        retry: 1,
        staleTime: 1000 * 60 * 5, // 5 mins cache
    });

    const { data: transactionData, isLoading: isLoadingTransactions, isFetching: isFetchingTransactions, error: transactionError, isError: isTransactionError } = useQuery({
        queryKey: ['wholesaleBuyerTransactions', buyerId, page, filterDate],
        queryFn: () => fetchBuyerTransactions(buyerId, page, filterDate),
        enabled: !!buyerId,
        placeholderData: (prev) => prev,
        staleTime: 1000 * 15, // 15 seconds
        retry: 1,
    });

    const { data: wholesaleProducts = [], isLoading: isLoadingProducts } = useQuery({
        queryKey: ['wholesaleProducts'],
        queryFn: fetchWholesaleProducts,
        staleTime: 1000 * 60 * 10, // 10 mins cache
    });

    // --- Derived State ---
    const transactions = transactionData?.transactions || [];
    const totalPages = transactionData?.totalPages || 0;
    const newItemTotalPrice = (parseFloat(newItem.weight) || 0) * (parseFloat(newItem.pricePerKg) || 0);
    const saleTotal = saleItems.reduce((acc, item) => acc + (item.totalPrice || 0), 0);

    // --- React Query Mutations ---
    const submitSaleMutation = useMutation({
        mutationFn: submitWholesaleSaleApi,
        onSuccess: (newTransaction) => { // newTransaction should be the JSON data
            // --- ADD THIS LOG ---
            console.log("Submit Sale Mutation onSuccess - Received data:", newTransaction);
            // --- END ADD LOG ---

            showSuccessToast('Wholesale sale created successfully!');
            try {
                // --- Open Receipt using ID ---
                const transactionId = newTransaction?._id; // Check if _id exists on the received data

                // --- ADD THIS LOG ---
                console.log("Extracted transactionId:", transactionId);
                // --- END ADD LOG ---

                if (!transactionId) {
                    // Throw a more specific error if ID is missing from the response data
                    throw new Error("Received transaction data from API is missing the '_id'.");
                }
                console.log('Opening Wholesale Sale receipt for transaction ID:', transactionId);
                window.open(`/receipt/${transactionId}`, '_blank');
                // --- End Open Receipt ---
            } catch (receiptError) {
                console.error("Error opening receipt:", receiptError);
                // Display the specific error from the catch block
                showErrorToast({ message: `Sale saved, but failed to open receipt: ${receiptError.message}` });
            }
            // Reset form and invalidate queries (keep this logic)
            setSaleItems([]);
            setNewItem({ name: '', quantity: '1', weight: '', pricePerKg: '' });
            setIsCashPayment(false);
            setPage(1);
            queryClient.invalidateQueries({ queryKey: ['wholesaleBuyer', buyerId] });
            queryClient.invalidateQueries({ queryKey: ['wholesaleBuyerTransactions', buyerId] });
        },
        onError: (err) =>{

            // Handle validation or other backend errors
            if (err.response && err.response.status === 400 && err.response.data.errors) {
                const firstErrorMsg = Object.values(err.response.data.errors[0])[0];
                setSaleSubmitError(firstErrorMsg || 'Validation failed.');
            } else {
                const errMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to complete sale.';
                setSaleSubmitError(errMsg);
                showErrorToast(err, 'Sale Submission Failed'); // Show global toast as well
            }
        }
    });

    // --- Event Handlers ---
    const handleNewItemChange = (e) => {
        const { name, value } = e.target;
        let processedValue = value;
        // Basic numeric filtering
        if (['quantity', 'weight', 'pricePerKg'].includes(name)) {
             processedValue = value.replace(/[^0-9.]/g, ''); // Allow digits and dot
             if (name === 'quantity') {
                processedValue = value.replace(/[^0-9]/g, ''); // Only digits
            }
        }
        setNewItem(prev => ({ ...prev, [name]: processedValue }));
        // Clear specific error on change
        if (itemFormErrors[name]) setItemFormErrors(prev => ({ ...prev, [name]: '' }));
        setSaleSubmitError(''); // Clear general submit error when editing item form
    };

    const validateNewItem = () => {
        const errors = {};
        const numQuantity = parseInt(newItem.quantity);
        const numWeight = parseFloat(newItem.weight);
        const numPricePerKg = parseFloat(newItem.pricePerKg);

        if (!newItem.name) errors.name = 'Product selection is required.';
        if (!newItem.quantity || isNaN(numQuantity) || !Number.isInteger(numQuantity) || numQuantity <= 0) errors.quantity = 'Requires positive whole number.';
        if (!newItem.weight || isNaN(numWeight) || numWeight <= 0) errors.weight = 'Requires positive number (e.g., 10.5).';
        if (!newItem.pricePerKg || isNaN(numPricePerKg) || numPricePerKg <= 0) errors.pricePerKg = 'Requires positive number (e.g., 150.75).';

        setItemFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleAddItemToSale = () => {
        if (!validateNewItem()) {
            setSaleSubmitError('Please correct errors in the item details above.');
            return;
        }
        const itemToAdd = {
            name: newItem.name,
            quantity: parseInt(newItem.quantity),
            weight: parseFloat(newItem.weight),
            pricePerKg: parseFloat(newItem.pricePerKg),
            totalPrice: newItemTotalPrice // Calculated total price for this item
        };
        setSaleItems(prevItems => [...prevItems, itemToAdd]);
        setNewItem({ name: '', quantity: '1', weight: '', pricePerKg: '' }); // Reset form
        setItemFormErrors({});
        setSaleSubmitError('');
    };

    const handleRemoveItemFromSale = (itemIndexToRemove) => {
        setSaleItems(prevItems => prevItems.filter((_, index) => index !== itemIndexToRemove));
        setSaleSubmitError(''); // Clear error if list changes
    };

    const validateSubmitSale = () => {
         if (saleItems.length === 0) {
             setSaleSubmitError('Please add at least one item to the sale.');
             return false;
         }
         return true;
    };

    const handleSubmitSale = () => {
        if (!validateSubmitSale()) return;
        setSaleSubmitError('');

        const payload = {
            wholesaleBuyerId: buyerId,
            items: saleItems.map(item => ({
                name: item.name,
                quantity: Number(item.quantity) || 0,
                weight: Number(item.weight) || 0,
                price: Number(item.totalPrice) || 0 // Send calculated total price per item
            })),
            isCashPayment: isCashPayment,
        };
        // Trigger the mutation
        submitSaleMutation.mutate(payload);
    };

    // Handle viewing receipt for past transactions (using URL parameter)
    const handleViewReceipt = (transaction) => {
        if (transaction?._id) {
            window.open(`/receipt/${transaction._id}`, '_blank');
        } else {
            showErrorToast({ message: "Cannot view receipt: Transaction ID missing." });
        }
    };

    // Render helper for transaction details
    const renderDetail = (t) => {
        if (t.type === 'WHOLESALE_SALE' && t.paymentMethod === 'Cash') return `${t.notes || 'Wholesale Sale'} (Paid in Cash)`;
        return t.notes || t.type?.replace('_', ' ') || 'N/A'; // Fallback
    };

    // --- Loading / Error States ---
    if (isLoadingBuyer) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    if (isBuyerError) return <Typography color="error" sx={{ p: 3 }}>Error loading buyer: {buyerError?.response?.data?.error || buyerError?.message || 'Unknown error'}</Typography>;
    if (!buyer) return <Typography sx={{ p: 3 }}>Buyer not found.</Typography>;

    // --- Render ---
    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            {/* Toast container for notifications */}
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop theme="colored" />
            <Typography variant="h4" gutterBottom>{buyer.name}</Typography>

            {/* Buyer Info Card */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6">Buyer Information</Typography>
                <Typography><strong>Business:</strong> {buyer.businessName || 'N/A'}</Typography>
                <Typography><strong>Phone:</strong> {buyer.phone}</Typography>
                <Typography variant="h5" sx={{ mt: 1, color: buyer.balance < 0 ? 'error.main' : 'success.dark', fontWeight: 'bold' }}>
                    Balance: TK {buyer.balance.toFixed(2)}
                </Typography>
            </Paper>

            {/* Make Sale Form */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Make a Wholesale Sale 🛒</Typography>
                {/* Item Input Row */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '3fr 1fr 1fr 1fr auto' }, gap: '10px', alignItems: 'start', mb: 1 }}>
                    {/* Product Select */}
                    <FormControl fullWidth size="small" error={!!itemFormErrors.name}>
                        <InputLabel id="wh-product-select-label">Product</InputLabel>
                        <Select
                            labelId="wh-product-select-label" name="name" label="Product"
                            value={newItem.name} onChange={handleNewItemChange}
                            disabled={isLoadingProducts || submitSaleMutation.isPending}
                        >
                            <MenuItem value="" disabled><em>{isLoadingProducts ? 'Loading...' : 'Select Product'}</em></MenuItem>
                            {wholesaleProducts.map(p => (<MenuItem key={p._id} value={p.name}>{p.name}</MenuItem>))}
                        </Select>
                        {itemFormErrors.name && <FormHelperText>{itemFormErrors.name}</FormHelperText>}
                    </FormControl>
                    {/* Quantity */}
                    <TextField size="small" type="number" name="quantity" label="Quantity" value={newItem.quantity} onChange={handleNewItemChange} inputProps={{ min: 1, step: 1 }} error={!!itemFormErrors.quantity} helperText={itemFormErrors.quantity || ''} disabled={submitSaleMutation.isPending} />
                    {/* Weight */}
                    <TextField size="small" type="number" name="weight" label="Weight (kg)" value={newItem.weight} onChange={handleNewItemChange} inputProps={{ min: 0, step: 'any' }} error={!!itemFormErrors.weight} helperText={itemFormErrors.weight || ''} disabled={submitSaleMutation.isPending} />
                    {/* Price Per Kg */}
                    <TextField size="small" type="number" name="pricePerKg" label="Price/kg (TK)" value={newItem.pricePerKg} onChange={handleNewItemChange} inputProps={{ min: 0, step: 'any' }} error={!!itemFormErrors.pricePerKg} helperText={itemFormErrors.pricePerKg || ''} disabled={submitSaleMutation.isPending} />
                    {/* Add Button */}
                    <Button onClick={handleAddItemToSale} variant="contained" sx={{ mt: { xs: 1, sm: 0 }, height: '40px' }} disabled={isLoadingProducts || submitSaleMutation.isPending}>Add</Button>
                </Box>
                 {/* Item Total & Add Item Error */}
                 <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, mb: 2 }}>
                     {/* Show general error only if no specific field errors are shown */}
                     <FormHelperText error>{saleSubmitError && saleItems.length === 0 && !Object.keys(itemFormErrors).length ? saleSubmitError : ''}&nbsp;</FormHelperText>
                     <Typography sx={{fontWeight: 'medium', fontSize: '0.9rem', color: 'text.secondary'}}> Item Total: TK {newItemTotalPrice.toFixed(2)} </Typography>
                 </Box>

                {/* Items List */}
                {saleItems.length > 0 && (
                    <Box sx={{mt: 2, mb: 2, maxHeight: '200px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '4px' }}>
                        <Typography variant="subtitle1" sx={{mb: 1, p: 1, borderBottom: '1px solid #eee', position: 'sticky', top: 0, background: 'white', zIndex: 1}}>Items in Sale</Typography>
                        {saleItems.map((item, index) => (
                            <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5, px: 1, borderBottom: index !== saleItems.length - 1 ? '1px solid #eee' : 'none' }}>
                                <Typography variant="body2">{item.name} ({item.quantity} units, {item.weight}kg @ {item.pricePerKg}/kg)</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" sx={{ minWidth: '70px', textAlign: 'right', fontWeight: 'medium' }}> TK {item.totalPrice.toFixed(2)} </Typography>
                                    <IconButton onClick={() => handleRemoveItemFromSale(index)} size="small" aria-label="remove item" color="error" disabled={submitSaleMutation.isPending}> <CloseIcon fontSize="inherit" /> </IconButton>
                                </Box>
                            </Box>
                        ))}
                        <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
                        <Typography variant="h6" sx={{ textAlign: 'right', fontWeight: 'bold', p: 1 }}> Final Sale Total: TK {saleTotal.toFixed(2)} </Typography>
                    </Box>
                )}
                {/* Cash Payment & Submit Error */}
                <FormControlLabel control={<Checkbox checked={isCashPayment} onChange={(e) => setIsCashPayment(e.target.checked)} disabled={submitSaleMutation.isPending} />} label="Paid in Cash 💵" sx={{ mt: 1, display: 'block' }} />
                {saleSubmitError && saleItems.length > 0 && <FormHelperText error sx={{ mt: 1, fontSize: '0.9rem' }}>{saleSubmitError}</FormHelperText>}

                {/* Complete Sale Button */}
                <Button onClick={handleSubmitSale} variant="contained" color="success" fullWidth sx={{ mt: 2, py: 1.2 }} disabled={submitSaleMutation.isPending || saleItems.length === 0}>
                    {submitSaleMutation.isPending ? <CircularProgress size={24} color="inherit" /> : 'Complete Sale & Generate Receipt'}
                </Button>
            </Paper>

            {/* Transaction History */}
            <Paper sx={{ overflow: 'hidden' }}>
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="h5">Transaction History</Typography>
                     <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                         <TextField label="Filter by Date" type="date" size="small" value={filterDate} onChange={(e) => { setPage(1); setFilterDate(e.target.value); }} InputLabelProps={{ shrink: true }} sx={{ minWidth: '160px' }} disabled={isLoadingTransactions || isFetchingTransactions} />
                         <Button size="small" variant="outlined" onClick={() => { setPage(1); setFilterDate(''); }} disabled={!filterDate || isLoadingTransactions || isFetchingTransactions}>Clear</Button>
                     </Box>
                </Box>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ '& th': { backgroundColor: '#f4f6f8', fontWeight: 'bold' } }}>
                                <TableCell>Date</TableCell> <TableCell>Type</TableCell> <TableCell>Details</TableCell> <TableCell align="right">Amount (TK)</TableCell> <TableCell align="right">Balance After (TK)</TableCell> <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                             {(isLoadingTransactions || isFetchingTransactions) && transactions.length === 0 ? ( // Show skeleton only on initial load
                                <TableSkeleton columns={6} rowsNum={5}/>
                             ) : transactions.length === 0 ? (
                                <TableRow><TableCell colSpan={6} align="center" sx={{py: 4}}>No transactions found for this period.</TableCell></TableRow>
                             ) : (
                                transactions.map((t) => (
                                    <TableRow key={t._id} hover>
                                        <TableCell>{new Date(t.createdAt).toLocaleString()}</TableCell>
                                        <TableCell>{t.type?.replace('_', ' ') ?? 'N/A'}</TableCell>
                                        <TableCell>{renderDetail(t)}</TableCell>
                                        <TableCell align="right" sx={{ color: ['WITHDRAWAL', 'WHOLESALE_SALE'].includes(t.type) ? 'error.main' : 'success.main', fontWeight: 'medium' }}>{t.amount?.toFixed(2) ?? 'N/A'}</TableCell>
                                        <TableCell align="right">{t.balanceAfter?.toFixed(2) ?? 'N/A'}</TableCell>
                                        <TableCell>{['WHOLESALE_SALE', 'DEPOSIT', 'WITHDRAWAL'].includes(t.type) && (<Button onClick={() => handleViewReceipt(t)} size="small" variant="outlined">Receipt</Button>)}</TableCell>
                                    </TableRow>
                                ))
                             )}
                             {isTransactionError && (
                                 <TableRow><TableCell colSpan={6} align="center"><Typography color="error">Error loading transactions: {transactionError?.message}</Typography></TableCell></TableRow>
                             )}
                        </TableBody>
                    </Table>
                </TableContainer>
                {/* Pagination */}
                {totalPages > 1 && (<Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}><Pagination count={totalPages} page={page} onChange={(e, value) => setPage(value)} color="primary" disabled={isFetchingTransactions} /></Box>)}
            </Paper>
        </Box>
    );
};

export default WholesaleBuyerDetailsPage;

