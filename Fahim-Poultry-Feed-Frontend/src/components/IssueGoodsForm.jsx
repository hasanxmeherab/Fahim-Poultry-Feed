import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { Paper, Typography, Box, Button, TextField, Autocomplete, Checkbox, FormControlLabel, Divider, IconButton, CircularProgress  } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { showErrorToast, showSuccessToast } from '../utils/notifications.js'; // Import notification utilities

const IssueGoodsForm = ({ customer, onSaleSuccess }) => {
    const [saleItems, setSaleItems] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [open, setOpen] = useState(false);
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isCashPayment, setIsCashPayment] = useState(false);
    const [error, setError] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // --- NEW: Calculate total amount ---
    const totalAmount = saleItems.reduce((total, item) => total + (item.price * item.quantity), 0);

    useEffect(() => {
        let active = true;
        if (!open) { return undefined; }
        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                // Fetch products based on search input (Debounced Search)
                const response = await api.get(`/products?search=${inputValue}`);
                if (active) { setOptions(response.data); }
            } catch (err) { console.error("Failed to search products"); }
            setLoading(false);
        }, 500);
        return () => { active = false; clearTimeout(timer); };
    }, [inputValue, open]);

    const handleAddItem = () => {
        if (!selectedProduct || quantity <= 0) {
            setError('Please select a product and enter a valid quantity.');
            return;
        }

        const newQuantity = Number(quantity);

        // Client-side Stock Check (Crucial for UX)
        const totalStock = selectedProduct.quantity;
        const existingItem = saleItems.find(item => item._id === selectedProduct._id);
        const existingCartQty = existingItem ? existingItem.quantity : 0;
        
        if (newQuantity + existingCartQty > totalStock) {
            setError(`Insufficient stock. Only ${totalStock} available.`);
            return;
        }

        if (existingItem) {
            // If it exists, map over the array and update the quantity of the matching item
            setSaleItems(
                saleItems.map(item =>
                    item._id === selectedProduct._id
                        ? { ...item, quantity: item.quantity + newQuantity }
                        : item
                )
            );
        } else {
            // If it doesn't exist, add it as a new item to the array
            setSaleItems([...saleItems, { ...selectedProduct, quantity: newQuantity }]);
        }

        // Reset the form fields after adding
        setSelectedProduct(null);
        setInputValue('');
        setQuantity(1);
        setError('');
    };

    const handleRemoveItem = (itemIndexToRemove) => {
        setSaleItems(prevItems => prevItems.filter((_, index) => index !== itemIndexToRemove));
    };

    const handleIssueGoods = async () => {
        if (saleItems.length === 0) {
            setError('Please add at least one item to issue.');
            return;
        }
        setIsLoading(true);
        // Prepare the payload for the backend
        const saleData = {
            customerId: customer._id,
            items: saleItems.map(item => ({ productId: item._id, quantity: item.quantity })),
            isCashPayment: isCashPayment,
            // isRandomCustomer is implicitly false here as this form targets a specific customer
        };

        try {
            // 1. Post the sale transaction
            const response = await api.post('/sales', saleData);
            const newSale = response.data;
            
            // 2. SUCCESS NOTIFICATION
            showSuccessToast('Items issued and transaction recorded!');

            // 3. Prepare the data for the receipt page
            const balanceBefore = customer.balance;
            // Calculate new balance based on payment type
            const balanceAfter = isCashPayment ? balanceBefore : balanceBefore - newSale.totalAmount;

            const receiptData = {
                type: 'sale',
                customerName: customer.name,
                items: saleItems, // Use the detailed saleItems from the component's state
                totalAmount: newSale.totalAmount,
                balanceBefore: balanceBefore,
                balanceAfter: balanceAfter,
                paymentMethod: isCashPayment ? 'Cash' : 'Credit',
                date: newSale.createdAt,
            };

            // 4. Save the data and open the receipt in a new tab
            sessionStorage.setItem('receiptData', JSON.stringify(receiptData));
            window.open('/receipt', '_blank');

            // 5. Refresh the customer data on the details page and clear the form
            onSaleSuccess();
            setSaleItems([]);
            setError('');

        } catch (err) {
            // Use showErrorToast for cleaner error display
            showErrorToast(err, 'Failed to issue items.'); 
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Issue Items to Customer</Typography>
            <Autocomplete
                open={open}
                onOpen={() => setOpen(true)}
                onClose={() => setOpen(false)}
                options={options}
                loading={loading}
                getOptionLabel={(option) => `${option.name} (In Stock: ${option.quantity})`}
                value={selectedProduct}
                onChange={(event, newValue) => { 
                    // Add the selected option to options if it wasn't there (for persistent label on close)
                    setOptions(newValue ? [newValue, ...options.filter(o => o._id !== newValue._id)] : options); 
                    setSelectedProduct(newValue); 
                }}
                onInputChange={(event, newInputValue) => { setInputValue(newInputValue); }}
                isOptionEqualToValue={(option, value) => option._id === value._id}
                renderInput={(params) => <TextField {...params} label="Search for a Product" />}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                <TextField 
                    type="number" 
                    label="Quantity" 
                    value={quantity} 
                    onChange={(e) => setQuantity(e.target.value)} 
                    size="small" 
                    inputProps={{ min: 1 }}
                />
                <Button onClick={handleAddItem} variant="contained">
                    Add Item
                </Button>
            </Box>
            
            {/* --- Item list and total display --- */}
            {saleItems.length > 0 && (
                <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1">Items to Issue:</Typography>
                    <Box sx={{ my: 1 }}>
                        {saleItems.map((item, index) => (
                            <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                <Typography variant="body2">{item.quantity} x {item.name} @ {item.price.toFixed(2)}</Typography>
                                <Typography variant="body2">TK {(item.price * item.quantity).toFixed(2)}</Typography>
                                <IconButton onClick={() => handleRemoveItem(index)} size="small" aria-label="remove item">
                                        <CloseIcon fontSize="small" />
                                    </IconButton>
                            </Box>
                        ))}
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="h6" sx={{ textAlign: 'right', fontWeight: 'bold' }}>
                        Final Total: TK {totalAmount.toFixed(2)}
                    </Typography>
                </Box>
            )}

            {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
            <FormControlLabel
                control={<Checkbox checked={isCashPayment} onChange={(e) => setIsCashPayment(e.target.checked)} />}
                label="Paid in Cash 💵"
                sx={{ mt: 2 }}
            />
             <Button 
              onClick={handleIssueGoods} 
              variant="contained" 
              color="success" 
              fullWidth 
              sx={{ mt: 1 }} 
              disabled={isLoading || saleItems.length === 0}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Confirm and Issue Items'}
            </Button>
        </Paper>
    );
};

export default IssueGoodsForm;