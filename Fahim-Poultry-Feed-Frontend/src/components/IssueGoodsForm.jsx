import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/api'; // Needed for product search
import { debounce } from '@mui/material/utils';

// MUI Imports
import { Paper, Typography, Box, Button, TextField, Autocomplete, Checkbox, FormControlLabel, Divider, IconButton, CircularProgress, FormHelperText } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

// Import notification utilities (optional, as parent handles mutation toasts)
// import { showErrorToast, showSuccessToast } from '../utils/notifications.js';

// Component receives mutation trigger function and loading state as props
const IssueGoodsForm = ({ customer, onIssueGoodsSubmit, isSubmitting }) => {

    // State for the form
    const [saleItems, setSaleItems] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantity, setQuantity] = useState('1'); // Use string for input
    const [isCashPayment, setIsCashPayment] = useState(false);
    const [formErrors, setFormErrors] = useState({}); // { product, quantity, items, general }

    // State for Autocomplete
    const [open, setOpen] = useState(false);
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false); // Autocomplete loading
    const [inputValue, setInputValue] = useState(''); // Autocomplete input text

    // Calculate total amount dynamically
    const totalAmount = saleItems.reduce((total, item) => total + (item.price * item.quantity), 0);

    // Debounced product search function
    const fetchProducts = useCallback(
        debounce(async (input) => {
            // Avoid fetching when closed unless explicitly opened with empty input
            if (!input && !open) {
                setOptions([]);
                return;
            }
            setLoading(true);
            try {
                const response = await api.get(`/products?search=${input}`);
                const availableProducts = response.data.filter(p => p.quantity > 0);
                setOptions(availableProducts);
            } catch (err) {
                console.error("Failed to search products", err);
                setOptions([]);
                setFormErrors(prev => ({ ...prev, product: 'Could not fetch products.' })); // Inform user
            } finally {
                setLoading(false);
            }
        }, 300),
        [open] // Recreate if 'open' state changes
    );

    // Effect to trigger product search
    useEffect(() => {
        fetchProducts(inputValue);
    }, [inputValue, fetchProducts]);

    // --- Validation Functions ---
    const validateAddItem = () => {
        const errors = {};
        const numQuantity = parseInt(quantity);

        if (!selectedProduct) {
            errors.product = 'Please select a product.';
        }
        if (!quantity || isNaN(numQuantity) || !Number.isInteger(numQuantity) || numQuantity <= 0) {
            errors.quantity = 'Enter positive whole quantity.';
        } else if (selectedProduct) {
            const totalStock = selectedProduct.quantity;
            const existingItem = saleItems.find(item => item._id === selectedProduct._id);
            const existingCartQty = existingItem ? existingItem.quantity : 0;
            if (numQuantity + existingCartQty > totalStock) {
                const availableStock = totalStock - existingCartQty;
                errors.quantity = `Max ${availableStock} more available.`;
            }
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateIssueGoods = () => {
        if (saleItems.length === 0) {
            setFormErrors({ items: 'Please add at least one item to issue.' });
            return false;
        }
        return true;
    };

    // --- Event Handlers ---
    const handleAddItem = () => {
        if (!validateAddItem()) return;

        const newQuantity = parseInt(quantity);
        const existingItem = saleItems.find(item => item._id === selectedProduct._id);

        if (existingItem) {
            setSaleItems(saleItems.map(item =>
                item._id === selectedProduct._id
                    ? { ...item, quantity: item.quantity + newQuantity }
                    : item
            ));
        } else {
            // Add full product details needed for receipt later
            setSaleItems([...saleItems, {
                _id: selectedProduct._id,
                name: selectedProduct.name,
                sku: selectedProduct.sku,
                price: selectedProduct.price, // Price per unit
                quantity: newQuantity
            }]);
        }
        // Reset form
        setSelectedProduct(null);
        setInputValue('');
        setOptions([]);
        setQuantity('1');
        setFormErrors({}); // Clear errors
    };

    const handleRemoveItem = (itemIndexToRemove) => {
        setSaleItems(prevItems => prevItems.filter((_, index) => index !== itemIndexToRemove));
        if (formErrors.items) setFormErrors(prev => ({ ...prev, items: '' })); // Clear item list error
    };

    const handleIssueGoods = () => {
        if (!validateIssueGoods()) return;
        setFormErrors({}); // Clear validation errors before submit

        const saleData = {
            customerId: customer._id,
            items: saleItems.map(item => ({ productId: item._id, quantity: item.quantity })),
            isCashPayment: isCashPayment,
            isRandomCustomer: false,
        };

        // Call the mutation function passed from the parent
        // Pass original saleItems details needed for the receipt
        onIssueGoodsSubmit(saleData, saleItems);

        // Reset local form state Optimistically (or wait for parent's onSuccess)
        // Parent (`CustomerDetailsPage`) handles invalidation and might reset state too
        setSaleItems([]);
        setIsCashPayment(false);
        setQuantity('1');
        setSelectedProduct(null);
        setInputValue('');
        setOptions([]);
    };

    // --- Render Logic ---
    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Issue Items to Customer</Typography>
            {/* Product Autocomplete */}
            <Autocomplete
                open={open}
                onOpen={() => { setOpen(true); if (!inputValue) fetchProducts(''); }} // Fetch on open if empty
                onClose={() => setOpen(false)}
                options={options}
                loading={loading}
                getOptionLabel={(option) => `${option.name} (${option.sku}) - Stock: ${option.quantity}`}
                value={selectedProduct}
                onChange={(event, newValue) => {
                    setSelectedProduct(newValue);
                    if (newValue) setFormErrors(prev => ({ ...prev, product: '' }));
                }}
                onInputChange={(event, newInputValue) => { setInputValue(newInputValue); }}
                isOptionEqualToValue={(option, value) => option?._id === value?._id}
                renderInput={(params) =>
                    <TextField
                        {...params}
                        label="Search Product (Stock > 0)"
                        error={!!formErrors.product}
                        helperText={formErrors.product || ''}
                        InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                                <> {loading ? <CircularProgress color="inherit" size={20} /> : null} {params.InputProps.endAdornment} </>
                            ),
                        }}
                    />}
                sx={{ mb: 1 }} // Add margin bottom
            />
            {/* Quantity Input and Add Button */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mt: 2 }}>
                <TextField
                    type="number" label="Quantity" value={quantity}
                    onChange={(e) => {
                        setQuantity(e.target.value.replace(/[^0-9]/g, ''));
                        if (formErrors.quantity) setFormErrors(prev => ({ ...prev, quantity: '' }));
                    }}
                    size="small" inputProps={{ min: 1, step: 1 }} sx={{ width: 120 }}
                    error={!!formErrors.quantity} helperText={formErrors.quantity || ''}
                    disabled={isSubmitting} // Disable when submitting
                />
                <Button onClick={handleAddItem} variant="contained" disabled={!selectedProduct || loading || isSubmitting}>
                    Add Item
                </Button>
            </Box>

            {/* Item list error */}
            {formErrors.items && <FormHelperText error sx={{ mt: 1 }}>{formErrors.items}</FormHelperText>}

            {/* Sale Items List */}
            {saleItems.length > 0 && (
                <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1">Items to Issue:</Typography>
                    <Box sx={{ my: 1, maxHeight: '200px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '4px' }}>
                        {saleItems.map((item, index) => (
                            <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderBottom: index !== saleItems.length - 1 ? '1px solid #eee' : 'none' }}>
                                <Typography variant="body2">{item.quantity} x {item.name} @ {item.price?.toFixed(2) ?? 'N/A'}</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" sx={{ minWidth: '70px', textAlign: 'right', fontWeight: 'medium' }}>TK {(item.price * item.quantity).toFixed(2)}</Typography>
                                    <IconButton onClick={() => handleRemoveItem(index)} size="small" aria-label="remove item" color="error" disabled={isSubmitting}>
                                        <CloseIcon fontSize="inherit" />
                                    </IconButton>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                    <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
                    <Typography variant="h6" sx={{ textAlign: 'right', fontWeight: 'bold' }}>
                        Final Total: TK {totalAmount.toFixed(2)}
                    </Typography>
                </Box>
            )}

            {/* General submission error */}
            {formErrors.general && <Typography color="error" sx={{ mt: 2 }}>{formErrors.general}</Typography>}

            {/* Cash Payment Checkbox */}
            <FormControlLabel
                control={<Checkbox checked={isCashPayment} onChange={(e) => setIsCashPayment(e.target.checked)} disabled={isSubmitting} />}
                label="Paid in Cash 💵"
                sx={{ mt: 2, display: 'block' }}
            />
            {/* Submit Button */}
            <Button
                onClick={handleIssueGoods}
                variant="contained" color="success" fullWidth
                sx={{ mt: 1, py: 1.2 }}
                disabled={isSubmitting || saleItems.length === 0} // Use prop for loading state
            >
                {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Confirm and Issue Items'}
            </Button>
        </Paper>
    );
};

export default IssueGoodsForm;