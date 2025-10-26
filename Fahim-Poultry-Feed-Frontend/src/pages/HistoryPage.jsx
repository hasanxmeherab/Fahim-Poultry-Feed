import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/api';
import { debounce } from '@mui/material/utils'; // Import debounce

// React Query
import { useQuery } from '@tanstack/react-query';

// MUI Imports
import {
    Box, Button, Typography, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow,
    Paper, CircularProgress, Pagination, TextField
} from '@mui/material';
import TableSkeleton from '../components/TableSkeleton.jsx'; // Import Skeleton
import { showErrorToast } from '../utils/notifications.js'; // For error reporting

// API Fetch Function
const fetchAllTransactions = async (page, startDate, endDate) => {
    let url = `/transactions?page=${page}&limit=20`; // Use a limit, e.g., 20
    if (startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
    }
    console.log(`Fetching global transactions: ${url}`);
    const { data } = await api.get(url);
    return {
        transactions: data.transactions || [],
        totalPages: data.totalPages || 0
    };
};

const HistoryPage = () => {
    // Local UI State
    const [page, setPage] = useState(1);
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
    // State to trigger refetch when filters change via button click
    const [activeFilters, setActiveFilters] = useState({ startDate: '', endDate: '' });

    // --- React Query Data Fetching ---
    const {
        data: transactionData,
        isLoading,
        isFetching, // Indicates background refetching
        error,
        isError
    } = useQuery({
        // Query key includes active filters and page
        queryKey: ['transactions', activeFilters.startDate, activeFilters.endDate, page],
        queryFn: () => fetchAllTransactions(page, activeFilters.startDate, activeFilters.endDate),
        placeholderData: (prevData) => prevData, // Keep old data while refetching
        staleTime: 1000 * 30, // 30 seconds
        retry: 1,
    });

    // --- Derived State ---
    const transactions = transactionData?.transactions || [];
    const totalPages = transactionData?.totalPages || 0;

    // Handle date input changes
    const handleDateChange = (e) => {
        setDateRange({ ...dateRange, [e.target.name]: e.target.value });
    };

    // Apply filters and trigger refetch
    const handleApplyFilter = () => {
        setPage(1); // Reset to page 1 when applying filters
        setActiveFilters({ ...dateRange }); // Update active filters to trigger query refetch
    };

    // Clear filters and trigger refetch
    const handleClearFilter = () => {
        setPage(1);
        setDateRange({ startDate: '', endDate: '' });
        setActiveFilters({ startDate: '', endDate: '' }); // Clear active filters
    };

    // --- UPDATED: handleViewReceipt uses URL ---
    const handleViewReceipt = (transaction) => {
        // Check which fields are available to determine customer/buyer
        const customerName = transaction.customer?.name || transaction.wholesaleBuyer?.name || transaction.randomCustomerName || 'N/A';
        const type = transaction.type;

        // Check if receipt generation is applicable and ID exists
        if (['SALE', 'DEPOSIT', 'WITHDRAWAL', 'BUY_BACK', 'WHOLESALE_SALE'].includes(type) && transaction._id) {
            console.log(`HistoryPage: Opening receipt for transaction ID: ${transaction._id}`);
            window.open(`/receipt/${transaction._id}`, '_blank');
        } else if (!transaction._id) {
             console.error("HistoryPage: Cannot view receipt - Transaction ID missing.");
             showErrorToast({ message: "Cannot generate receipt: Transaction ID missing." });
        } else {
            console.log(`HistoryPage: No receipt applicable for type: ${type}`);
            // Optionally show a message that no receipt is available for this type
            // showInfoToast(`No receipt available for transaction type: ${type}`);
        }
    };
    // --- END UPDATE ---

    // Render helper for transaction details
    const renderDetail = (t) => {
        let details = t.notes || '';
        if (t.customer?.name) details += ` (Cust: ${t.customer.name})`;
        if (t.wholesaleBuyer?.name) details += ` (Buyer: ${t.wholesaleBuyer.name})`;
        if (t.product?.name) details += ` (Prod: ${t.product.name})`;
        if (t.randomCustomerName) details += ` (Rand Cust: ${t.randomCustomerName})`;
        return details || t.type?.replace('_', ' ') || 'N/A'; // Fallback
    };

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            <Typography variant="h4" component="h1" gutterBottom>Transaction History</Typography>

            {/* Filter Section */}
            <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <TextField
                    label="Start Date" type="date" name="startDate" size="small"
                    value={dateRange.startDate} onChange={handleDateChange}
                    InputLabelProps={{ shrink: true }} sx={{ minWidth: '160px' }}
                />
                <TextField
                    label="End Date" type="date" name="endDate" size="small"
                    value={dateRange.endDate} onChange={handleDateChange}
                    InputLabelProps={{ shrink: true }} sx={{ minWidth: '160px' }}
                />
                <Button
                    variant="contained" onClick={handleApplyFilter}
                    disabled={!dateRange.startDate || !dateRange.endDate || isFetching}
                > Apply Filter </Button>
                <Button
                    variant="outlined" onClick={handleClearFilter}
                    disabled={(!dateRange.startDate && !dateRange.endDate) || isFetching}
                > Clear Filter </Button>
                 {isFetching && <CircularProgress size={24} sx={{ ml: 1 }} />}
            </Paper>

            {/* Table Section */}
            {isLoading && transactions.length === 0 ? ( // Show skeleton only on initial full load
                <TableSkeleton columns={5} rowsNum={10} />
             ) : isError ? (
                 <Typography color="error" sx={{ textAlign: 'center', my: 3 }}>Error loading history: {error?.message}</Typography>
             ) : transactions.length === 0 ? (
                 <Typography sx={{ textAlign: 'center', my: 3, color: 'text.secondary' }}>No transactions found for the selected period.</Typography>
             ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ '& th': { backgroundColor: '#f4f6f8', fontWeight: 'bold' } }}>
                                <TableCell>Date & Time</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Details / Notes</TableCell>
                                <TableCell align="right">Amount (TK)</TableCell> {/* Added Amount */}
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {transactions.map((t) => (
                                <TableRow key={t._id} hover>
                                    <TableCell>{new Date(t.createdAt).toLocaleString()}</TableCell>
                                    <TableCell>{t.type?.replace('_', ' ') ?? 'N/A'}</TableCell>
                                    <TableCell>{renderDetail(t)}</TableCell>
                                    <TableCell align="right" sx={{ color: ['WITHDRAWAL', 'SALE', 'WHOLESALE_SALE', 'STOCK_REMOVE'].includes(t.type) ? 'error.main' : 'success.main', fontWeight: 'medium' }}>
                                        {t.amount != null ? t.amount.toFixed(2) : (t.quantityChange != null ? (t.quantityChange > 0 ? `+${t.quantityChange}` : `${t.quantityChange}`) + ' units' : 'N/A')}
                                    </TableCell>
                                    <TableCell>
                                        {/* --- Use updated handler --- */}
                                        {['SALE', 'DEPOSIT', 'WITHDRAWAL', 'BUY_BACK', 'WHOLESALE_SALE'].includes(t.type) && (
                                            <Button onClick={() => handleViewReceipt(t)} size="small" variant="outlined"> View Receipt </Button>
                                        )}
                                        {/* --- End Update --- */}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={(e, value) => setPage(value)} // Let useQuery handle refetch
                        color="primary"
                        disabled={isFetching} // Disable while refetching
                    />
                </Box>
            )}
        </Box>
    );
};

export default HistoryPage;
