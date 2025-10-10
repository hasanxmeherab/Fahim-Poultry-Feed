import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';

// MUI Imports
import {
    Box, Button, Typography, TextField, Table,
    TableBody, TableCell, TableContainer, TableHead,
    TableRow, Paper, CircularProgress, Autocomplete,
    Checkbox, FormControlLabel, Divider, IconButton 
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const MakeSalePage = () => {
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    const [saleItems, setSaleItems] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const [isRandomCustomer, setIsRandomCustomer] = useState(false);
    const [isCashPayment, setIsCashPayment] = useState(false);
    const [randomCustomerName, setRandomCustomerName] = useState('');

    // State for Async Customer Search
    const [customerOpen, setCustomerOpen] = useState(false);
    const [customerOptions, setCustomerOptions] = useState([]);
    const [customerInput, setCustomerInput] = useState('');
    const customerLoading = customerOpen && customerOptions.length === 0;

    // State for Async Product Search
    const [productOpen, setProductOpen] = useState(false);
    const [productOptions, setProductOptions] = useState([]);
    const [productInput, setProductInput] = useState('');
    const productLoading = productOpen && productOptions.length === 0;

    useEffect(() => {
        if (isRandomCustomer) {
            setIsCashPayment(true);
        }
    }, [isRandomCustomer]);

    // Effect for fetching customers
    useEffect(() => {
        if (!customerOpen) return;
        const timer = setTimeout(async () => {
            const response = await api.get(`/customers?search=${customerInput}`);
            setCustomerOptions(response.data);
        }, 500);
        return () => clearTimeout(timer);
    }, [customerInput, customerOpen]);

    // Effect for fetching products
    useEffect(() => {
        if (!productOpen) return;
        const timer = setTimeout(async () => {
            const response = await api.get(`/products?search=${productInput}`);
            setProductOptions(response.data);
        }, 500);
        return () => clearTimeout(timer);
    }, [productInput, productOpen]);


    const handleAddItem = () => {
        if (!selectedProduct || quantity <= 0) {
            setError('Please select a product and enter a valid quantity.');
            return;
        }

        const newQuantity = Number(quantity);
        
        // Check if the product already exists in the cart
        const existingItem = saleItems.find(item => item._id === selectedProduct._id);

        if (existingItem) {
            // If it exists, update the quantity
            setSaleItems(
                saleItems.map(item =>
                    item._id === selectedProduct._id
                        ? { ...item, quantity: item.quantity + newQuantity }
                        : item
                )
            );
        } else {
            // If it doesn't exist, add it as a new item
            setSaleItems([...saleItems, { ...selectedProduct, quantity: newQuantity }]);
        }

        // Reset form fields
        setSelectedProduct(null);
        // We don't reset productInput here to allow for faster searching
        setQuantity(1);
        setError(null);
    };

    const handleRemoveItem = (itemIndexToRemove) => {
        setSaleItems(prevItems => prevItems.filter((_, index) => index !== itemIndexToRemove));
    };

    const handleSubmitSale = async () => {
        if (!isRandomCustomer && !selectedCustomerId) {
            setError('Please select a customer or mark as a random customer sale.');
            return;
        }
        if (saleItems.length === 0) {
            setError('Please add at least one item.');
            return;
        }

        const saleData = {
            isRandomCustomer: isRandomCustomer,
            isCashPayment: isCashPayment,
            items: saleItems.map(item => ({ productId: item._id, quantity: item.quantity })),
            randomCustomerName: randomCustomerName,
        };

        if (!isRandomCustomer) {
            saleData.customerId = selectedCustomerId._id;
        }

        try {
            const response = await api.post('/sales', saleData);
            const customerName = isRandomCustomer ? (randomCustomerName || 'Random Customer') : selectedCustomerId.name;
            const balanceBefore = isRandomCustomer ? 0 : selectedCustomerId.balance;
            const balanceAfter = (isRandomCustomer || isCashPayment) ? balanceBefore : balanceBefore - response.data.totalAmount;

            const receiptData = {
                type: 'sale',
                customerName: customerName,
                items: saleItems,
                totalAmount: response.data.totalAmount,
                balanceBefore: balanceBefore,
                balanceAfter: balanceAfter,
                paymentMethod: isCashPayment ? 'Cash' : 'Credit',
                date: response.data.createdAt,
            };

            sessionStorage.setItem('receiptData', JSON.stringify(receiptData));
            window.open('/receipt', '_blank');
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to complete sale.');
        }
    };

    const totalAmount = saleItems.reduce((total, item) => total + (item.price * item.quantity), 0);

    return (
        <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
            <Typography variant="h4" component="h1" gutterBottom>Make a New Sale</Typography>
            
            <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>1. Select Customer</Typography>
                <FormControlLabel
                    control={<Checkbox checked={isRandomCustomer} onChange={(e) => setIsRandomCustomer(e.target.checked)} />}
                    label="Sell to Random Customer (Cash Only)" sx={{ mb: 2 }}
                />
                {isRandomCustomer && ( <TextField fullWidth label="Random Customer Name (Optional)" value={randomCustomerName} onChange={(e) => setRandomCustomerName(e.target.value)} sx={{ mb: 2 }} /> )}
                <Autocomplete
                    open={customerOpen}
                    onOpen={() => setCustomerOpen(true)}
                    onClose={() => setCustomerOpen(false)}
                    options={customerOptions}
                    loading={customerLoading}
                    disabled={isRandomCustomer}
                    getOptionLabel={(option) => `${option.name} - (Balance: ${option.balance.toFixed(2)})`}
                    value={selectedCustomerId}
                    onChange={(event, newValue) => setSelectedCustomerId(newValue)}
                    onInputChange={(event, newInputValue) => setCustomerInput(newInputValue)}
                    isOptionEqualToValue={(option, value) => option._id === value._id}
                    renderInput={(params) => <TextField {...params} label="Search Registered Customers" InputProps={{ ...params.InputProps, endAdornment: (<>{customerLoading ? <CircularProgress color="inherit" size={20} /> : null}{params.InputProps.endAdornment}</>),}} />}
                />
            </Paper>

            <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>2. Select Products</Typography>
                <Autocomplete
                    open={productOpen}
                    onOpen={() => setProductOpen(true)}
                    onClose={() => setProductOpen(false)}
                    options={productOptions}
                    loading={productLoading}
                    getOptionLabel={(option) => `${option.name} - (In Stock: ${option.quantity})`}
                    value={selectedProduct}
                    onChange={(event, newValue) => setSelectedProduct(newValue)}
                    onInputChange={(event, newInputValue) => setProductInput(newInputValue)}
                    isOptionEqualToValue={(option, value) => option._id === value._id}
                    renderInput={(params) => <TextField {...params} label="Search Products" InputProps={{ ...params.InputProps, endAdornment: (<>{productLoading ? <CircularProgress color="inherit" size={20} /> : null}{params.InputProps.endAdornment}</>),}} />}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 2, gap: 2 }}>
                    <TextField type="number" label="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} size="small" sx={{ width: 100 }} />
                    <Button onClick={handleAddItem} variant="contained">Add Item</Button>
                </Box>
            </Paper>

            <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>3. Sale Items</Typography>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Product</TableCell>
                                <TableCell align="right">Quantity</TableCell>
                                <TableCell align="right">Price</TableCell>
                                <TableCell align="right">Subtotal</TableCell>
                                <TableCell align="center">Remove</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {saleItems.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell align="right">{item.quantity}</TableCell>
                                    <TableCell align="right">{item.price.toFixed(2)}</TableCell>
                                    <TableCell align="right">{(item.price * item.quantity).toFixed(2)}</TableCell>
                                    <TableCell align="center">
                                        <IconButton onClick={() => handleRemoveItem(index)} color="error" size="small" aria-label="remove item">
                                            <CloseIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h5" sx={{ textAlign: 'right', fontWeight: 'bold' }}>Total: TK {totalAmount.toFixed(2)}</Typography>

                {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
                
                <FormControlLabel
                    control={<Checkbox checked={isCashPayment} onChange={(e) => setIsCashPayment(e.target.checked)} disabled={isRandomCustomer} />}
                    label="Paid in Cash 💵" sx={{ mt: 2, display: 'block' }}
                />
                
                <Button onClick={handleSubmitSale} variant="contained" color="success" size="large" fullWidth sx={{ mt: 2 }}>
                    Complete Sale
                </Button>
            </Paper>
        </Box>
    );
};

export default MakeSalePage;