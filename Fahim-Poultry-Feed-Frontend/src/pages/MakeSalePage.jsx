import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';
import { showErrorToast, showSuccessToast } from '../utils/notifications.js';
import { debounce } from '@mui/material/utils';

// Import React Query Hooks
import { useMutation, useQueryClient } from '@tanstack/react-query';

// MUI Imports
import {
    Box, Button, Typography, TextField, Table,
    TableBody, TableCell, TableContainer, TableHead,
    TableRow, Paper, CircularProgress, Autocomplete,
    Checkbox, FormControlLabel, Divider, IconButton, FormHelperText
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

// API Function (Make sure .then(res => res.data) is here)
const createSaleApi = (saleData) => api.post('/sales', saleData).then(res => res.data);


const MakeSalePage = () => {
    // --- Local UI State ---
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [saleItems, setSaleItems] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantity, setQuantity] = useState('1');
    const [formErrors, setFormErrors] = useState({});
    const navigate = useNavigate();
    const [isRandomCustomer, setIsRandomCustomer] = useState(false);
    const [isCashPayment, setIsCashPayment] = useState(false);
    const [randomCustomerName, setRandomCustomerName] = useState('');
    const [saleSubmitError, setSaleSubmitError] = useState(''); // <-- NEW STATE FOR GENERAL SUBMISSION ERROR

    // State for Async Customer Search
    const [customerOpen, setCustomerOpen] = useState(false);
    const [customerOptions, setCustomerOptions] = useState([]);
    const [customerInput, setCustomerInput] = useState('');
    const [isCustomerLoading, setIsCustomerLoading] = useState(false);

    // State for Async Product Search
    const [productOpen, setProductOpen] = useState(false);
    const [productOptions, setProductOptions] = useState([]);
    const [productInput, setProductInput] = useState('');
    const [isProductLoading, setIsProductLoading] = useState(false);

    const queryClient = useQueryClient();

    // Effect for cash payment toggle
    useEffect(() => {
        if (isRandomCustomer) {
            setIsCashPayment(true);
            setFormErrors(prev => ({ ...prev, customer: '' })); // Clear customer error
            setSelectedCustomer(null); // Clear selected customer
            setCustomerInput('');
            setCustomerOptions([]);
        }
    }, [isRandomCustomer]);

    // --- Debounced fetch functions ---
    const fetchCustomers = useCallback(debounce(async (input) => {
        if (!input && !customerOpen) return;
        setIsCustomerLoading(true);
        try {
            const response = await api.get(`/customers?search=${input}`);
            setCustomerOptions(response.data);
        } catch (err) { console.error("Failed fetch customers", err); setCustomerOptions([]); }
        finally { setIsCustomerLoading(false); }
    }, 300), [customerOpen]);

    const fetchProducts = useCallback(debounce(async (input) => {
        if (!input && !productOpen) return;
        setIsProductLoading(true);
        try {
            const response = await api.get(`/products?search=${input}`);
            const availableProducts = response.data.filter(p => p.quantity > 0);
            setProductOptions(availableProducts);
        } catch (err) { console.error("Failed fetch products", err); setProductOptions([]); }
        finally { setIsProductLoading(false); }
    }, 300), [productOpen]);

    // --- Effects to trigger fetches ---
    useEffect(() => { fetchCustomers(customerInput); }, [customerInput, fetchCustomers]);
    useEffect(() => { fetchProducts(productInput); }, [productInput, fetchProducts]);

    // --- Validation Functions ---
    const validateAddItem = () => {
        const errors = {};
        const numQuantity = parseInt(quantity);
        if (!selectedProduct) errors.product = 'Select product.';
        if (!quantity || isNaN(numQuantity) || !Number.isInteger(numQuantity) || numQuantity <= 0) errors.quantity = 'Invalid quantity.';
        else if (selectedProduct) {
            const existingItem = saleItems.find(item => item._id === selectedProduct._id);
            const currentCartQty = existingItem ? existingItem.quantity : 0;
            if (numQuantity + currentCartQty > selectedProduct.quantity) errors.quantity = `Max ${selectedProduct.quantity - currentCartQty} more available.`;
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateSubmitSale = () => {
        const errors = {};
        if (!isRandomCustomer && !selectedCustomer) errors.customer = 'Select customer or mark random.';
        if (saleItems.length === 0) errors.items = 'Add at least one item.';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // --- Event Handlers ---
    const handleAddItem = () => {
        if (!validateAddItem()) return;
        const newQuantity = parseInt(quantity);
        const existingItem = saleItems.find(item => item._id === selectedProduct._id);
        if (existingItem) {
            setSaleItems(saleItems.map(item => item._id === selectedProduct._id ? { ...item, quantity: item.quantity + newQuantity } : item));
        } else {
            setSaleItems([...saleItems, { ...selectedProduct, quantity: newQuantity }]);
        }
        setSelectedProduct(null); setProductInput(''); setProductOptions([]); setQuantity('1'); setFormErrors({});
    };

    const handleRemoveItem = (itemIndexToRemove) => {
        setSaleItems(prevItems => prevItems.filter((_, index) => index !== itemIndexToRemove));
        if (formErrors.items) setFormErrors(prev => ({ ...prev, items: '' }));
    };

    // --- Sale Submission Mutation ---
    const submitSaleMutation = useMutation({
        mutationFn: createSaleApi,
        onSuccess: (createdTransaction) => {
            console.log("Submit Sale Mutation onSuccess - Received data:", createdTransaction);
            showSuccessToast('Sale completed successfully!');
            setSaleSubmitError(''); // Clear general error on success

            try {
                const transactionId = createdTransaction?._id; 
                console.log("Submit Sale Mutation extracted transactionId:", transactionId);
                if (!transactionId) throw new Error("Created transaction missing ID for receipt.");

                // Prepare receipt data locally
                const customerNameForReceipt = isRandomCustomer ? (createdTransaction.randomCustomerName || 'Random Customer') : selectedCustomer?.name || 'Customer';
                // Note: The backend returns full transaction data, but this client-side receipt prep relies on local saleItems for product names.
                const receiptData = { 
                    type: 'sale', 
                    customerName: customerNameForReceipt, 
                    items: saleItems.map(item => ({ name: item.name, quantity: item.quantity, price: item.price })), 
                    totalAmount: createdTransaction.amount, 
                    balanceBefore: createdTransaction.balanceBefore, 
                    balanceAfter: createdTransaction.balanceAfter, 
                    paymentMethod: createdTransaction.paymentMethod, 
                    date: createdTransaction.createdAt 
                };

                // --- Save temporarily and Open URL with ID ---
                sessionStorage.setItem('receiptData', JSON.stringify(receiptData)); 
                window.open(`/receipt/${transactionId}`, '_blank');

            } catch (receiptError) {
                console.error("Error preparing/opening receipt:", receiptError);
                showErrorToast({ message: `Sale saved, but failed to open receipt: ${receiptError.message}` });
            }

            // Invalidate necessary queries
            if (!isRandomCustomer && selectedCustomer?._id) {
                queryClient.invalidateQueries({ queryKey: ['customer', selectedCustomer._id] });
                queryClient.invalidateQueries({ queryKey: ['batches', selectedCustomer._id] });
                if (createdTransaction.batch) { 
                    queryClient.invalidateQueries({ queryKey: ['transactions', createdTransaction.batch] });
                }
            }
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
            queryClient.invalidateQueries({ queryKey: ['dashboardCharts'] });

            navigate('/'); // Navigate after success
        },
        onError: (err) => {
            let errorMessage = 'Failed to complete sale.'; 

            if (err.response?.status === 403) {
                // Specific check for Forbidden error (RBAC failure)
                errorMessage = "Permission Denied: Your role cannot make sales. Contact Admin.";
            } else if (err.response?.data?.error) {
                // General backend error message (e.g., from express-validator/controller)
                errorMessage = err.response.data.error;
            } else if (err.response?.data?.message) {
                 errorMessage = err.response.data.message;
            }

            // Set the general error state for display below the form
            setSaleSubmitError(errorMessage); 
            // Also display a global toast
            showErrorToast({ message: errorMessage }, 'Sale Failed');
        }
    });

    // --- Submit Handler ---
    const handleSubmitSale = () => {
        if (!validateSubmitSale()) return;
        setFormErrors({}); // Clear specific form errors
        setSaleSubmitError(''); // Clear previous general submission error

        const saleData = {
            isRandomCustomer: isRandomCustomer,
            isCashPayment: isCashPayment,
            items: saleItems.map(item => ({ productId: item._id, quantity: item.quantity })),
            randomCustomerName: isRandomCustomer ? randomCustomerName.trim() : undefined,
            customerId: (!isRandomCustomer && selectedCustomer) ? selectedCustomer._id : undefined
        };
        submitSaleMutation.mutate(saleData); // Trigger mutation
    };

    const totalAmount = saleItems.reduce((total, item) => total + ((item.price || 0) * (item.quantity || 0)), 0);

    // --- Render Logic ---
    return (
        <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
            <Typography variant="h4" component="h1" gutterBottom>Make a New Sale</Typography>

            {/* Customer Selection Paper */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>1. Select Customer</Typography>
                <FormControlLabel control={<Checkbox checked={isRandomCustomer} onChange={(e) => setIsRandomCustomer(e.target.checked)} />} label="Sell to Random Customer (Cash Only)" sx={{ mb: isRandomCustomer ? 0 : 2 }} />
                {isRandomCustomer && ( <TextField fullWidth label="Random Customer Name (Optional)" value={randomCustomerName} onChange={(e) => setRandomCustomerName(e.target.value)} sx={{ mb: 2, mt: 1 }} error={!!formErrors.randomName} helperText={formErrors.randomName || ''} /> )}
                <Autocomplete
                    open={customerOpen} onOpen={() => { setCustomerOpen(true); fetchCustomers(''); }} onClose={() => setCustomerOpen(false)} options={customerOptions} loading={isCustomerLoading} disabled={isRandomCustomer} getOptionLabel={(option) => `${option.name} - ${option.phone} (Bal: ${option.balance?.toFixed(2)})`} value={selectedCustomer} onChange={(event, newValue) => { setSelectedCustomer(newValue); if (newValue) setFormErrors(prev => ({ ...prev, customer: '' })); }} onInputChange={(event, newInputValue) => { setCustomerInput(newInputValue); }} isOptionEqualToValue={(option, value) => option._id === value._id}
                    renderInput={(params) => ( <TextField {...params} label={isRandomCustomer ? "Customer selection disabled" : "Search Registered Customers"} error={!!formErrors.customer} helperText={formErrors.customer || ''} InputProps={{ ...params.InputProps, endAdornment: (<> {isCustomerLoading ? <CircularProgress color="inherit" size={20} /> : null} {params.InputProps.endAdornment} </> ), }} /> )}
                    sx={{ display: isRandomCustomer ? 'none' : 'block' }}
                />
                 {formErrors.customer && !isRandomCustomer && <FormHelperText error sx={{ mt: 1 }}>{formErrors.customer}</FormHelperText>}
            </Paper>

            {/* Product Selection Paper */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>2. Select Products</Typography>
                <Autocomplete
                    open={productOpen} onOpen={() => { setProductOpen(true); fetchProducts(''); }} onClose={() => setProductOpen(false)} options={productOptions} loading={isProductLoading} getOptionLabel={(option) => `${option.name} (${option.sku}) - Stock: ${option.quantity}`} value={selectedProduct} onChange={(event, newValue) => { setSelectedProduct(newValue); if (newValue) setFormErrors(prev => ({ ...prev, product: '' })); }} onInputChange={(event, newInputValue) => { setProductInput(newInputValue); }} isOptionEqualToValue={(option, value) => option._id === value._id}
                    renderInput={(params) => ( <TextField {...params} label="Search Products (must have stock > 0)" error={!!formErrors.product} helperText={formErrors.product || ''} InputProps={{ ...params.InputProps, endAdornment: (<> {isProductLoading ? <CircularProgress color="inherit" size={20} /> : null} {params.InputProps.endAdornment} </> ), }} /> )}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start', mt: 2, gap: 2 }}>
                    <TextField
                        type="number" label="Quantity" value={quantity}
                        onChange={(e) => { setQuantity(e.target.value.replace(/[^0-9]/g, '')); if (formErrors.quantity) setFormErrors(prev => ({...prev, quantity: ''})); }}
                        size="small" sx={{ width: 100 }} inputProps={{ min: 1, step: 1 }}
                        error={!!formErrors.quantity} helperText={formErrors.quantity || ''}
                     />
                    <Button onClick={handleAddItem} variant="contained" disabled={!selectedProduct || isProductLoading || submitSaleMutation.isPending}>Add Item</Button>
                </Box>
            </Paper>

            {/* Sale Items Paper */}
            <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>3. Sale Items</Typography>
                {formErrors.items && <FormHelperText error sx={{ mb: 1 }}>{formErrors.items}</FormHelperText>}
                <TableContainer sx={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '4px' }}>
                    <Table size="small" stickyHeader>
                        <TableHead> <TableRow> <TableCell>Product</TableCell> <TableCell align="right">Quantity</TableCell> <TableCell align="right">Price</TableCell> <TableCell align="right">Subtotal</TableCell> <TableCell align="center">Remove</TableCell> </TableRow> </TableHead>
                        <TableBody>
                            {saleItems.length === 0 ? ( <TableRow><TableCell colSpan={5} align="center" sx={{py: 3}}>No items added yet.</TableCell></TableRow> )
                             : ( saleItems.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{item.name} ({item.sku})</TableCell>
                                        <TableCell align="right">{item.quantity}</TableCell>
                                        <TableCell align="right">{item.price?.toFixed(2) ?? 'N/A'}</TableCell>
                                        <TableCell align="right">{((item.price || 0) * (item.quantity || 0)).toFixed(2)}</TableCell>
                                        <TableCell align="center"> <IconButton onClick={() => handleRemoveItem(index)} color="error" size="small" disabled={submitSaleMutation.isPending}> <CloseIcon fontSize="small" /> </IconButton> </TableCell>
                                    </TableRow> ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                {saleItems.length > 0 && ( <> <Divider sx={{ my: 2, borderStyle: 'dashed' }} /> <Typography variant="h5" sx={{ textAlign: 'right', fontWeight: 'bold' }}>Total: TK {totalAmount.toFixed(2)}</Typography> </> )}
                
                {/* Display General Submission Error Here */}
                {saleSubmitError && <Typography color="error" sx={{ mt: 2 }}>{saleSubmitError}</Typography>} 

                <FormControlLabel control={<Checkbox checked={isCashPayment} onChange={(e) => setIsCashPayment(e.target.checked)} disabled={isRandomCustomer || submitSaleMutation.isPending} />} label="Paid in Cash 💵" sx={{ mt: 2, display: 'block' }} />
                <Button onClick={handleSubmitSale} variant="contained" color="success" size="large" fullWidth sx={{ mt: 2, py: 1.2 }} disabled={submitSaleMutation.isPending || saleItems.length === 0}>
                    {submitSaleMutation.isPending ? <CircularProgress size={24} color="inherit" /> : 'Complete Sale & Generate Receipt'}
                </Button>
            </Paper>
        </Box>
    );
};

export default MakeSalePage;