import React, { useState, useEffect } from 'react';
import api from '../api/api.js';
import { useParams } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import {
    Box, Button, Typography, TextField, Table,
    TableBody, TableCell, TableContainer, TableHead,
    TableRow, Paper, CircularProgress, Select, MenuItem,
    FormControl, InputLabel, Checkbox, FormControlLabel,
    Pagination, Divider, IconButton 
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const WholesaleBuyerDetailsPage = () => {
    const { id } = useParams();
    const [buyer, setBuyer] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [filterDate, setFilterDate] = useState('');

    const [wholesaleProducts, setWholesaleProducts] = useState([]);
    const [saleItems, setSaleItems] = useState([]);
    const [newItem, setNewItem] = useState({ name: '', quantity: '1', weight: '', pricePerKg: '' });
    const [isCashPayment, setIsCashPayment] = useState(false);
    const [formError, setFormError] = useState('');
    
    const fetchDetails = async () => {
        try {
            let transUrl = `/transactions/wholesale-buyer/${id}?page=${page}`;
            if (filterDate) {
                transUrl += `&date=${filterDate}`;
            }
            const [buyerRes, transRes, productsRes] = await Promise.all([
                api.get(`/wholesale-buyers/${id}`),
                api.get(transUrl),
                api.get('/wholesale-products')
            ]);
            setBuyer(buyerRes.data);
            setTransactions(transRes.data.transactions);
            setTotalPages(transRes.data.totalPages);
            setWholesaleProducts(productsRes.data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch details.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setIsLoading(true);
        fetchDetails();
    }, [id, page, filterDate]);

    const newItemTotalPrice = (parseFloat(newItem.weight) || 0) * (parseFloat(newItem.pricePerKg) || 0);
    const saleTotal = saleItems.reduce((acc, item) => acc + item.totalPrice, 0);

    const handleNewItemChange = (e) => {
        setNewItem({ ...newItem, [e.target.name]: e.target.value });
    };

    const handleAddItemToSale = () => {
        if (!newItem.name || !newItem.quantity || !newItem.weight || !newItem.pricePerKg) {
            setFormError('All fields are required for each item.');
            return;
        }
        const itemToAdd = { ...newItem, totalPrice: newItemTotalPrice };
        setSaleItems([...saleItems, itemToAdd]);
        setNewItem({ name: '', quantity: '1', weight: '', pricePerKg: '' });
        setFormError('');
    };

    const handleRemoveItemFromSale = (itemIndexToRemove) => {
        setSaleItems(saleItems.filter((_, index) => index !== itemIndexToRemove));
    };

    const handleSubmitSale = async () => {
        if (saleItems.length === 0) {
            setFormError('You must add at least one item to the sale.');
            return;
        }
        const payload = {
            wholesaleBuyerId: id,
            items: saleItems.map(item => ({ name: item.name, quantity: Number(item.quantity) || 0, weight: Number(item.weight) || 0, price: item.totalPrice })),
            isCashPayment: isCashPayment,
        };
        try {
            const response = await api.post('/sales/wholesale', payload);
            const newTransaction = response.data;
            toast.success('Wholesale sale created successfully!');
            const receiptData = { type: 'wholesale_sale', customerName: buyer.name, items: newTransaction.customItems, totalAmount: newTransaction.amount, balanceBefore: newTransaction.balanceBefore, balanceAfter: newTransaction.balanceAfter, date: newTransaction.createdAt };
            sessionStorage.setItem('receiptData', JSON.stringify(receiptData));
            window.open('/receipt', '_blank');
            setSaleItems([]);
            fetchDetails();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to complete sale.');
        }
    };
    
    const handleViewReceipt = (transaction) => {
        let receiptData = {};
        const buyerName = buyer ? buyer.name : 'N/A';
        if (transaction.type === 'WHOLESALE_SALE') {
            receiptData = { type: 'wholesale_sale', customerName: buyerName, items: transaction.customItems, totalAmount: transaction.amount, balanceBefore: transaction.balanceBefore, balanceAfter: transaction.balanceAfter, date: transaction.createdAt, paymentMethod: transaction.paymentMethod };
        } else if (['DEPOSIT', 'WITHDRAWAL'].includes(transaction.type)) {
            receiptData = { type: 'deposit', customerName: buyerName, depositAmount: transaction.amount, balanceBefore: transaction.balanceBefore, balanceAfter: transaction.balanceAfter, date: transaction.createdAt };
        } else { return; }
        sessionStorage.setItem('receiptData', JSON.stringify(receiptData));
        window.open('/receipt', '_blank');
    };

    const renderDetail = (t) => {
        if (t.type === 'WHOLESALE_SALE' && t.paymentMethod === 'Cash') {
            return `${t.notes} (Paid in Cash)`;
        }
        return t.notes;
    };
    
    if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    if (error) return <Typography color="error">{error}</Typography>;
    if (!buyer) return <Typography>Buyer not found.</Typography>;

    return (
        <Box sx={{ p: 3 }}>
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
            <Typography variant="h4" gutterBottom>{buyer.name}</Typography>
            
            <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6">Buyer Information</Typography>
                <Typography><strong>Business Name:</strong> {buyer.businessName || 'N/A'}</Typography>
                <Typography><strong>Phone:</strong> {buyer.phone}</Typography>
                <Typography variant="h5" sx={{ mt: 1, color: buyer.balance < 0 ? 'error.main' : 'inherit' }}>
                    <strong>Current Balance:</strong> TK {buyer.balance.toFixed(2)}
                </Typography>
            </Paper>

            <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Make a Wholesale Sale 🛒</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr 1fr', gap: '10px', alignItems: 'center' }}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Product</InputLabel>
                        <Select name="name" label="Product" value={newItem.name} onChange={handleNewItemChange}>
                            {wholesaleProducts.map(product => (<MenuItem key={product._id} value={product.name}>{product.name}</MenuItem>))}
                        </Select>
                    </FormControl>
                    <TextField size="small" type="number" name="quantity" label="Quantity" value={newItem.quantity} onChange={handleNewItemChange} />
                    <TextField size="small" type="number" name="weight" label="Weight (kg)" value={newItem.weight} onChange={handleNewItemChange} />
                    <TextField size="small" type="number" name="pricePerKg" label="Price/kg (TK)" value={newItem.pricePerKg} onChange={handleNewItemChange} />
                    <Button onClick={handleAddItemToSale} variant="contained">Add</Button>
                </Box>
                <Box sx={{ textAlign: 'right', mt: 1, fontWeight: 'bold' }}>Item Total: TK {newItemTotalPrice.toFixed(2)}</Box>

                {saleItems.length > 0 && ( 
                    <Box sx={{mt: 2}}> 
                    <Typography variant="subtitle1">Items to Sell</Typography> 
                    {saleItems.map((item, index) => ( 
                        <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}> 
                        <Typography variant="body2">{item.name} ({item.quantity} units, {item.weight}kg @ {item.pricePerKg}/kg)</Typography> 
                        <Typography variant="body2">TK {item.totalPrice.toFixed(2)}</Typography> 
                        <IconButton onClick={() => handleRemoveItemFromSale(index)} size="small" aria-label="remove item">
                                        <CloseIcon fontSize="small" />
                                    </IconButton>
                        </Box> 
                    ))} 
                        <Divider sx={{ my: 1 }} /> 
                        <Typography variant="h6" sx={{ textAlign: 'right' }}>Final Total: TK {saleTotal.toFixed(2)}</Typography> </Box> )}
                <FormControlLabel control={<Checkbox checked={isCashPayment} onChange={(e) => setIsCashPayment(e.target.checked)} />} label="Paid in Cash 💵" sx={{ mt: 1 }} />
                {formError && <Typography color="error" sx={{ mt: 1 }}>{formError}</Typography>}
                <Button onClick={handleSubmitSale} variant="contained" color="success" fullWidth sx={{ mt: 2 }}>Complete Sale</Button>
            </Paper>

            <Paper>
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5">Transaction History</Typography>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <TextField label="Filter by Date" type="date" size="small" value={filterDate} onChange={(e) => { setPage(1); setFilterDate(e.target.value); }} InputLabelProps={{ shrink: true }} />
                        <Button size="small" onClick={() => { setPage(1); setFilterDate(''); }}>Clear</Button>
                    </Box>
                </Box>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ '& th': { backgroundColor: '#f4f6f8', fontWeight: 'bold' } }}>
                                <TableCell>Date</TableCell><TableCell>Type</TableCell><TableCell>Details</TableCell><TableCell align="right">Amount (TK)</TableCell><TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {transactions.map((t) => (
                                <TableRow key={t._id} hover>
                                    <TableCell>{new Date(t.createdAt).toLocaleString()}</TableCell>
                                    <TableCell>{t.type}</TableCell>
                                    <TableCell>{renderDetail(t)}</TableCell>
                                    <TableCell align="right" sx={{ color: ['WITHDRAWAL', 'WHOLESALE_SALE'].includes(t.type) ? 'error.main' : 'success.main' }}>{t.amount.toFixed(2)}</TableCell>
                                    <TableCell>{['WHOLESALE_SALE', 'DEPOSIT', 'WITHDRAWAL'].includes(t.type) && (<Button onClick={() => handleViewReceipt(t)} size="small" variant="outlined">Receipt</Button>)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                {totalPages > 1 && (<Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}><Pagination count={totalPages} page={page} onChange={(e, value) => setPage(value)} color="primary" /></Box>)}
            </Paper>
        </Box>
    );
};

export default WholesaleBuyerDetailsPage;