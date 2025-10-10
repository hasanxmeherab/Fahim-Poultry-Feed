import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { Paper, Typography, Box, Button, TextField, Autocomplete, Checkbox, FormControlLabel, Divider, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

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

    // --- NEW: Calculate total amount ---
    const totalAmount = saleItems.reduce((total, item) => total + (item.price * item.quantity), 0);

    useEffect(() => {
        let active = true;
        if (!open) { return undefined; }
        const timer = setTimeout(async () => {
            setLoading(true);
            try {
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

        // Check if the product already exists in the cart
        const existingItem = saleItems.find(item => item._id === selectedProduct._id);

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
    const saleData = {
        customerId: customer._id,
        items: saleItems.map(item => ({ productId: item._id, quantity: item.quantity })),
        isCashPayment: isCashPayment,
    };

    try {
        // 1. Capture the response from the server to get sale details
        const response = await api.post('/sales', saleData);
        const newSale = response.data;

        // 2. Prepare the data for the receipt page
        const balanceBefore = customer.balance;
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

        // 3. Save the data and open the receipt in a new tab
        sessionStorage.setItem('receiptData', JSON.stringify(receiptData));
        window.open('/receipt', '_blank');

        // 4. Refresh the page data and clear the form
        onSaleSuccess();
        setSaleItems([]);
        setError('');

    } catch (err) {
        setError(err.response?.data?.error || 'Failed to issue items.');
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
                onChange={(event, newValue) => { setOptions(newValue ? [newValue, ...options] : options); setSelectedProduct(newValue); }}
                onInputChange={(event, newInputValue) => { setInputValue(newInputValue); }}
                isOptionEqualToValue={(option, value) => option._id === value._id}
                renderInput={(params) => <TextField {...params} label="Search for a Product" />}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                <TextField type="number" label="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} size="small" />
                <Button onClick={handleAddItem} variant="contained">Add Item</Button>
            </Box>
            
            {/* --- UPDATED: Item list and total display --- */}
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
            <Button onClick={handleIssueGoods} variant="contained" color="success" fullWidth sx={{ mt: 1 }}>
                Confirm and Issue Items
            </Button>
        </Paper>
    );
};

export default IssueGoodsForm;