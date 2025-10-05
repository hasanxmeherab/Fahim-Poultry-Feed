// frontend/src/components/TransactionHistory.jsx

import React from 'react';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Pagination, Box, Button } from '@mui/material';

const TransactionHistory = ({ transactions, totalPages, page, onPageChange, customerName }) => {
    
    const handleViewReceipt = (transaction) => {
        let receiptData = {};
        if (transaction.type === 'SALE') {
            receiptData = { type: 'sale', customerName, items: transaction.items, totalAmount: transaction.amount, balanceBefore: transaction.balanceBefore, balanceAfter: transaction.balanceAfter, date: transaction.createdAt, paymentMethod: transaction.paymentMethod };
        } else if (['DEPOSIT', 'WITHDRAWAL'].includes(transaction.type)) {
            receiptData = { type: 'deposit', customerName, depositAmount: transaction.amount, balanceBefore: transaction.balanceBefore, balanceAfter: transaction.balanceAfter, date: transaction.createdAt };
        } else if (transaction.type === 'BUY_BACK') {
            receiptData = { type: 'buy_back', customerName, date: transaction.createdAt, buyBackQuantity: transaction.buyBackQuantity, buyBackWeight: transaction.buyBackWeight, buyBackPricePerKg: transaction.buyBackPricePerKg, totalAmount: transaction.amount, balanceBefore: transaction.balanceBefore, referenceName: transaction.referenceName, balanceAfter: transaction.balanceAfter };
        } else { return; }
        sessionStorage.setItem('receiptData', JSON.stringify(receiptData));
        window.open('/receipt', '_blank');
    };

    // --- NEW renderDetail function ---
    const renderDetail = (t) => {
        if (t.type === 'SALE' && t.customer && t.paymentMethod === 'Cash') {
            return `${t.notes} (Paid in Cash)`;
        }
        if (t.type === 'BUY_BACK' && t.referenceName) {
            return `${t.notes} (Ref: ${t.referenceName})`;
        }
        return t.notes;
    };

    return (
        <Paper>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Details</TableCell>
                            <TableCell align="right">Amount (TK)</TableCell>
                            <TableCell align="right">Balance (TK)</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {transactions.map((t) => (
                            <TableRow key={t._id}>
                                <TableCell>{new Date(t.createdAt).toLocaleString()}</TableCell>
                                <TableCell>{t.type}</TableCell>
                                <TableCell>{renderDetail(t)}</TableCell>
                                <TableCell align="right" sx={{ color: ['DISCOUNT', 'BUY_BACK', 'DEPOSIT'].includes(t.type) ? 'success.main' : 'error.main' }}>
                                    {t.amount != null ? t.amount.toFixed(2) : 'N/A'}
                                </TableCell>
                                <TableCell align="right">
                                    {t.balanceAfter != null ? t.balanceAfter.toFixed(2) : 'N/A'}
                                </TableCell>
                                <TableCell>
                                    {['SALE', 'DEPOSIT', 'WITHDRAWAL', 'BUY_BACK'].includes(t.type) && (
                                        <Button onClick={() => handleViewReceipt(t)} size="small" variant="outlined">Receipt</Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            {totalPages > 1 && (
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                    <Pagination count={totalPages} page={page} onChange={onPageChange} color="primary" />
                </Box>
            )}
        </Paper>
    );
};

export default TransactionHistory;