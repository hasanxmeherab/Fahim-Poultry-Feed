import React, { useState } from 'react';
// api import no longer needed for mutations
import {
    Paper, Typography, Box, Button, Link as MuiLink, Modal, Fade,
    TextField, Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, CircularProgress,
    IconButton, Tooltip, FormHelperText
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { Link as RouterLink } from 'react-router-dom';
// showSuccessToast/showErrorToast are now handled by the parent mutation's global handlers
import ConfirmDialog from './ConfirmDialog.jsx';

const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: { xs: '90%', sm: 450 }, // Responsive width
    bgcolor: 'background.paper',
    borderRadius: '8px',
    boxShadow: 24,
    p: { xs: 2, sm: 3, md: 4 }, // Responsive padding
};

// Component receives mutation objects/functions as props
const BatchInfoCard = ({
    batch,
    batchDetails,
    onStartNewBatch, // Prop to trigger parent's confirm dialog
    addDiscountMutation,
    removeDiscountMutation,
    buyFromCustomerMutation
 }) => {

    // State for modal visibility and form inputs
    const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
    const [discountData, setDiscountData] = useState({ description: '', amount: '' });
    const [discountFormError, setDiscountFormError] = useState(''); // Local validation error

    const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);

    const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
    const [buyData, setBuyData] = useState({ quantity: '', weight: '', pricePerKg: '', referenceName: '' });
    const [buyFormErrors, setBuyFormErrors] = useState({}); // Local validation errors

    const [isConfirmOpen, setIsConfirmOpen] = useState(false); // For discount delete confirm
    const [discountToDeleteId, setDiscountToDeleteId] = useState(null);

    // --- Validation Functions ---
    const validateAddDiscount = () => {
        let error = '';
        const numAmount = parseFloat(discountData.amount);
        if (!discountData.description.trim()) {
            error = 'Description is required.';
        } else if (!discountData.amount || isNaN(numAmount) || numAmount <= 0) {
            error = 'Please enter a valid positive amount (e.g., 50.50).';
        }
        setDiscountFormError(error);
        return !error; // True if valid
    };

     const validateBuyBack = () => {
        const errors = {};
        const numQuantity = parseInt(buyData.quantity);
        const numWeight = parseFloat(buyData.weight);
        const numPricePerKg = parseFloat(buyData.pricePerKg);

        if (!buyData.quantity || isNaN(numQuantity) || !Number.isInteger(numQuantity) || numQuantity <= 0) errors.quantity = 'Requires a positive whole number.';
        if (!buyData.weight || isNaN(numWeight) || numWeight <= 0) errors.weight = 'Requires a positive number (e.g., 10.5).';
        if (!buyData.pricePerKg || isNaN(numPricePerKg) || numPricePerKg <= 0) errors.pricePerKg = 'Requires a positive number (e.g., 150.75).';

        setBuyFormErrors(errors);
        return Object.keys(errors).length === 0; // True if valid
    };

    // --- Mutation Handlers ---

    const handleAddDiscountSubmit = async (e) => {
        e.preventDefault();
        if (!validateAddDiscount()) return;

        const payload = {
            batchId: batch._id,
            discountData: { ...discountData, amount: parseFloat(discountData.amount) }
        };

        addDiscountMutation.mutate(payload, {
            onSuccess: () => {
                 setIsDiscountModalOpen(false);
                 setDiscountData({ description: '', amount: '' });
                 setDiscountFormError('');
            },
            onError: (err) => {
                 setDiscountFormError(err.response?.data?.error || err.message || 'Failed to add discount.');
            }
        });
    };

    const handleRemoveDiscountClick = (discountId) => {
        setDiscountToDeleteId(discountId);
        setIsConfirmOpen(true);
    };

    const handleConfirmRemoveDiscount = async () => {
        if (!discountToDeleteId) return;
        const payload = { batchId: batch._id, discountId: discountToDeleteId };
        removeDiscountMutation.mutate(payload, {
             onSuccess: () => {
                 setIsConfirmOpen(false);
                 setDiscountToDeleteId(null);
             },
             onError: () => { // Error toast handled in parent
                 setIsConfirmOpen(false);
                 setDiscountToDeleteId(null);
             }
         });
    };

    const handleBuyChange = (e) => {
         const { name, value } = e.target;
         let processedValue = value;
         if (['quantity', 'weight', 'pricePerKg'].includes(name)) {
             processedValue = value.replace(/[^0-9.]/g, ''); // Allow digits and dot
             if (name === 'quantity') processedValue = value.replace(/[^0-9]/g, ''); // Only digits
         }
         setBuyData({ ...buyData, [name]: processedValue });
         // Clear specific error on change
         if (buyFormErrors[name]) setBuyFormErrors(prev => ({ ...prev, [name]: '' }));
         if (buyFormErrors.general) setBuyFormErrors(prev => ({ ...prev, general: '' }));
    };

    const handleBuySubmit = async (e) => {
        e.preventDefault();
        if (!validateBuyBack()) return;

        // Ensure customerId exists before creating payload
        const customerId = batch.customer?._id || batch.customer;
        if (!customerId) {
            setBuyFormErrors(prev => ({ ...prev, general: 'Customer ID is missing.' }));
            return;
        }

        const payload = {
            customerId: customerId,
            quantity: parseInt(buyData.quantity),
            weight: parseFloat(buyData.weight),
            pricePerKg: parseFloat(buyData.pricePerKg),
            referenceName: buyData.referenceName.trim() || undefined // Send undefined if empty
        };

        buyFromCustomerMutation.mutate(payload, {
            onSuccess: () => {
                setIsBuyModalOpen(false);
                setBuyData({ quantity: '', weight: '', pricePerKg: '', referenceName: '' });
                setBuyFormErrors({});
            },
            onError: (err) => {
                 setBuyFormErrors(prev => ({ ...prev, general: err.response?.data?.message || err.response?.data?.error || 'Failed to process transaction.' }));
            }
        });
    };

    // Calculate buy back total dynamically
    const buyTotal = (parseFloat(buyData.weight) || 0) * (parseFloat(buyData.pricePerKg) || 0);

    // Render Guard
    if (!batch) {
        return <Paper sx={{ p: 2, mb: 3 }}><Typography>Loading batch info...</Typography></Paper>;
    }

    const isActionPending = addDiscountMutation.isPending || removeDiscountMutation.isPending || buyFromCustomerMutation.isPending;

    return (
        <>
            <Paper sx={{ p: 2, mb: 3 }}>
                {/* Batch Header & Actions */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                    <Typography variant="h6">Batch Actions</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {batch.status === 'Active' && (
                            <Button
                                onClick={() => {
                                    setBuyFormErrors({});
                                    setBuyData({ quantity: '', weight: '', pricePerKg: '', referenceName: '' });
                                    setIsBuyModalOpen(true);
                                }}
                                variant="contained" size="small"
                                disabled={isActionPending}
                            > Buy Back </Button>
                        )}
                        <Button
                            onClick={onStartNewBatch} variant="outlined" size="small" color="success"
                            disabled={isActionPending}
                        > {batch.status === 'Active' ? 'End & Start New Batch' : 'Start New Batch'} </Button>
                    </Box>
                </Box>

                {/* Batch Basic Info */}
                <Typography variant="body2" color="text.secondary">Batch #{batch.batchNumber} ({batch.status})</Typography>
                <Typography variant="body2" color="text.secondary">Started: {new Date(batch.startDate).toLocaleDateString()}</Typography>
                <Typography variant="body2" color="text.secondary">Starting Balance: TK {batch.startingBalance?.toFixed(2) ?? 'N/A'}</Typography>
                {batch.status === 'Completed' && batch.endDate && (
                    <>
                        <Typography variant="body2" color="text.secondary">Ended: {new Date(batch.endDate).toLocaleDateString()}</Typography>
                        <Typography variant="body2" color="text.secondary">Ending Balance: TK {batch.endingBalance?.toFixed(2) ?? 'N/A'}</Typography>
                    </>
                )}

                {/* Batch Financial Summary */}
                <Box sx={{ mt: 2, borderTop: '1px solid #eee', pt: 2 }}>
                    <Typography color="error.main"><strong>Total Issued (Credit):</strong> TK {batchDetails.totalSold?.toFixed(2) ?? '0.00'}</Typography>
                    {batchDetails.totalDiscounts > 0 && (
                        <Typography color="success.main"><strong>Total Discounts:</strong> - TK {batchDetails.totalDiscounts.toFixed(2)}</Typography>
                    )}
                    <Typography variant="h6" sx={{ borderTop: '1px solid #ddd', pt: 1, mt: 1, fontWeight: 'medium' }}>
                        <strong>Net Sale Total:</strong> TK {(batchDetails.totalSold - batchDetails.totalDiscounts)?.toFixed(2) ?? '0.00'}
                    </Typography>
                    {batchDetails.totalChickens > 0 && (
                        <Typography color="success.main" sx={{ mt: 2, borderTop: '1px solid #eee', pt: 2 }}>
                            <strong>Chickens Bought Back:</strong> {batchDetails.totalChickens} (Value: TK {batchDetails.totalBought?.toFixed(2) ?? '0.00'})
                        </Typography>
                    )}
                </Box>

                {/* Links & Item Details Button */}
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Button onClick={() => setIsSummaryModalOpen(true)} size="small" disabled={!batchDetails.productSummary || batchDetails.productSummary.length === 0}>
                        Issued Item Summary
                    </Button>
                    <MuiLink component={RouterLink} to={`/reports/batch/${batch._id}`} target="_blank" variant="body2">
                        View Full Batch Report
                    </MuiLink>
                </Box>

                {/* Discounts Section */}
                <Box sx={{ mt: 2, borderTop: '1px solid #eee', pt: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle1">Discounts / Adjustments</Typography>
                        {batch.status === 'Active' && (
                            <Button
                                onClick={() => { setDiscountFormError(''); setDiscountData({ description: '', amount: '' }); setIsDiscountModalOpen(true); }}
                                size="small" variant="outlined"
                                disabled={isActionPending}
                            > Add Discount </Button>
                        )}
                    </Box>
                    {batch.discounts?.length > 0 ? (
                        <Table size="small" sx={{ mb: 1 }}>
                            <TableBody>
                                {batch.discounts.map(d => (
                                    <TableRow key={d._id} sx={{ '& td': { border: 'none', padding: '4px 8px' } }}>
                                        <TableCell sx={{ pl: 0 }}>{d.description}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'medium' }}>{d.amount.toFixed(2)}</TableCell>
                                        {batch.status === 'Active' && (
                                            <TableCell align="right" sx={{ width: '40px', pr: 0 }}>
                                                <Tooltip title="Remove Discount">
                                                    <IconButton
                                                        onClick={() => handleRemoveDiscountClick(d._id)}
                                                        size="small" color="error"
                                                        disabled={isActionPending} // Disable if any action is pending
                                                    > <DeleteIcon fontSize="inherit" /> </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ pl: 1 }}>No discounts applied.</Typography>
                    )}
                </Box>
            </Paper>

            {/* Buy Back Modal */}
            <Dialog open={isBuyModalOpen} onClose={() => !buyFromCustomerMutation.isPending && setIsBuyModalOpen(false)} PaperProps={{ component: 'form', onSubmit: handleBuySubmit }}>
                <DialogTitle sx={{ fontWeight: 'bold' }}>Buy Back Transaction</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>Record chickens bought back for this batch.</DialogContentText>
                    <TextField autoFocus margin="dense" name="quantity" label="Chickens (Qty)" type="number" fullWidth value={buyData.quantity} onChange={handleBuyChange} required inputProps={{ min: 1, step: 1 }} error={!!buyFormErrors.quantity} helperText={buyFormErrors.quantity || ''} disabled={buyFromCustomerMutation.isPending} />
                    <TextField margin="dense" name="weight" label="Total Weight (kg)" type="number" fullWidth value={buyData.weight} onChange={handleBuyChange} required inputProps={{ min: 0, step: 'any' }} error={!!buyFormErrors.weight} helperText={buyFormErrors.weight || ''} disabled={buyFromCustomerMutation.isPending} />
                    <TextField margin="dense" name="pricePerKg" label="Price Per Kg (TK)" type="number" fullWidth value={buyData.pricePerKg} onChange={handleBuyChange} required inputProps={{ min: 0, step: 'any' }} error={!!buyFormErrors.pricePerKg} helperText={buyFormErrors.pricePerKg || ''} disabled={buyFromCustomerMutation.isPending} />
                    <TextField margin="dense" name="referenceName" label="Reference Name (Optional)" type="text" fullWidth value={buyData.referenceName} onChange={handleBuyChange} disabled={buyFromCustomerMutation.isPending} />
                    <Typography variant="h6" sx={{ mt: 2 }}> Total Credit: TK {buyTotal.toFixed(2)} </Typography>
                    {buyFormErrors.general && <FormHelperText error sx={{ mt: 1 }}>{buyFormErrors.general}</FormHelperText>}
                </DialogContent>
                <DialogActions sx={{ p: '16px 24px' }}>
                    <Button onClick={() => setIsBuyModalOpen(false)} disabled={buyFromCustomerMutation.isPending}>Cancel</Button>
                    <Button type="submit" variant="contained" disabled={buyFromCustomerMutation.isPending}>
                        {buyFromCustomerMutation.isPending ? <CircularProgress size={24} color="inherit" /> : 'Confirm & Generate Receipt'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Add Discount Modal */}
            <Modal open={isDiscountModalOpen} onClose={() => !addDiscountMutation.isPending && setIsDiscountModalOpen(false)} closeAfterTransition>
                <Fade in={isDiscountModalOpen}>
                    <Box sx={modalStyle}>
                         <Typography variant="h6" component="h2">Add Discount/Adjustment</Typography>
                        <Box component="form" onSubmit={handleAddDiscountSubmit} noValidate sx={{ mt: 2 }}>
                            <TextField fullWidth autoFocus margin="dense" label="Description" value={discountData.description} onChange={e => { setDiscountData({ ...discountData, description: e.target.value }); if (discountFormError) setDiscountFormError(''); }} required error={!!discountFormError} helperText={discountFormError || ''} disabled={addDiscountMutation.isPending} />
                            <TextField fullWidth margin="dense" label="Amount (TK)" type="number" value={discountData.amount} onChange={e => { setDiscountData({ ...discountData, amount: e.target.value.replace(/[^0-9.]/g, '') }); if (discountFormError) setDiscountFormError(''); }} required inputProps={{ min: "0.01", step: "0.01" }} error={!!discountFormError} disabled={addDiscountMutation.isPending} />
                            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                <Button onClick={() => setIsDiscountModalOpen(false)} disabled={addDiscountMutation.isPending}>Cancel</Button>
                                <Button type="submit" variant="contained" disabled={addDiscountMutation.isPending}>
                                    {addDiscountMutation.isPending ? <CircularProgress size={24} color="inherit" /> : 'Save Discount'}
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </Fade>
            </Modal>

             {/* Issued Item Summary Modal */}
             <Modal open={isSummaryModalOpen} onClose={() => setIsSummaryModalOpen(false)} closeAfterTransition>
                <Fade in={isSummaryModalOpen}>
                    <Box sx={{ ...modalStyle, width: { xs: '90%', sm: 500 }, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h6">Issued Item Summary (Batch #{batch.batchNumber})</Typography>
                         {batchDetails.productSummary?.length > 0 ? (
                            <TableContainer component={Paper} sx={{ mt: 2, boxShadow: 'none', flexGrow: 1, overflowY: 'auto' }}>
                                <Table size="small" stickyHeader>
                                    <TableHead><TableRow><TableCell>Product Name</TableCell><TableCell align="right">Total Qty Issued</TableCell></TableRow></TableHead>
                                    <TableBody>
                                        {batchDetails.productSummary.map(item => (
                                            <TableRow key={item.name} hover>
                                                <TableCell>{item.name}</TableCell>
                                                <TableCell align="right">{item.quantity}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        ) : ( <Typography sx={{ mt: 2, color: 'text.secondary', flexGrow: 1 }}>No items issued yet.</Typography> )}
                         <Button onClick={() => setIsSummaryModalOpen(false)} sx={{ mt: 2, alignSelf: 'flex-end' }}>Close</Button>
                    </Box>
                </Fade>
            </Modal>

            {/* Discount Removal Confirmation */}
            <ConfirmDialog
                isOpen={isConfirmOpen}
                title="Confirm Discount Removal"
                message="Remove this discount? This adjusts the balance and cannot be undone."
                onConfirm={handleConfirmRemoveDiscount}
                onCancel={() => setIsConfirmOpen(false)}
                confirmButtonText="Delete Discount"
                confirmColor="error"
                isLoading={removeDiscountMutation.isPending}
            />
        </>
    );
};

export default BatchInfoCard;