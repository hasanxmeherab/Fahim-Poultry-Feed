import React from 'react';
import {
    Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Pagination, Box, Button, Typography, CircularProgress // Added Typography, CircularProgress
} from '@mui/material';
import TableSkeleton from './TableSkeleton'; // Assuming you have this component

// --- UPDATED: Receive 'handleViewReceipt' prop, 'isLoading', 'isError', 'errorMessage' ---
const TransactionHistory = ({
    transactions = [], // Default to empty array
    totalPages = 0,
    page = 1,
    onPageChange,
    customerName, // Keep if needed for context, though receipt page fetches details
    handleViewReceipt, // Renamed from onViewReceiptClick for consistency, but IMPORTANT: This is the function passed from parent
    isLoading = false,
    isError = false,
    errorMessage = 'Failed to load transactions.'
}) => {

    // --- REMOVED: Incorrect local handleViewReceipt function ---
    // const handleViewReceipt = (transaction) => { ... OLD sessionStorage LOGIC ... };
    // --- END REMOVAL ---

    // Render helper for transaction details
    const renderDetail = (t) => {
        let details = t.notes || '';
        // Add context based on populated fields (safer access with ?.)
        if (t.customer?.name) details += ` (Cust: ${t.customer.name})`;
        else if (t.wholesaleBuyer?.name) details += ` (Buyer: ${t.wholesaleBuyer.name})`;
        else if (t.randomCustomerName) details += ` (Rand Cust: ${t.randomCustomerName})`;

        if (t.product?.name) details += ` (Prod: ${t.product.name})`;
        else if (t.items?.length > 0) details += ` (${t.items.length} items)`; // For SALES
        else if (t.customItems?.length > 0) details += ` (${t.customItems.length} whsl items)`; // For WHOLESALE_SALES

        return details || t.type?.replace('_', ' ') || 'N/A'; // Fallback
    };


    return (
        // No Paper needed if parent wraps in Paper
        <>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow sx={{ '& th': { backgroundColor: '#f4f6f8', fontWeight: 'bold' } }}>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>Date & Time</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Details / Notes</TableCell>
                            <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>Amount/Change</TableCell>
                            <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>Balance After</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            <TableSkeleton columns={6} rowsNum={5} /> // Show skeleton when loading
                        ) : isError ? (
                            <TableRow><TableCell colSpan={6} align="center"><Typography color="error">{errorMessage}</Typography></TableCell></TableRow>
                        ) : transactions.length === 0 ? (
                            <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No transactions found for this period.</Typography></TableCell></TableRow>
                        ) : (
                            transactions.map((t) => (
                                <TableRow key={t?._id || Math.random()} hover> {/* Add fallback key */}
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{t.createdAt ? new Date(t.createdAt).toLocaleString() : 'N/A'}</TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{t.type?.replace('_', ' ') ?? 'N/A'}</TableCell>
                                    <TableCell>{renderDetail(t)}</TableCell>
                                    {/* Display amount or quantity change */}
                                    <TableCell align="right" sx={{ color: ['WITHDRAWAL', 'SALE', 'WHOLESALE_SALE', 'STOCK_REMOVE', 'DISCOUNT_REMOVAL'].includes(t.type) ? 'error.main' : 'success.main', fontWeight: 'medium', whiteSpace: 'nowrap' }}>
                                        {t.amount != null ? `TK ${t.amount.toFixed(2)}`
                                         : t.quantityChange != null ? `${t.quantityChange > 0 ? '+' : ''}${t.quantityChange} units`
                                         : 'N/A'}
                                    </TableCell>
                                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                        {t.balanceAfter != null ? `TK ${t.balanceAfter.toFixed(2)}` : 'N/A'}
                                    </TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                        {/* --- UPDATED: Call the prop function --- */}
                                        {['SALE', 'DEPOSIT', 'WITHDRAWAL', 'BUY_BACK', 'WHOLESALE_SALE'].includes(t.type) && (
                                            <Button onClick={() => handleViewReceipt(t)} size="small" variant="outlined"> View Receipt </Button>
                                        )}
                                        {/* --- END UPDATE --- */}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            {/* Pagination */}
            {totalPages > 1 && !isLoading && !isError && ( // Only show pagination if not loading/error and multiple pages
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                    <Pagination count={totalPages} page={page} onChange={onPageChange} color="primary" disabled={isLoading} />
                </Box>
            )}
        </>
    );
};

export default TransactionHistory;

