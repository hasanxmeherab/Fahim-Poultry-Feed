// frontend/src/components/BatchInfoCard.jsx

import React, { useState } from 'react';
import api from '../api/api';
import { 
    Paper, Typography, Box, Button, Link as MuiLink, Modal, Fade, 
    TextField, Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { showErrorToast, showSuccessToast } from '../utils/notifications.js';

const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 450,
    bgcolor: 'background.paper',
    borderRadius: '8px',
    boxShadow: 24,
    p: 4,
};

const BatchInfoCard = ({ batch, batchDetails, onStartNewBatch, onDataRefresh }) => {
    const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
    const [discountData, setDiscountData] = useState({ description: '', amount: '' });
    const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
    const [formError, setFormError] = useState('');

    // State for the Buy from Customer Modal
    const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
    const [buyData, setBuyData] = useState({ quantity: '', weight: '', pricePerKg: '', referenceName: '' });

    const handleAddDiscount = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/batches/${batch._id}/discount`, discountData);
            showSuccessToast('Discount added successfully!');
            onDataRefresh();
            setIsDiscountModalOpen(false);
            setDiscountData({ description: '', amount: '' });
        } catch (err) {
            setFormError(err.response?.data?.message || 'Failed to add discount.');
        }
    };

    const handleRemoveDiscount = async (discountId) => {
        if (!window.confirm('Are you sure you want to remove this discount?')) return;
        try {
            await api.delete(`/batches/${batch._id}/discount/${discountId}`);
            showSuccessToast('Discount removed successfully!');
            onDataRefresh();
        } catch (err) {
            showErrorToast(err, 'Failed to remove discount.');
        }
    };

    const handleBuyChange = (e) => {
        setBuyData({ ...buyData, [e.target.name]: e.target.value });
    };

    // --- UPDATED LOGIC: Buy Back only performs the transaction and refreshes data ---
    const handleBuySubmit = async (e) => {
        e.preventDefault();
        setFormError(''); 

        // Basic Validation
        if (!buyData.quantity || !buyData.weight || !buyData.pricePerKg || parseFloat(buyData.quantity) <= 0) {
             setFormError("Please enter valid positive numbers for quantity, weight, and price.");
             return;
        }

        try {
            const payload = { customerId: batch.customer, ...buyData };
            
            // 1. Post the Buy Back Transaction
            const response = await api.post('/customers/buyback', payload);
            const newTransaction = response.data;
            
            // 2. Generate the receipt data (using transaction details)
            const receiptData = {
                type: 'buy_back',
                customerName: newTransaction.customer?.name || 'N/A',
                date: newTransaction.createdAt,
                buyBackQuantity: newTransaction.buyBackQuantity,
                buyBackWeight: newTransaction.buyBackWeight,
                buyBackPricePerKg: newTransaction.buyBackPricePerKg,
                totalAmount: newTransaction.amount,
                balanceBefore: newTransaction.balanceBefore,
                referenceName: newTransaction.referenceName,
                balanceAfter: newTransaction.balanceAfter,
            };
            sessionStorage.setItem('receiptData', JSON.stringify(receiptData));
            window.open('/receipt', '_blank');
            
            // 3. Refresh page data, but DO NOT start a new batch.
            onDataRefresh();
            showSuccessToast('Buy Back transaction complete!');
            
            // 4. Close modal and reset form
            setIsBuyModalOpen(false);
            setBuyData({ quantity: '', weight: '', pricePerKg: '', referenceName: '' });
            
        } catch (err) {
            setFormError(err.response?.data?.message || 'Failed to process transaction.');
        }
    };

    const buyTotal = (parseFloat(buyData.weight) || 0) * (parseFloat(buyData.pricePerKg) || 0);

    return (
        <>
            <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6">Batch Actions</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        
                        {/* BUTTON 1: BUY BACK (Transaction only - Always available on active batch) */}
                        {batch.status === 'Active' && (
                            <Button 
                                onClick={() => { 
                                    setFormError(''); 
                                    setIsBuyModalOpen(true); 
                                }} 
                                variant="contained" 
                                size="small"
                            >
                                Buy Back
                            </Button>
                        )}

                        {/* BUTTON 2: END & START NEW (For Active Batches) OR START NEW (For Completed Batches) */}
                        <Button 
                            onClick={onStartNewBatch} 
                            variant="outlined" 
                            size="small" 
                            color="success"
                        >
                            {/* The "End & Start New" handler is now responsible for closing the ledger */}
                            {batch.status === 'Active' ? 'End & Start New Batch' : 'Start New Batch'}
                        </Button>
                        
                    </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary">Batch #{batch.batchNumber} ({batch.status})</Typography>
                <Typography variant="body2" color="text.secondary">Started: {new Date(batch.startDate).toLocaleDateString()}</Typography>
                <Typography variant="body2" color="text.secondary">Starting Balance: TK {batch.startingBalance.toFixed(2)}</Typography>
                {batch.status === 'Completed' && batch.endDate && (
                    <>
                        <Typography variant="body2" color="text.secondary">Ended: {new Date(batch.endDate).toLocaleDateString()}</Typography>
                        <Typography variant="body2" color="text.secondary">Ending Balance: TK {batch.endingBalance.toFixed(2)}</Typography>
                    </>
                )}

                <Box sx={{ mt: 2, borderTop: '1px solid #eee', pt: 2 }}>
                    <Typography color="error.main"><strong>Total Items Issued:</strong> TK {batchDetails.totalSold.toFixed(2)}</Typography>
                    {batchDetails.totalDiscounts > 0 && (<Typography color="success.main"><strong>Total Discounts:</strong> - TK {batchDetails.totalDiscounts.toFixed(2)}</Typography>)}
                    <Typography variant="h6" sx={{ borderTop: '1px solid #ddd', pt: 1, mt: 1 }}><strong>Net Total:</strong> TK {(batchDetails.totalSold - batchDetails.totalDiscounts).toFixed(2)}</Typography>
                    <Typography color="success.main" sx={{ mt: 2, borderTop: '1px solid #eee', pt: 2 }}><strong>Chickens Bought:</strong> {batchDetails.totalChickens} (TK {batchDetails.totalBought.toFixed(2)})</Typography>
                </Box>

                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                    <Button onClick={() => setIsSummaryModalOpen(true)} size="small">View Item Details</Button>
                    <MuiLink component={RouterLink} to={`/reports/batch/${batch._id}`} target="_blank">View Full Report</MuiLink>
                </Box>
                
                <Box sx={{ mt: 2, borderTop: '1px solid #eee', pt: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle1">Discounts / Adjustments</Typography>
                        {batch.status === 'Active' && (<Button onClick={() => setIsDiscountModalOpen(true)} size="small" variant="outlined">Add Discount</Button>)}
                    </Box>
                    {batch.discounts?.length > 0 ? (
                        <Table size="small">
                            <TableBody>{batch.discounts.map(d => ( <TableRow key={d._id}> <TableCell sx={{p: 1, border: 'none'}}>{d.description}</TableCell> <TableCell sx={{p: 1, border: 'none'}} align="right">{d.amount.toFixed(2)}</TableCell> {batch.status === 'Active' && (<TableCell sx={{p: 0, border: 'none', width: '30px'}} align="right"><Button onClick={() => handleRemoveDiscount(d._id)} size="small" color="error" sx={{ minWidth: 'auto', p: 0.5 }}>X</Button></TableCell>)}</TableRow>))}</TableBody>
                        </Table>
                    ) : (<Typography variant="body2" color="text.secondary">No discounts applied.</Typography>)}
                </Box>
            </Paper>

            {/* BUY FROM CUSTOMER MODAL (The submit only refreshes data) */}
            <Dialog open={isBuyModalOpen} onClose={() => setIsBuyModalOpen(false)}>
                <DialogTitle>Buy Back Transaction</DialogTitle>
                <Box component="form" onSubmit={handleBuySubmit}>
                    <DialogContent>
                        <DialogContentText sx={{ mb: 2 }}>Records the chickens bought back from the customer.</DialogContentText>
                        <TextField autoFocus margin="dense" name="quantity" label="Number of Chickens (Quantity)" type="number" fullWidth value={buyData.quantity} onChange={handleBuyChange} required />
                        <TextField margin="dense" name="weight" label="Total Weight (kg)" type="number" fullWidth value={buyData.weight} onChange={handleBuyChange} required />
                        <TextField margin="dense" name="pricePerKg" label="Price Per Kg (TK)" type="number" fullWidth value={buyData.pricePerKg} onChange={handleBuyChange} required />
                        <TextField margin="dense" name="referenceName" label="Reference Name (Optional)" type="text" fullWidth value={buyData.referenceName} onChange={handleBuyChange} />
                        <Typography variant="h6" sx={{ mt: 2 }}>Total Credit: TK {buyTotal.toFixed(2)}</Typography>
                        {formError && <Typography color="error" sx={{ mt: 1 }}>{formError}</Typography>}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setIsBuyModalOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="contained">Confirm Transaction</Button>
                    </DialogActions>
                </Box>
            </Dialog>

            {/* DISCOUNT MODAL */}
            <Modal open={isDiscountModalOpen} onClose={() => setIsDiscountModalOpen(false)} closeAfterTransition>
                <Fade in={isDiscountModalOpen}><Box sx={modalStyle}>
                    <Typography variant="h6">Add Discount</Typography>
                    <Box component="form" onSubmit={handleAddDiscount} sx={{ mt: 2 }}>
                        <TextField fullWidth autoFocus margin="dense" label="Description" value={discountData.description} onChange={e => setDiscountData({...discountData, description: e.target.value})} required />
                        <TextField fullWidth margin="dense" label="Amount (TK)" type="number" value={discountData.amount} onChange={e => setDiscountData({...discountData, amount: e.target.value})} required />
                        {formError && <Typography color="error">{formError}</Typography>}
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}><Button onClick={() => setIsDiscountModalOpen(false)}>Cancel</Button><Button type="submit" variant="contained">Save</Button></Box>
                    </Box>
                </Box></Fade>
            </Modal>

            {/* SUMMARY MODAL */}
            <Modal open={isSummaryModalOpen} onClose={() => setIsSummaryModalOpen(false)} closeAfterTransition>
                <Fade in={isSummaryModalOpen}><Box sx={modalStyle}>
                    <Typography variant="h6">Total Items Sold in Batch</Typography>
                    <TableContainer component={Paper} sx={{mt: 2, boxShadow: 'none'}}>
                        <Table size="small">
                            <TableHead><TableRow><TableCell>Product</TableCell><TableCell align="right">Quantity</TableCell></TableRow></TableHead>
                            <TableBody>{batchDetails.productSummary.map(item => ( <TableRow key={item.name}><TableCell>{item.name}</TableCell><TableCell align="right">{item.quantity}</TableCell></TableRow>))}</TableBody>
                        </Table>
                    </TableContainer>
                </Box></Fade>
            </Modal>
        </>
    );
};

export default BatchInfoCard;